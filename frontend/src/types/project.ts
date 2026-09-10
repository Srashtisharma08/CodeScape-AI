export type FileCategory =
  | 'entry_point'
  | 'api_route'
  | 'service'
  | 'frontend_root'
  | 'component'
  | 'api_client'
  | 'model'
  | 'config'
  | 'test'
  | 'style'
  | 'unknown';

export interface ProjectFileInput {
  path: string;
  content: string;
}

export interface ProjectFile {
  id: string;
  path: string;
  name: string;
  extension: string;
  category: FileCategory;
  summary: string;
  imports: string[];
  exports: string[];
  is_entry_point: boolean;
  line_count: number;
  content?: string;
}

export interface DependencyEdge {
  source_file: string;
  target_file: string;
  relationship_type: string;
  symbol?: string | null;
  is_confirmed: boolean;
}

export interface APIEndpoint {
  path: string;
  method: string;
  defined_in: string;
  handled_by?: string | null;
  purpose: string;
}

export interface ProjectNode {
  id: string;
  file_path: string;
  label: string;
  category: FileCategory;
  is_entry_point: boolean;
  x: number;
  y: number;
}

export interface ProjectEdge {
  source: string;
  target: string;
  relationship_type: string;
  label?: string | null;
  is_confirmed: boolean;
}

export interface ProjectGraph {
  nodes: ProjectNode[];
  edges: ProjectEdge[];
}

export interface ArchitectureLayer {
  name: string;
  description: string;
  files: string[];
}

export interface ArchitectureStep {
  step_index: number;
  title: string;
  description: string;
  highlighted_files: string[];
  highlighted_edges: string[][];
}

export interface ProjectAnalysisRequest {
  project_name: string;
  files: ProjectFileInput[];
  max_files?: number;
  max_file_size_kb?: number;
}

export interface ProjectAnalysisResponse {
  project_name: string;
  project_summary: string;
  files: ProjectFile[];
  dependencies: DependencyEdge[];
  entry_points: string[];
  api_endpoints: APIEndpoint[];
  project_graph: ProjectGraph;
  architecture_layers: ArchitectureLayer[];
  architecture_walkthrough: ArchitectureStep[];
}
