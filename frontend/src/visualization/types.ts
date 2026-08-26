
export type VisualizationEventType =
  | 'CREATE_VARIABLE'
  | 'UPDATE_VARIABLE'
  | 'READ_VARIABLE'
  | 'CALCULATE'
  | 'EVALUATE_CONDITION'
  | 'BRANCH_TAKEN'
  | 'BRANCH_SKIPPED'
  | 'ENTER_LOOP'
  | 'LOOP_ITERATION'
  | 'EXIT_LOOP'
  | 'ENTER_FUNCTION'
  | 'EXIT_FUNCTION'
  | 'RETURN_VALUE'
  | 'OUTPUT';

export interface OperandInfo {
  name?: string;
  value: any;
}

export interface VisualizationEvent {
  id: string;
  type: VisualizationEventType;
  sourceStepId: string;
  lineStart: number;
  lineEnd: number;
  target?: string;
  value?: any;
  expression?: string;
  operands?: OperandInfo[];
  operator?: string;
  result?: any;
  condition?: string;
  resultBoolean?: boolean;
  branch?: 'IF' | 'ELSE';
  loopVariable?: string;
  iteration?: number;
  functionName?: string;
  args?: Record<string, any>;
  returnValue?: any;
  outputStr?: string;
  description: string;
}

export interface VariableVisualInfo {
  value: any;
  type: string;
  status: 'created' | 'updated' | 'active' | 'read';
}

export interface ActiveCalculation {
  expression: string;
  operands: OperandInfo[];
  operator?: string;
  result: any;
  target?: string;
}

export interface ActiveCondition {
  condition: string;
  result: boolean;
  takenBranch: 'IF' | 'ELSE';
  skippedBranch?: 'IF' | 'ELSE';
}

export interface ActiveLoop {
  loopVariable?: string;
  iteration?: number;
  currentValue?: any;
  status: 'ENTER' | 'ITERATION' | 'EXIT';
}

export interface ActiveFunction {
  functionName: string;
  args: Record<string, any>;
  status: 'ENTER' | 'EXECUTING' | 'RETURN';
  returnValue?: any;
}

export interface VisualizationState {
  variables: Record<string, VariableVisualInfo>;
  activeVariable?: string | null;
  activeCalculation?: ActiveCalculation | null;
  activeCondition?: ActiveCondition | null;
  activeLoop?: ActiveLoop | null;
  activeFunction?: ActiveFunction | null;
  currentEvent?: VisualizationEvent | null;
  outputHistory: string[];
}
