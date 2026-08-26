import re
from typing import Dict, Any, List
from ai.models import ExplanationResponse, ProgramSummaryResponse, ExplanationLevel
from ai.providers.base import BaseAIProvider

class MockAIProvider(BaseAIProvider):
    """Deterministic, high-quality Mock AI provider for Phase 4."""

    def explain_step(
        self,
        language: str,
        code: str,
        step: Dict[str, Any],
        step_index: int,
        total_steps: int,
        level: ExplanationLevel,
    ) -> ExplanationResponse:
        step_id = step.get("id", f"step-{step_index:04d}")
        line_start = step.get("line_start", 1)
        line_end = step.get("line_end", 1)
        action = step.get("action", "assign")
        var_name = step.get("variable")
        val = step.get("value")
        expr = step.get("expression")
        res = step.get("result")
        desc = step.get("description", "")
        state = step.get("state", {})

        # Extract variables involved
        vars_involved: List[Dict[str, Any]] = []
        for name, vinfo in state.items():
            vars_involved.append({"name": name, "value": vinfo.get("value"), "type": vinfo.get("type", "unknown")})

        concepts: List[str] = []
        title = ""
        what_happened = ""
        why = ""

        # Identify action type and generate level-specific explanations
        if action == "assign":
            concepts.extend(["Variables", "Assignment Operator"])
            val_str = str(val) if val is not None else ""

            # Check if this assignment contains a math operation like x + y
            op_match = re.search(r"([a-zA-Z0-9_\.]+)\s*([\+\-\*\/\%\*\*]+)\s*([a-zA-Z0-9_\.]+)", desc)

            if op_match:
                concepts.append("Arithmetic Operators")
                left_var, op_symbol, right_var = op_match.group(1), op_match.group(2), op_match.group(3)
                left_val = state.get(left_var, {}).get("value", left_var)
                right_val = state.get(right_var, {}).get("value", right_var)

                title = f"Calculate and Assign '{var_name}'"

                if level == ExplanationLevel.BEGINNER:
                    what_happened = f"The program adds or calculates using {left_var} and {right_var}, getting {val_str}, and puts it in '{var_name}'."
                    why = f"It takes {left_var} ({left_val}) and {right_var} ({right_val}), combines them with {op_symbol} to make {val_str}, then sets '{var_name}' equal to {val_str}."
                elif level == ExplanationLevel.INTERMEDIATE:
                    what_happened = f"The program reads the values of '{left_var}' and '{right_var}', evaluates the expression, and stores the result in '{var_name}'."
                    why = f"'{left_var}' has value {left_val} and '{right_var}' has value {right_val}. Evaluating '{left_var} {op_symbol} {right_var}' ({left_val} {op_symbol} {right_val}) produces {val_str}. The assignment operator '=' stores {val_str} into '{var_name}'."
                else:  # DETAILED
                    what_happened = f"The program evaluates the binary expression '{left_var} {op_symbol} {right_var}' and performs a variable assignment targeting '{var_name}'."
                    why = (
                        f"1. Fetch operand '{left_var}' from state → {left_val}.\n"
                        f"2. Fetch operand '{right_var}' from state → {right_val}.\n"
                        f"3. Evaluate expression ({left_val} {op_symbol} {right_val}) → {val_str}.\n"
                        f"4. Store result {val_str} into memory variable '{var_name}'."
                    )
            else:
                title = f"Assign Variable '{var_name}'"
                if level == ExplanationLevel.BEGINNER:
                    what_happened = f"Variable '{var_name}' is set to {val_str}."
                    why = f"The code specifies that '{var_name}' should hold the value {val_str}."
                elif level == ExplanationLevel.INTERMEDIATE:
                    what_happened = f"The program creates or updates the variable '{var_name}' with value {val_str}."
                    why = f"The assignment statement evaluates the right-hand side to {val_str} and binds it to '{var_name}' in memory."
                else:  # DETAILED
                    what_happened = f"Memory variable '{var_name}' undergoes an assignment operation with literal or evaluated value {val_str}."
                    why = f"The runtime assigns value {val_str} (type: {type(val).__name__}) to variable key '{var_name}', updating the active stack frame state."

        elif action == "evaluate_condition":
            concepts.extend(["Conditional Logic", "Boolean Expression"])
            cond_str = expr or desc
            res_bool = bool(res)

            title = f"Evaluate Condition '{cond_str}'"
            if level == ExplanationLevel.BEGINNER:
                what_happened = f"The program checks if '{cond_str}' is true."
                why = f"It checked the values in the condition and found that it is {res_bool}."
            elif level == ExplanationLevel.INTERMEDIATE:
                what_happened = f"The program evaluates the boolean condition '{cond_str}' to determine which code branch to follow."
                why = f"Based on current variable values in memory, the expression '{cond_str}' evaluated to {res_bool}."
            else:  # DETAILED
                what_happened = f"The control flow engine evaluates the logical expression '{cond_str}' for branching decision."
                why = f"Current variable states were substituted into '{cond_str}'. The comparison resolved to Boolean value {res_bool}."

        elif action == "branch":
            concepts.extend(["Control Flow", "If/Else Branching"])
            is_if = "if" in desc.lower()
            branch_name = "IF" if is_if else "ELSE"

            title = f"Follow {branch_name} Branch"
            if level == ExplanationLevel.BEGINNER:
                what_happened = f"The program goes into the {branch_name} section of code."
                why = f"Because the condition check was true, it executes this block and skips other choices." if is_if else f"Because the condition check was false, it goes to the default else section."
            elif level == ExplanationLevel.INTERMEDIATE:
                what_happened = f"The execution path enters the {branch_name} branch block based on the preceding condition result."
                why = f"Conditional branching rules dictate that when an IF condition evaluates to True, its block executes while any corresponding ELSE block is skipped."
            else:  # DETAILED
                what_happened = f"Control flow jumps into the instruction block associated with the {branch_name} clause."
                why = f"The branch selector evaluated the prior predicate. Predicate truth value selected the {branch_name} branch for sequential AST execution."

        elif action in ("loop_init", "loop_iteration", "loop_exit"):
            concepts.extend(["Loops", "Iteration", "Control Flow"])
            loop_var = var_name or "i"

            if action == "loop_exit":
                title = "Exit Loop"
                what_happened = "The loop finishes and execution continues below it."
                why = "The loop condition is no longer true, so the program stops repeating the loop body."
            else:
                title = f"Loop Iteration ({loop_var} = {val})"
                if level == ExplanationLevel.BEGINNER:
                    what_happened = f"The loop runs for {loop_var} = {val}."
                    why = f"It repeats the code inside for each number in the loop series."
                elif level == ExplanationLevel.INTERMEDIATE:
                    what_happened = f"The loop advances to the next iteration with loop variable '{loop_var}' set to {val}."
                    why = f"The loop counter '{loop_var}' updates to {val}, and the loop body executes with this updated value."
                else:  # DETAILED
                    what_happened = f"Iterative control structure executes iteration step with loop counter '{loop_var}' = {val}."
                    why = f"The loop iterator yields item {val} into target variable '{loop_var}'. The loop condition check remains satisfied."

        elif action in ("define_function", "call_function", "return_function"):
            concepts.extend(["Functions", "Call Stack", "Scope"])
            func_name = var_name or "function"

            if action == "call_function":
                title = f"Call Function '{func_name}()'"
                args_str = str(val) if val is not None else "{}"
                if level == ExplanationLevel.BEGINNER:
                    what_happened = f"The program calls function '{func_name}' with inputs {args_str}."
                    why = f"It jumps to the code defined inside function '{func_name}'."
                elif level == ExplanationLevel.INTERMEDIATE:
                    what_happened = f"The program invokes function '{func_name}()' passing argument values {args_str}."
                    why = f"A new function frame is created on the call stack, binding parameter names to passed arguments."
                else:  # DETAILED
                    what_happened = f"Function invocation step pushes frame '{func_name}' onto the execution call stack with parameters {args_str}."
                    why = f"Control transfers to the entry block of '{func_name}'. Local variable scope is initialized with provided argument values."

            elif action == "return_function":
                title = f"Return from '{func_name}()'"
                ret_str = str(val) if val is not None else "None"
                if level == ExplanationLevel.BEGINNER:
                    what_happened = f"Function '{func_name}' finishes and gives back {ret_str}."
                    why = f"The return line tells the function to send its result back."
                elif level == ExplanationLevel.INTERMEDIATE:
                    what_happened = f"Function '{func_name}()' completes execution and returns value {ret_str}."
                    why = f"The return statement passes {ret_str} back to the caller and pops the function frame from the call stack."
                else:  # DETAILED
                    what_happened = f"Function '{func_name}()' terminates stack frame execution and returns payload {ret_str}."
                    why = f"Return expression evaluates to {ret_str}, pops top frame from call stack, and resumes caller execution context."
            else:
                title = f"Define Function '{func_name}'"
                what_happened = f"The program defines the function '{func_name}' for later use."
                why = f"Function definitions register reusable callable blocks in memory."

        elif action == "output":
            concepts.extend(["Output", "Console Print"])
            title = f"Print Output '{val}'"
            if level == ExplanationLevel.BEGINNER:
                what_happened = f"The program prints '{val}' to the output console."
                why = f"The print instruction sends text to the screen."
            elif level == ExplanationLevel.INTERMEDIATE:
                what_happened = f"The program executes an output instruction printing '{val}' to stdout."
                why = f"The argument evaluated to '{val}' and was emitted to standard output stream."
            else:  # DETAILED
                what_happened = f"Standard output stream receive event emitting value '{val}'."
                why = f"Print function flushes string representation of value '{val}' to stdout console buffer."

        else:
            title = f"Execute Step {step_index}"
            what_happened = f"Execution step on line {line_start}: {desc}"
            why = f"The program executed statement: {desc}"
            concepts.append("General Execution")

        return ExplanationResponse(
            step_id=step_id,
            step_index=step_index,
            line_start=line_start,
            line_end=line_end,
            title=title,
            what_happened=what_happened,
            why=why,
            variables_involved=vars_involved,
            concepts=list(dict.fromkeys(concepts)),  # deduplicate
            explanation_level=level,
        )

    def explain_program(
        self,
        language: str,
        code: str,
        execution_trace: Dict[str, Any],
    ) -> ProgramSummaryResponse:
        steps = execution_trace.get("steps", [])
        final_state = execution_trace.get("final_state", {})
        output = execution_trace.get("output", [])

        # Determine purpose and key concepts
        purpose = "This program executes a series of statements to calculate values, process logic, and display results."
        concepts = ["Variables", "Control Flow"]
        how_it_works: List[str] = []

        if not steps:
            how_it_works.append("No execution steps recorded.")
        else:
            # Generate clean step summary
            step_summaries = []
            for s in steps:
                act = s.get("action")
                v = s.get("variable")
                val = s.get("value")
                d = s.get("description", "")

                if act == "assign" and v:
                    step_summaries.append(f"Assign variable '{v}' = {val}")
                elif act == "evaluate_condition":
                    step_summaries.append(f"Check condition: {s.get('expression', 'condition')}")
                    if "Conditional Logic" not in concepts:
                        concepts.append("Conditional Logic")
                elif act == "loop_iteration":
                    step_summaries.append(f"Loop iteration for '{v}' = {val}")
                    if "Loops" not in concepts:
                        concepts.append("Loops")
                elif act == "call_function":
                    step_summaries.append(f"Call function '{v}()'")
                    if "Functions" not in concepts:
                        concepts.append("Functions")
                elif act == "output":
                    step_summaries.append(f"Print output '{val}'")
                    if "Console Output" not in concepts:
                        concepts.append("Console Output")

            how_it_works = step_summaries[:8]  # Keep concise top steps
            if len(step_summaries) > 8:
                how_it_works.append(f"...and {len(step_summaries) - 8} additional steps.")

        # Check return value if present
        ret_val = None
        for s in reversed(steps):
            if s.get("action") == "return_function":
                ret_val = s.get("value")
                break

        # Reformat final variables
        clean_final = {}
        for k, vinfo in final_state.items():
            clean_final[k] = vinfo.get("value") if isinstance(vinfo, dict) else vinfo

        return ProgramSummaryResponse(
            purpose=purpose,
            how_it_works=how_it_works,
            concepts=concepts,
            final_variables=clean_final,
            output=[str(o) for o in output],
            return_value=ret_val,
        )
