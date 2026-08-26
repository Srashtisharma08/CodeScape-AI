import type { ExecutionTrace } from '../types';
import type { VisualizationEvent, VisualizationState, VariableVisualInfo } from './types';

export function computeVisualizationState(
  events: VisualizationEvent[],
  trace: ExecutionTrace | null,
  currentStepIndex: number
): VisualizationState {
  const variables: Record<string, VariableVisualInfo> = {};
  let activeVariable: string | null = null;
  let activeCalculation: VisualizationState['activeCalculation'] = null;
  let activeCondition: VisualizationState['activeCondition'] = null;
  let activeLoop: VisualizationState['activeLoop'] = null;
  let activeFunction: VisualizationState['activeFunction'] = null;
  let currentEvent: VisualizationEvent | null = null;

  if (!trace || !trace.steps || trace.steps.length === 0 || currentStepIndex === 0) {
    return {
      variables: {},
      activeVariable: null,
      activeCalculation: null,
      activeCondition: null,
      activeLoop: null,
      activeFunction: null,
      currentEvent: null,
      outputHistory: [],
    };
  }

  // Get active execution step
  const activeStep = trace.steps[Math.min(currentStepIndex - 1, trace.steps.length - 1)];
  const activeStepId = activeStep.id;

  // Build variables from current step's snapshot state
  if (activeStep.state) {
    for (const [varName, varInfo] of Object.entries(activeStep.state)) {
      variables[varName] = {
        value: varInfo.value,
        type: varInfo.type,
        status: varName === activeStep.variable ? 'updated' : 'active',
      };
    }
  }

  if (activeStep.variable) {
    activeVariable = activeStep.variable;
  }

  // Find relevant events matching activeStepId or prior events
  const matchingEvents = events.filter((e) => e.sourceStepId === activeStepId);
  currentEvent = matchingEvents.length > 0 ? matchingEvents[matchingEvents.length - 1] : null;

  for (const event of matchingEvents) {
    if (event.type === 'CREATE_VARIABLE' || event.type === 'UPDATE_VARIABLE') {
      if (event.target && variables[event.target]) {
        variables[event.target].status = event.type === 'CREATE_VARIABLE' ? 'created' : 'updated';
      }
    }

    if (event.type === 'CALCULATE') {
      activeCalculation = {
        expression: event.expression || 'calculation',
        operands: event.operands || [],
        operator: event.operator,
        result: event.result,
        target: event.target,
      };
    }

    if (event.type === 'EVALUATE_CONDITION' || event.type === 'BRANCH_TAKEN') {
      const isTaken = event.resultBoolean ?? true;
      activeCondition = {
        condition: event.condition || activeStep.expression || 'condition',
        result: isTaken,
        takenBranch: isTaken ? 'IF' : 'ELSE',
        skippedBranch: isTaken ? 'ELSE' : 'IF',
      };
    }

    if (event.type === 'ENTER_LOOP' || event.type === 'LOOP_ITERATION' || event.type === 'EXIT_LOOP') {
      let status: 'ENTER' | 'ITERATION' | 'EXIT' = 'ITERATION';
      if (event.type === 'ENTER_LOOP') status = 'ENTER';
      if (event.type === 'EXIT_LOOP') status = 'EXIT';

      // Extract iteration number if present in description e.g. "iteration 2"
      const iterMatch = activeStep.description.match(/iteration\s+(\d+)/i);
      const iterNum = iterMatch ? parseInt(iterMatch[1], 10) : undefined;

      activeLoop = {
        loopVariable: event.loopVariable || activeStep.variable || 'i',
        iteration: iterNum,
        currentValue: event.value !== undefined ? event.value : activeStep.value,
        status,
      };
    }

    if (event.type === 'ENTER_FUNCTION' || event.type === 'RETURN_VALUE' || event.type === 'EXIT_FUNCTION') {
      let status: 'ENTER' | 'EXECUTING' | 'RETURN' = 'EXECUTING';
      if (event.type === 'ENTER_FUNCTION') status = 'ENTER';
      if (event.type === 'RETURN_VALUE' || event.type === 'EXIT_FUNCTION') status = 'RETURN';

      activeFunction = {
        functionName: event.functionName || activeStep.variable || 'function',
        args: event.args || {},
        status,
        returnValue: event.returnValue !== undefined ? event.returnValue : activeStep.value,
      };
    }
  }

  // Accumulate outputs up to current step
  const outputHistory: string[] = [];
  for (let i = 0; i < currentStepIndex && i < trace.steps.length; i++) {
    const s = trace.steps[i];
    if (s.action === 'output' && s.value !== undefined && s.value !== null) {
      outputHistory.push(String(s.value));
    }
  }

  return {
    variables,
    activeVariable,
    activeCalculation,
    activeCondition,
    activeLoop,
    activeFunction,
    currentEvent,
    outputHistory,
  };
}
