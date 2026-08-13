from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class VariableState(BaseModel):
    value: Any
    type: str

class SourceLocation(BaseModel):
    line_start: int
    line_end: int
    column_start: int
    column_end: int

class ExecutionStep(BaseModel):
    id: str = Field(..., description="Unique step ID, e.g., step-0001")
    step_index: int = Field(..., description="1-based index of step")
    line_start: int
    line_end: int
    column_start: int
    column_end: int
    action: str = Field(..., description="Action type: assign, evaluate_condition, branch, loop_iteration, loop_exit, call_function, return_function, output, etc.")
    variable: Optional[str] = None
    expression: Optional[str] = None
    value: Optional[Any] = None
    result: Optional[Any] = None
    state: Dict[str, VariableState] = Field(default_factory=dict, description="Snapshot of active variables")
    description: str = Field(..., description="Human-readable step explanation")

class ExecutionTrace(BaseModel):
    language: str = "python"
    total_steps: int
    status: str = Field(..., description="Status: completed, limit_exceeded, error")
    steps: List[ExecutionStep] = Field(default_factory=list)
    final_state: Dict[str, VariableState] = Field(default_factory=dict)
    output: List[str] = Field(default_factory=list)
    error_message: Optional[str] = None

class ExecuteRequest(BaseModel):
    language: str
    code: str

class ExecuteResponse(BaseModel):
    trace: ExecutionTrace
