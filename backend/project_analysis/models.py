from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class FileCategory(str, Enum):
    ENTRY_POINT = 'entry_point'
    API_ROUTE = 'api_route'
    SERVICE = 'service'
    FRONTEND_ROOT = 'frontend_root'
    COMPONENT = 'component'
    API_CLIENT = 'api_client'
    MODEL = 'model'
    CONFIG = 'config'
    TEST = 'test'
    STYLE = 'style'
    UNKNOWN = 'unknown'

class ProjectFileInput(BaseModel):
    path: str
    content: str

class ProjectFile(BaseModel):
    id: str
    path: str
    name: str
    extension: str
    category: FileCategory
    summary: str
    imports: List[str] = Field(default_factory=list)
    exports: List[str] = Field(default_factory=list)
    is_entry_point: bool = False
    line_count: int = 0
    content: Optional[str] = None

class DependencyEdge(BaseModel):
    source_file: str
    target_file: str
    relationship_type: str  # IMPORTS, CALLS, REQUESTS, ROUTES_TO, RENDERS, USES
    symbol: Optional[str] = None
    is_confirmed: bool = True  # Distinguishes confirmed vs potential relationships

class APIEndpoint(BaseModel):
    path: str
    method: str  # GET, POST, PUT, DELETE, etc.
    defined_in: str
    handled_by: Optional[str] = None
    purpose: str = ''

class ProjectNode(BaseModel):
    id: str
    file_path: str
    label: str
    category: FileCategory
    is_entry_point: bool = False
    x: float = 0.0
    y: float = 0.0

class ProjectEdge(BaseModel):
    source: str
    target: str
    relationship_type: str
    label: Optional[str] = None
    is_confirmed: bool = True

class ProjectGraph(BaseModel):
    nodes: List[ProjectNode] = Field(default_factory=list)
    edges: List[ProjectEdge] = Field(default_factory=list)

class ArchitectureLayer(BaseModel):
    name: str
    description: str
    files: List[str] = Field(default_factory=list)

class ArchitectureStep(BaseModel):
    step_index: int
    title: str
    description: str
    highlighted_files: List[str] = Field(default_factory=list)
    highlighted_edges: List[List[str]] = Field(default_factory=list) # [[src, tgt], ...]

class ProjectAnalysisRequest(BaseModel):
    project_name: str = 'Project'
    files: List[ProjectFileInput]
    max_files: int = 50
    max_file_size_kb: int = 500

class ProjectAnalysisResponse(BaseModel):
    project_name: str
    project_summary: str
    files: List[ProjectFile]
    dependencies: List[DependencyEdge]
    entry_points: List[str]
    api_endpoints: List[APIEndpoint]
    project_graph: ProjectGraph
    architecture_layers: List[ArchitectureLayer]
    architecture_walkthrough: List[ArchitectureStep]
