export interface ASTNode {
  type: string;
  name?: string | null;
  children?: ASTNode[];
  start_line?: number;
  end_line?: number;
  startLine?: number;
  endLine?: number;
}

export interface ParseInfo {
  language: string;
  node_count: number;
  parse_time_ms: number;
  has_errors: boolean;
  nodeCount?: number;
  parseTimeMs?: number;
  hasErrors?: boolean;
}

export interface ParseResponse {
  ast: ASTNode;
  parse_info: ParseInfo;
  parseInfo?: ParseInfo;
}

export interface ParseRequest {
  language: string;
  code: string;
}

export type SupportedLanguage = 'python' | 'java' | 'javascript';

export interface ConsoleMessage {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

/* Phase 2: Execution Engine Types */

export interface VariableState {
  value: any;
  type: string;
}

export interface ExecutionStep {
  id: string;
  step_index: number;
  line_start: number;
  line_end: number;
  column_start: number;
  column_end: number;
  action: string;
  variable?: string | null;
  expression?: string | null;
  value?: any;
  result?: any;
  state: Record<string, VariableState>;
  description: string;
}

export interface ExecutionTrace {
  language: string;
  total_steps: number;
  status: 'completed' | 'limit_exceeded' | 'error';
  steps: ExecutionStep[];
  final_state: Record<string, VariableState>;
  output: string[];
  error_message?: string | null;
}

export interface ExecuteRequest {
  language: string;
  code: string;
}

export interface ExecuteResponse {
  trace: ExecutionTrace;
}

/* Phase 4: AI Explanation Engine Types */

export type ExplanationLevel = 'beginner' | 'intermediate' | 'detailed';

export interface ExplanationRequest {
  language: string;
  code: string;
  execution_trace: ExecutionTrace;
  current_step_index: number;
  explanation_level: ExplanationLevel;
}

export interface VariableInvolved {
  name: string;
  value: any;
  type: string;
}

export interface ExplanationResponse {
  step_id: string;
  step_index: number;
  line_start: number;
  line_end: number;
  title: string;
  what_happened: string;
  why: string;
  variables_involved: VariableInvolved[];
  concepts: string[];
  explanation_level: ExplanationLevel;
}

export interface ProgramSummaryRequest {
  language: string;
  code: string;
  execution_trace: ExecutionTrace;
}

export interface ProgramSummaryResponse {
  purpose: string;
  how_it_works: string[];
  concepts: string[];
  final_variables: Record<string, any>;
  output: string[];
  return_value?: any;
}
