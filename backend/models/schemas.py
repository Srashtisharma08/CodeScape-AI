from pydantic import BaseModel
from typing import List, Optional

class ParseRequest(BaseModel):
    language: str
    code: str

class ASTNode(BaseModel):
    type: str
    name: Optional[str] = None
    children: List['ASTNode'] = []
    start_line: int
    end_line: int

class ParseInfo(BaseModel):
    language: str
    node_count: int
    parse_time_ms: float
    has_errors: bool

class ParseResponse(BaseModel):
    ast: ASTNode
    parse_info: ParseInfo

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
