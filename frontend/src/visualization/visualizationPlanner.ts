import type { ExecutionTrace } from '../types';
import type { VisualizationEvent, OperandInfo } from './types';
import { createVisualizationEvent, resetEventCounter } from './visualizationEvents';

function extractOperands(description: string, state: Record<string, any>): { operands: OperandInfo[]; operator?: string; expression?: string } {
  const operands: OperandInfo[] = [];

  // Match expressions like "x + y", "a * b", "5 + 10", etc.
  const opMatch = description.match(/([a-zA-Z0-9_\.]+)\s*([\+\-\*\/\%\*\*]+)\s*([a-zA-Z0-9_\.]+)/);
  if (opMatch) {
    const leftName = opMatch[1];
    const operator = opMatch[2];
    const rightName = opMatch[3];

    const leftVal = state[leftName]?.value !== undefined ? state[leftName].value : isNaN(Number(leftName)) ? leftName : Number(leftName);
    const rightVal = state[rightName]?.value !== undefined ? state[rightName].value : isNaN(Number(rightName)) ? rightName : Number(rightName);

    operands.push({ name: leftName, value: leftVal });
    operands.push({ name: rightName, value: rightVal });

    return {
      operands,
      operator,
      expression: `${leftName} ${operator} ${rightName}`,
    };
  }

  return { operands: [] };
}

export function planVisualization(trace: ExecutionTrace | null): VisualizationEvent[] {
  resetEventCounter();

  if (!trace || !trace.steps || trace.steps.length === 0) {
    return [];
  }

  const events: VisualizationEvent[] = [];
  const knownVariables = new Set<string>();

  for (const step of trace.steps) {
    const { id: stepId, line_start, line_end, action, variable, value, expression, result, state, description } = step;

    switch (action) {
      case 'assign': {
        const varName = variable || 'var';
        const isNew = !knownVariables.has(varName);
        knownVariables.add(varName);

        // Check if assignment involved a calculation
        const mathInfo = extractOperands(description, state);

        if (mathInfo.operands.length > 0) {
          events.push(
            createVisualizationEvent(
              'CALCULATE',
              stepId,
              line_start,
              line_end,
              `Calculate ${mathInfo.expression} = ${value}`,
              {
                expression: mathInfo.expression,
                operands: mathInfo.operands,
                operator: mathInfo.operator,
                result: value,
                target: varName,
              }
            )
          );
        }

        const eventType = isNew ? 'CREATE_VARIABLE' : 'UPDATE_VARIABLE';
        const descText = isNew
          ? `Create variable ${varName} with value ${JSON.stringify(value)}`
          : `Update variable ${varName} to ${JSON.stringify(value)}`;

        events.push(
          createVisualizationEvent(eventType, stepId, line_start, line_end, descText, {
            target: varName,
            value,
          })
        );
        break;
      }

      case 'evaluate_condition': {
        const condStr = expression || 'condition';
        const condResult = Boolean(result);

        events.push(
          createVisualizationEvent(
            'EVALUATE_CONDITION',
            stepId,
            line_start,
            line_end,
            `Condition '${condStr}' evaluated to ${condResult ? 'TRUE' : 'FALSE'}`,
            {
              condition: condStr,
              resultBoolean: condResult,
            }
          )
        );
        break;
      }

      case 'branch': {
        const isIf = description.toLowerCase().includes('if');
        const branchType = isIf ? 'IF' : 'ELSE';

        events.push(
          createVisualizationEvent(
            'BRANCH_TAKEN',
            stepId,
            line_start,
            line_end,
            description,
            {
              branch: branchType,
            }
          )
        );
        break;
      }

      case 'loop_init': {
        events.push(
          createVisualizationEvent('ENTER_LOOP', stepId, line_start, line_end, description, {
            loopVariable: variable || undefined,
          })
        );
        break;
      }

      case 'loop_iteration': {
        const loopVar = variable || 'i';
        if (loopVar) knownVariables.add(loopVar);

        events.push(
          createVisualizationEvent('LOOP_ITERATION', stepId, line_start, line_end, description, {
            loopVariable: loopVar,
            value,
            target: loopVar,
          })
        );
        break;
      }

      case 'loop_exit': {
        events.push(
          createVisualizationEvent('EXIT_LOOP', stepId, line_start, line_end, description)
        );
        break;
      }

      case 'define_function': {
        events.push(
          createVisualizationEvent('ENTER_FUNCTION', stepId, line_start, line_end, description, {
            functionName: variable || 'function',
          })
        );
        break;
      }

      case 'call_function': {
        const funcName = variable || 'function';
        const argsDict = (typeof value === 'object' && value !== null) ? value : {};

        events.push(
          createVisualizationEvent('ENTER_FUNCTION', stepId, line_start, line_end, `Call ${funcName}(${JSON.stringify(argsDict)})`, {
            functionName: funcName,
            args: argsDict,
          })
        );
        break;
      }

      case 'return_function': {
        events.push(
          createVisualizationEvent('RETURN_VALUE', stepId, line_start, line_end, `Return ${JSON.stringify(value)}`, {
            returnValue: value,
          })
        );
        events.push(
          createVisualizationEvent('EXIT_FUNCTION', stepId, line_start, line_end, `Function returned ${JSON.stringify(value)}`, {
            returnValue: value,
          })
        );
        break;
      }

      case 'output': {
        events.push(
          createVisualizationEvent('OUTPUT', stepId, line_start, line_end, `Printed: ${value}`, {
            outputStr: String(value),
          })
        );
        break;
      }

      default: {
        events.push(
          createVisualizationEvent('READ_VARIABLE', stepId, line_start, line_end, description, {
            target: variable || undefined,
            value,
          })
        );
        break;
      }
    }
  }

  return events;
}
