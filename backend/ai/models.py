from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ExplanationLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    DETAILED = "detailed"

class ExplanationRequest(BaseModel):
    language: str = "python"
    code: str
    execution_trace: Dict[str, Any]
    current_step_index: int = Field(gt=0, description="1-indexed step number to explain")
    explanation_level: ExplanationLevel = ExplanationLevel.INTERMEDIATE

class ExplanationResponse(BaseModel):
    step_id: str
    step_index: int
    line_start: int
    line_end: int
    title: str
    what_happened: str
    why: str
    variables_involved: List[Dict[str, Any]] = []
    concepts: List[str] = []
    explanation_level: ExplanationLevel

class ProgramSummaryRequest(BaseModel):
    language: str = "python"
    code: str
    execution_trace: Dict[str, Any]

class ProgramSummaryResponse(BaseModel):
    purpose: str
    how_it_works: List[str]
    concepts: List[str]
    final_variables: Dict[str, Any]
    output: List[str]
    return_value: Optional[Any] = None
