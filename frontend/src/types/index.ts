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
