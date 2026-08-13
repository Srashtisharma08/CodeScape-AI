import ast
from typing import Dict, Any, List, Optional, Tuple
from execution.models import ExecutionStep, ExecutionTrace, VariableState
from execution.execution_ir import (
    ACTION_ASSIGN,
    ACTION_EVAL_EXPR,
    ACTION_EVAL_COND,
    ACTION_BRANCH,
    ACTION_LOOP_INIT,
    ACTION_LOOP_ITERATION,
    ACTION_LOOP_EXIT,
    ACTION_DEFINE_FUNC,
    ACTION_CALL_FUNC,
    ACTION_RETURN_FUNC,
    ACTION_OUTPUT,
    ACTION_ERROR,
    format_value_type,
)

MAX_EXECUTION_STEPS = 10000

class ReturnSignal(Exception):
    def __init__(self, value: Any, line: int = 1):
        self.value = value
        self.line = line

class BreakSignal(Exception):
    pass

class ContinueSignal(Exception):
    pass

class SafeFunction:
    def __init__(self, node: ast.FunctionDef, closure_env: Dict[str, Any]):
        self.node = node
        self.name = node.name
        self.closure_env = closure_env

class PythonExecutionEngine:
    def __init__(self, max_steps: int = MAX_EXECUTION_STEPS):
        self.max_steps = max_steps
        self.steps: List[ExecutionStep] = []
        self.output: List[str] = []
        self.globals_env: Dict[str, Any] = {}
        self.frames_stack: List[Dict[str, Any]] = []
        self.step_counter = 0
        self.limit_exceeded = False

    def execute(self, code: str) -> ExecutionTrace:
        self.steps = []
        self.output = []
        self.globals_env = {}
        self.frames_stack = []
        self.step_counter = 0
        self.limit_exceeded = False

        if not code or not code.strip():
            return ExecutionTrace(
                language="python",
                total_steps=0,
                status="completed",
                steps=[],
                final_state={},
                output=[],
            )

        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            return ExecutionTrace(
                language="python",
                total_steps=0,
                status="error",
                steps=[],
                final_state={},
                output=[],
                error_message=f"SyntaxError: {e.msg} at line {e.lineno}",
            )
        except Exception as e:
            return ExecutionTrace(
                language="python",
                total_steps=0,
                status="error",
                steps=[],
                final_state={},
                output=[],
                error_message=f"Parsing error: {str(e)}",
            )

        # Register safe built-ins
        self.globals_env.update(self._get_builtins())

        try:
            self._execute_body(tree.body)
            status = "limit_exceeded" if self.limit_exceeded else "completed"
            err_msg = "Maximum execution steps (10,000) exceeded." if self.limit_exceeded else None
        except ReturnSignal:
            status = "completed"
            err_msg = None
        except Exception as e:
            status = "error"
            err_msg = f"RuntimeError: {type(e).__name__}: {str(e)}"

        final_state = self._capture_state_snapshot()

        return ExecutionTrace(
            language="python",
            total_steps=len(self.steps),
            status=status,
            steps=self.steps,
            final_state=final_state,
            output=self.output,
            error_message=err_msg,
        )

    def _get_builtins(self) -> Dict[str, Any]:
        return {
            "range": range,
            "len": len,
            "str": str,
            "int": int,
            "float": float,
            "bool": bool,
            "abs": abs,
            "min": min,
            "max": max,
            "sum": sum,
            "list": list,
            "dict": dict,
            "set": set,
            "tuple": tuple,
            "print": self._custom_print,
        }

    def _custom_print(self, *args, **kwargs):
        sep = kwargs.get("sep", " ")
        text = sep.join(str(a) for a in args)
        self.output.append(text)
        return None

    def _get_active_env(self) -> Dict[str, Any]:
        if self.frames_stack:
            return self.frames_stack[-1]
        return self.globals_env

    def _capture_state_snapshot(self) -> Dict[str, VariableState]:
        env = self._get_active_env()
        snapshot = {}
        builtins = self._get_builtins()

        for k, v in env.items():
            if k in builtins:
                continue
            if isinstance(v, SafeFunction):
                snapshot[k] = VariableState(value=f"<function {v.name}>", type="function")
            elif callable(v):
                continue
            else:
                try:
                    # Ensure JSON serializable representation
                    if isinstance(v, (int, float, str, bool, list, dict, type(None))):
                        serializable_val = v
                    else:
                        serializable_val = str(v)
                    snapshot[k] = VariableState(value=serializable_val, type=format_value_type(v))
                except Exception:
                    snapshot[k] = VariableState(value=str(v), type=type(v).__name__)
        return snapshot

    def _add_step(
        self,
        node: ast.AST,
        action: str,
        description: str,
        variable: Optional[str] = None,
        expression: Optional[str] = None,
        value: Optional[Any] = None,
        result: Optional[Any] = None,
    ) -> bool:
        if self.step_counter >= self.max_steps:
            self.limit_exceeded = True
            return False

        self.step_counter += 1
        step_id = f"step-{self.step_counter:04d}"

        line_start = getattr(node, "lineno", 1)
        line_end = getattr(node, "end_lineno", line_start)
        column_start = getattr(node, "col_offset", 0) + 1
        column_end = getattr(node, "end_col_offset", column_start + 1) + 1

        step = ExecutionStep(
            id=step_id,
            step_index=self.step_counter,
            line_start=line_start,
            line_end=line_end,
            column_start=column_start,
            column_end=column_end,
            action=action,
            variable=variable,
            expression=expression,
            value=value,
            result=result,
            state=self._capture_state_snapshot(),
            description=description,
        )
        self.steps.append(step)
        return True

    def _execute_body(self, statements: List[ast.stmt]):
        for stmt in statements:
            if self.limit_exceeded:
                break
            self._execute_stmt(stmt)

    def _execute_stmt(self, stmt: ast.stmt):
        if isinstance(stmt, ast.Assign):
            self._exec_assign(stmt)
        elif isinstance(stmt, ast.AugAssign):
            self._exec_aug_assign(stmt)
        elif isinstance(stmt, ast.Expr):
            self._exec_expr_stmt(stmt)
        elif isinstance(stmt, ast.If):
            self._exec_if(stmt)
        elif isinstance(stmt, ast.For):
            self._exec_for(stmt)
        elif isinstance(stmt, ast.While):
            self._exec_while(stmt)
        elif isinstance(stmt, ast.FunctionDef):
            self._exec_func_def(stmt)
        elif isinstance(stmt, ast.Return):
            self._exec_return(stmt)
        elif isinstance(stmt, ast.Pass):
            pass
        elif isinstance(stmt, ast.Break):
            raise BreakSignal()
        elif isinstance(stmt, ast.Continue):
            raise ContinueSignal()
        else:
            # Fallback for generic statement
            val = self._eval_expr(stmt)

    def _exec_assign(self, stmt: ast.Assign):
        val = self._eval_expr(stmt.value)

        for target in stmt.targets:
            if isinstance(target, ast.Name):
                var_name = target.id
                self._get_active_env()[var_name] = val
                self._add_step(
                    node=stmt,
                    action=ACTION_ASSIGN,
                    variable=var_name,
                    value=val,
                    description=f"Assign {repr(val)} to variable {var_name}",
                )
            elif isinstance(target, (ast.Tuple, ast.List)):
                if isinstance(val, (list, tuple)) and len(val) == len(target.elts):
                    for elt, v in zip(target.elts, val):
                        if isinstance(elt, ast.Name):
                            var_name = elt.id
                            self._get_active_env()[var_name] = v
                            self._add_step(
                                node=stmt,
                                action=ACTION_ASSIGN,
                                variable=var_name,
                                value=v,
                                description=f"Assign {repr(v)} to variable {var_name}",
                            )

    def _exec_aug_assign(self, stmt: ast.AugAssign):
        if not isinstance(stmt.target, ast.Name):
            return

        var_name = stmt.target.id
        current_val = self._get_active_env().get(var_name, 0)
        operand_val = self._eval_expr(stmt.value)

        op = stmt.op
        if isinstance(op, ast.Add):
            new_val = current_val + operand_val
        elif isinstance(op, ast.Sub):
            new_val = current_val - operand_val
        elif isinstance(op, ast.Mult):
            new_val = current_val * operand_val
        elif isinstance(op, ast.Div):
            new_val = current_val / operand_val
        elif isinstance(op, ast.FloorDiv):
            new_val = current_val // operand_val
        elif isinstance(op, ast.Mod):
            new_val = current_val % operand_val
        elif isinstance(op, ast.Pow):
            new_val = current_val ** operand_val
        else:
            new_val = operand_val

        self._get_active_env()[var_name] = new_val
        self._add_step(
            node=stmt,
            action=ACTION_ASSIGN,
            variable=var_name,
            value=new_val,
            description=f"Update variable {var_name} -> {repr(new_val)}",
        )

    def _exec_expr_stmt(self, stmt: ast.Expr):
        # Check if call to print
        if isinstance(stmt.value, ast.Call) and isinstance(stmt.value.func, ast.Name) and stmt.value.func.id == "print":
            args_vals = [self._eval_expr(arg) for arg in stmt.value.args]
            out_str = " ".join(str(a) for a in args_vals)
            self.output.append(out_str)
            self._add_step(
                node=stmt,
                action=ACTION_OUTPUT,
                value=out_str,
                description=f"Output: {out_str}",
            )
        else:
            val = self._eval_expr(stmt.value)

    def _exec_if(self, stmt: ast.If):
        cond_val = self._eval_expr(stmt.test)
        cond_str = ast.unparse(stmt.test) if hasattr(ast, 'unparse') else "condition"

        self._add_step(
            node=stmt.test,
            action=ACTION_EVAL_COND,
            expression=cond_str,
            result=bool(cond_val),
            description=f"Condition '{cond_str}' evaluated to {bool(cond_val)}",
        )

        if cond_val:
            self._add_step(
                node=stmt,
                action=ACTION_BRANCH,
                description=f"Condition True: executing IF branch",
            )
            self._execute_body(stmt.body)
        elif stmt.orelse:
            self._add_step(
                node=stmt,
                action=ACTION_BRANCH,
                description=f"Condition False: executing ELSE branch",
            )
            self._execute_body(stmt.orelse)
        else:
            self._add_step(
                node=stmt,
                action=ACTION_BRANCH,
                description=f"Condition False: skipping IF block",
            )

    def _exec_for(self, stmt: ast.For):
        iter_val = self._eval_expr(stmt.iter)
        iter_name = stmt.target.id if isinstance(stmt.target, ast.Name) else "item"

        self._add_step(
            node=stmt,
            action=ACTION_LOOP_INIT,
            description=f"Initialize for loop over {iter_name}",
        )

        iteration_count = 0
        try:
            iterable = list(iter_val)
        except Exception:
            iterable = []

        for item in iterable:
            if self.limit_exceeded:
                break
            iteration_count += 1
            self._get_active_env()[iter_name] = item

            self._add_step(
                node=stmt,
                action=ACTION_LOOP_ITERATION,
                variable=iter_name,
                value=item,
                description=f"For loop iteration {iteration_count}: {iter_name} = {repr(item)}",
            )

            try:
                self._execute_body(stmt.body)
            except BreakSignal:
                break
            except ContinueSignal:
                continue

        self._add_step(
            node=stmt,
            action=ACTION_LOOP_EXIT,
            description=f"For loop completed ({iteration_count} iterations)",
        )

    def _exec_while(self, stmt: ast.While):
        iteration_count = 0
        cond_str = ast.unparse(stmt.test) if hasattr(ast, 'unparse') else "condition"

        self._add_step(
            node=stmt,
            action=ACTION_LOOP_INIT,
            description=f"Initialize while loop ({cond_str})",
        )

        while True:
            if self.limit_exceeded:
                break

            cond_val = self._eval_expr(stmt.test)
            self._add_step(
                node=stmt.test,
                action=ACTION_EVAL_COND,
                expression=cond_str,
                result=bool(cond_val),
                description=f"While condition '{cond_str}' evaluated to {bool(cond_val)}",
            )

            if not cond_val:
                break

            iteration_count += 1
            self._add_step(
                node=stmt,
                action=ACTION_LOOP_ITERATION,
                description=f"While loop iteration {iteration_count}",
            )

            try:
                self._execute_body(stmt.body)
            except BreakSignal:
                break
            except ContinueSignal:
                continue

        self._add_step(
            node=stmt,
            action=ACTION_LOOP_EXIT,
            description=f"While loop exited after {iteration_count} iterations",
        )

    def _exec_func_def(self, stmt: ast.FunctionDef):
        func_name = stmt.name
        safe_func = SafeFunction(node=stmt, closure_env=dict(self._get_active_env()))
        self._get_active_env()[func_name] = safe_func

        self._add_step(
            node=stmt,
            action=ACTION_DEFINE_FUNC,
            variable=func_name,
            description=f"Defined function '{func_name}'",
        )

    def _exec_return(self, stmt: ast.Return):
        return_val = self._eval_expr(stmt.value) if stmt.value else None
        self._add_step(
            node=stmt,
            action=ACTION_RETURN_FUNC,
            value=return_val,
            description=f"Return {repr(return_val)} from function",
        )
        raise ReturnSignal(value=return_val, line=stmt.lineno)

    def _eval_expr(self, expr: Optional[ast.AST]) -> Any:
        if expr is None:
            return None

        if isinstance(expr, ast.Constant):
            return expr.value
        elif isinstance(expr, ast.Name):
            env = self._get_active_env()
            if expr.id in env:
                return env[expr.id]
            elif expr.id in self.globals_env:
                return self.globals_env[expr.id]
            else:
                raise NameError(f"name '{expr.id}' is not defined")
        elif isinstance(expr, ast.BinOp):
            left_val = self._eval_expr(expr.left)
            right_val = self._eval_expr(expr.right)
            op = expr.op
            if isinstance(op, ast.Add): return left_val + right_val
            if isinstance(op, ast.Sub): return left_val - right_val
            if isinstance(op, ast.Mult): return left_val * right_val
            if isinstance(op, ast.Div): return left_val / right_val
            if isinstance(op, ast.FloorDiv): return left_val // right_val
            if isinstance(op, ast.Mod): return left_val % right_val
            if isinstance(op, ast.Pow): return left_val ** right_val
        elif isinstance(expr, ast.UnaryOp):
            operand = self._eval_expr(expr.operand)
            if isinstance(expr.op, ast.USub): return -operand
            if isinstance(expr.op, ast.UAdd): return +operand
            if isinstance(expr.op, ast.Not): return not operand
        elif isinstance(expr, ast.Compare):
            left_val = self._eval_expr(expr.left)
            for op, comparator in zip(expr.ops, expr.comparators):
                right_val = self._eval_expr(comparator)
                res = False
                if isinstance(op, ast.Eq): res = (left_val == right_val)
                elif isinstance(op, ast.NotEq): res = (left_val != right_val)
                elif isinstance(op, ast.Lt): res = (left_val < right_val)
                elif isinstance(op, ast.LtE): res = (left_val <= right_val)
                elif isinstance(op, ast.Gt): res = (left_val > right_val)
                elif isinstance(op, ast.GtE): res = (left_val >= right_val)
                elif isinstance(op, ast.In): res = (left_val in right_val)
                elif isinstance(op, ast.NotIn): res = (left_val not in right_val)
                if not res:
                    return False
                left_val = right_val
            return True
        elif isinstance(expr, ast.BoolOp):
            if isinstance(expr.op, ast.And):
                for val in expr.values:
                    res = self._eval_expr(val)
                    if not res:
                        return res
                return res
            elif isinstance(expr.op, ast.Or):
                for val in expr.values:
                    res = self._eval_expr(val)
                    if res:
                        return res
                return res
        elif isinstance(expr, ast.Call):
            return self._eval_call(expr)
        elif isinstance(expr, ast.List):
            return [self._eval_expr(elt) for elt in expr.elts]
        elif isinstance(expr, ast.Dict):
            return {self._eval_expr(k): self._eval_expr(v) for k, v in zip(expr.keys, expr.values)}
        elif isinstance(expr, ast.Tuple):
            return tuple(self._eval_expr(elt) for elt in expr.elts)
        elif isinstance(expr, ast.Subscript):
            target = self._eval_expr(expr.value)
            idx = self._eval_expr(expr.slice)
            return target[idx]

        return None

    def _eval_call(self, call: ast.Call) -> Any:
        func_obj = self._eval_expr(call.func)
        args_vals = [self._eval_expr(arg) for arg in call.args]

        if isinstance(func_obj, SafeFunction):
            func_node = func_obj.node
            arg_names = [arg.arg for arg in func_node.args.args]
            local_env = dict(func_obj.closure_env)

            bound_args = {}
            for name, val in zip(arg_names, args_vals):
                local_env[name] = val
                bound_args[name] = val

            self._add_step(
                node=call,
                action=ACTION_CALL_FUNC,
                variable=func_obj.name,
                value=bound_args,
                description=f"Call function '{func_obj.name}' with args {bound_args}",
            )

            self.frames_stack.append(local_env)

            return_val = None
            try:
                self._execute_body(func_node.body)
            except ReturnSignal as ret:
                return_val = ret.value
            finally:
                self.frames_stack.pop()

            return return_val

        elif callable(func_obj):
            if func_obj == self._custom_print:
                return self._custom_print(*args_vals)
            try:
                res = func_obj(*args_vals)
                return res
            except Exception as e:
                raise e

        raise TypeError(f"'{type(func_obj).__name__}' object is not callable")

python_executor = PythonExecutionEngine()
