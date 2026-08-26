import type { VisualizationState } from '../visualization/types';

interface VisualizationCanvasProps {
  visState: VisualizationState;
  currentStepIndex: number;
  totalSteps: number;
}

export default function VisualizationCanvas({ visState, currentStepIndex, totalSteps }: VisualizationCanvasProps) {
  const {
    variables,
    activeVariable,
    activeCalculation,
    activeCondition,
    activeLoop,
    activeFunction,
    currentEvent,
  } = visState;

  const variableEntries = Object.entries(variables || {});

  if (currentStepIndex === 0 || !currentEvent) {
    return (
      <div className="vis-canvas vis-canvas--empty">
        <div className="ast-tree__empty-icon">🎨</div>
        <div className="ast-tree__empty-text">Visual Explanation Engine</div>
        <div className="ast-tree__empty-hint">
          Execute code and step through the timeline to see interactive 2D visual explanations
        </div>
      </div>
    );
  }

  return (
    <div className="vis-canvas fade-in">
      {/* Current Visual Event Banner */}
      <div className="vis-banner">
        <div className="vis-banner__badge">
          {currentEvent.type.replace('_', ' ')}
        </div>
        <div className="vis-banner__desc">
          {currentEvent.description}
        </div>
        <div className="vis-banner__step">
          Step {currentStepIndex} / {totalSteps}
        </div>
      </div>

      {/* Main Visual Workspace */}
      <div className="vis-workspace">
        {/* Section 1: Variable Cards Visual Area */}
        <div className="vis-section">
          <div className="vis-section__title">
            <span>📦 MEMORY VARIABLES ({variableEntries.length})</span>
          </div>

          {variableEntries.length === 0 ? (
            <div className="vis-empty-box">No variables declared in memory yet</div>
          ) : (
            <div className="vis-vars-grid">
              {variableEntries.map(([name, info]) => {
                const isActive = name === activeVariable;
                const isCreated = info.status === 'created';
                const isUpdated = info.status === 'updated';

                let cardClass = 'vis-var-card';
                if (isActive) cardClass += ' vis-var-card--active';
                if (isCreated) cardClass += ' vis-var-card--created';
                if (isUpdated) cardClass += ' vis-var-card--updated';

                const displayVal =
                  typeof info.value === 'object' && info.value !== null
                    ? JSON.stringify(info.value)
                    : String(info.value);

                return (
                  <div key={name} className={cardClass}>
                    <div className="vis-var-card__header">
                      <span className="vis-var-card__name">{name}</span>
                      <span className="vis-var-card__type">{info.type}</span>
                    </div>
                    <div className="vis-var-card__box">
                      <span className="vis-var-card__val">{displayVal}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Calculation Flow Visualizer */}
        {activeCalculation && (
          <div className="vis-section vis-section--calc fade-in">
            <div className="vis-section__title">
              <span>🧮 CALCULATION FLOW ({activeCalculation.expression})</span>
            </div>

            <div className="vis-calc-flow">
              <div className="vis-calc-operands">
                {activeCalculation.operands.map((op, idx) => (
                  <div key={idx} className="vis-calc-operand-card">
                    <span className="vis-calc-operand-name">{op.name || 'val'}</span>
                    <span className="vis-calc-operand-val">{String(op.value)}</span>
                  </div>
                ))}
              </div>

              <div className="vis-calc-op">
                <span className="vis-calc-op-symbol">{activeCalculation.operator || '='}</span>
              </div>

              <div className="vis-calc-result-card">
                <span className="vis-calc-result-label">Result</span>
                <span className="vis-calc-result-val">{String(activeCalculation.result)}</span>
              </div>

              {activeCalculation.target && (
                <div className="vis-calc-arrow-target">
                  <span className="vis-calc-arrow">➔</span>
                  <span className="vis-calc-target-box">{activeCalculation.target}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Condition / Branch Visualizer */}
        {activeCondition && (
          <div className="vis-section vis-section--cond fade-in">
            <div className="vis-section__title">
              <span>🔀 DECISION BRANCH ({activeCondition.condition})</span>
            </div>

            <div className="vis-decision-tree">
              <div className="vis-decision-node">
                <span className="vis-decision-diamond">❖</span>
                <span className="vis-decision-text">{activeCondition.condition}</span>
              </div>

              <div className="vis-branches">
                {/* IF / TRUE Branch */}
                <div
                  className={`vis-branch-card ${
                    activeCondition.result ? 'vis-branch-card--taken' : 'vis-branch-card--skipped'
                  }`}
                >
                  <div className="vis-branch-label">TRUE / IF BRANCH</div>
                  <div className="vis-branch-status">
                    {activeCondition.result ? '✓ Executed' : '✗ Skipped'}
                  </div>
                </div>

                {/* ELSE / FALSE Branch */}
                <div
                  className={`vis-branch-card ${
                    !activeCondition.result ? 'vis-branch-card--taken' : 'vis-branch-card--skipped'
                  }`}
                >
                  <div className="vis-branch-label">FALSE / ELSE BRANCH</div>
                  <div className="vis-branch-status">
                    {!activeCondition.result ? '✓ Executed' : '✗ Skipped'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Loop Visualizer */}
        {activeLoop && (
          <div className="vis-section vis-section--loop fade-in">
            <div className="vis-section__title">
              <span>🔄 LOOP EXECUTION ({activeLoop.loopVariable || 'loop'})</span>
            </div>

            <div className="vis-loop-card">
              <div className="vis-loop-header">
                <span className="vis-loop-badge">
                  {activeLoop.status === 'EXIT' ? 'LOOP EXIT' : 'LOOP ITERATION'}
                </span>
                {activeLoop.iteration !== undefined && (
                  <span className="vis-loop-iter-count">
                    Iteration #{activeLoop.iteration}
                  </span>
                )}
              </div>

              <div className="vis-loop-body">
                <div className="vis-loop-var-box">
                  <span className="vis-loop-var-name">{activeLoop.loopVariable}</span>
                  <span className="vis-loop-var-val">{String(activeLoop.currentValue ?? '0')}</span>
                </div>
                <div className="vis-loop-status-text">
                  {activeLoop.status === 'EXIT'
                    ? 'Loop condition evaluates to False. Exiting loop.'
                    : `Executing loop body for ${activeLoop.loopVariable} = ${activeLoop.currentValue}`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 5: Function Call Frame Visualizer */}
        {activeFunction && (
          <div className="vis-section vis-section--func fade-in">
            <div className="vis-section__title">
              <span>📞 CALL STACK FRAME ({activeFunction.functionName})</span>
            </div>

            <div className="vis-func-card">
              <div className="vis-func-header">
                <span className="vis-func-name">{activeFunction.functionName}()</span>
                <span className="vis-func-status">{activeFunction.status}</span>
              </div>

              <div className="vis-func-args">
                <span className="vis-func-args-label">Arguments:</span>
                {Object.entries(activeFunction.args || {}).map(([argName, argVal]) => (
                  <span key={argName} className="vis-func-arg-badge">
                    {argName} = {JSON.stringify(argVal)}
                  </span>
                ))}
              </div>

              {activeFunction.returnValue !== undefined && (
                <div className="vis-func-return">
                  <span className="vis-func-return-label">Returned Value:</span>
                  <span className="vis-func-return-val">{JSON.stringify(activeFunction.returnValue)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
