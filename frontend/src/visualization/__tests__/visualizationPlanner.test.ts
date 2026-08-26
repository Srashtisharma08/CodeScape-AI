import { planVisualization } from '../visualizationPlanner';
import { computeVisualizationState } from '../visualizationState';
import type { ExecutionTrace } from '../../types';

// Mock Execution Trace for testing planner
const mockTrace: ExecutionTrace = {
  language: 'python',
  total_steps: 6,
  status: 'completed',
  steps: [
    {
      id: 'step-0001',
      step_index: 1,
      line_start: 1,
      line_end: 1,
      column_start: 1,
      column_end: 6,
      action: 'assign',
      variable: 'x',
      value: 5,
      state: { x: { value: 5, type: 'int' } },
      description: 'Assign 5 to variable x',
    },
    {
      id: 'step-0002',
      step_index: 2,
      line_start: 2,
      line_end: 2,
      column_start: 1,
      column_end: 7,
      action: 'assign',
      variable: 'y',
      value: 10,
      state: { x: { value: 5, type: 'int' }, y: { value: 10, type: 'int' } },
      description: 'Assign 10 to variable y',
    },
    {
      id: 'step-0003',
      step_index: 3,
      line_start: 3,
      line_end: 3,
      column_start: 1,
      column_end: 10,
      action: 'assign',
      variable: 'z',
      value: 15,
      state: { x: { value: 5, type: 'int' }, y: { value: 10, type: 'int' }, z: { value: 15, type: 'int' } },
      description: 'Calculate x + y = 15 and assign to z',
    },
    {
      id: 'step-0004',
      step_index: 4,
      line_start: 4,
      line_end: 4,
      column_start: 1,
      column_end: 12,
      action: 'evaluate_condition',
      expression: 'z > 10',
      result: true,
      state: { x: { value: 5, type: 'int' }, y: { value: 10, type: 'int' }, z: { value: 15, type: 'int' } },
      description: "Condition 'z > 10' evaluated to True",
    },
    {
      id: 'step-0005',
      step_index: 5,
      line_start: 5,
      line_end: 5,
      column_start: 1,
      column_end: 18,
      action: 'loop_iteration',
      variable: 'i',
      value: 0,
      state: { x: { value: 5, type: 'int' }, y: { value: 10, type: 'int' }, z: { value: 15, type: 'int' }, i: { value: 0, type: 'int' } },
      description: 'For loop iteration 1: i = 0',
    },
    {
      id: 'step-0006',
      step_index: 6,
      line_start: 6,
      line_end: 6,
      column_start: 1,
      column_end: 15,
      action: 'output',
      value: 'Hello World',
      state: { x: { value: 5, type: 'int' }, y: { value: 10, type: 'int' }, z: { value: 15, type: 'int' }, i: { value: 0, type: 'int' } },
      description: 'Output: Hello World',
    },
  ],
  final_state: {
    x: { value: 5, type: 'int' },
    y: { value: 10, type: 'int' },
    z: { value: 15, type: 'int' },
    i: { value: 0, type: 'int' },
  },
  output: ['Hello World'],
};

// Simple test runner
function runTests() {
  console.log('Running Visualization Planner tests...');

  const events = planVisualization(mockTrace);
  console.log(`Generated ${events.length} visualization events.`);

  const eventTypes = events.map((e) => e.type);
  console.log('Event types:', eventTypes);

  // Assertions
  console.assert(eventTypes.includes('CREATE_VARIABLE'), 'Should generate CREATE_VARIABLE');
  console.assert(eventTypes.includes('CALCULATE'), 'Should generate CALCULATE event');
  console.assert(eventTypes.includes('EVALUATE_CONDITION'), 'Should generate EVALUATE_CONDITION');
  console.assert(eventTypes.includes('LOOP_ITERATION'), 'Should generate LOOP_ITERATION');
  console.assert(eventTypes.includes('OUTPUT'), 'Should generate OUTPUT event');

  const visState = computeVisualizationState(events, mockTrace, 3);
  console.log('State at step 3:', {
    activeCalc: visState.activeCalculation?.expression,
    variables: Object.keys(visState.variables),
  });

  console.assert(visState.activeCalculation?.target === 'z', 'Target should be z');
  console.assert(Object.keys(visState.variables).length === 3, 'Should have 3 variables at step 3');

  console.log('ALL VISUALIZATION PLANNER TESTS PASSED SUCCESSFULLY!');
}

runTests();
