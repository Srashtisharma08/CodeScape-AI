import { useEffect, useRef } from 'react';
import type { ExecutionStep } from '../types';

interface ExecutionTimelineProps {
  steps: ExecutionStep[];
  currentStepIndex: number;
  onSelectStep: (stepIndex: number) => void;
}

function getActionBadgeClass(action: string): string {
  switch (action) {
    case 'assign':
      return 'action-badge--assign';
    case 'evaluate_condition':
      return 'action-badge--cond';
    case 'branch':
      return 'action-badge--branch';
    case 'loop_iteration':
    case 'loop_init':
    case 'loop_exit':
      return 'action-badge--loop';
    case 'call_function':
    case 'return_function':
    case 'define_function':
      return 'action-badge--func';
    case 'output':
      return 'action-badge--output';
    default:
      return 'action-badge--default';
  }
}

export default function ExecutionTimeline({ steps, currentStepIndex, onSelectStep }: ExecutionTimelineProps) {
  const activeStepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeStepRef.current) {
      activeStepRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentStepIndex]);

  if (!steps || steps.length === 0) {
    return (
      <div className="timeline__empty">
        <div className="ast-tree__empty-icon">⚡</div>
        <div className="ast-tree__empty-text">No execution trace</div>
        <div className="ast-tree__empty-hint">
          Click <strong>⚡ Execute</strong> above to generate a step-by-step timeline
        </div>
      </div>
    );
  }

  return (
    <div className="execution-timeline fade-in">
      <div className="timeline__header">
        <span>Step Timeline ({steps.length} Steps)</span>
      </div>

      <div className="timeline__list">
        {steps.map((step) => {
          const isActive = step.step_index === currentStepIndex;
          const badgeClass = getActionBadgeClass(step.action);

          return (
            <div
              key={step.id}
              ref={isActive ? activeStepRef : null}
              className={`timeline__item ${isActive ? 'timeline__item--active' : ''}`}
              onClick={() => onSelectStep(step.step_index)}
            >
              <div className="timeline__item-left">
                <span className="timeline__step-num">Step {step.step_index}</span>
                <span className="timeline__line-badge">Line {step.line_start}</span>
              </div>

              <div className="timeline__item-content">
                <div className="timeline__item-header">
                  <span className={`action-badge ${badgeClass}`}>
                    {step.action}
                  </span>
                  {step.variable && <span className="timeline__var-name">{step.variable}</span>}
                </div>
                <div className="timeline__description">{step.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
