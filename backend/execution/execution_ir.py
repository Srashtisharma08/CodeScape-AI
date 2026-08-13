"""
Language-independent Execution IR definitions and helper constants.
"""

# Execution Action Types
ACTION_ASSIGN = "assign"
ACTION_READ_VAR = "read_variable"
ACTION_EVAL_EXPR = "evaluate_expression"
ACTION_EVAL_COND = "evaluate_condition"
ACTION_BRANCH = "branch"
ACTION_LOOP_INIT = "loop_init"
ACTION_LOOP_ITERATION = "loop_iteration"
ACTION_LOOP_EXIT = "loop_exit"
ACTION_DEFINE_FUNC = "define_function"
ACTION_CALL_FUNC = "call_function"
ACTION_RETURN_FUNC = "return_function"
ACTION_OUTPUT = "output"
ACTION_ERROR = "error"

def format_value_type(val: any) -> str:
    """Return friendly type string for a value."""
    if val is None:
        return "NoneType"
    if isinstance(val, bool):
        return "bool"
    if isinstance(val, int):
        return "int"
    if isinstance(val, float):
        return "float"
    if isinstance(val, str):
        return "str"
    if isinstance(val, list):
        return "list"
    if isinstance(val, dict):
        return "dict"
    if isinstance(val, tuple):
        return "tuple"
    if isinstance(val, set):
        return "set"
    return type(val).__name__
