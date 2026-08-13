import type { VariableState } from '../types';

interface VariableStatePanelProps {
  state: Record<string, VariableState>;
  activeVariable?: string | null;
}

export default function VariableStatePanel({ state, activeVariable }: VariableStatePanelProps) {
  const entries = Object.entries(state || {});

  if (entries.length === 0) {
    return (
      <div className="var-panel var-panel--empty">
        <span className="var-panel__title">VARIABLES</span>
        <span className="var-panel__hint">No active variables in memory</span>
      </div>
    );
  }

  return (
    <div className="var-panel fade-in">
      <div className="var-panel__header">
        <span className="var-panel__title">PROGRAM MEMORY STATE</span>
        <span className="var-panel__count">{entries.length} variable(s)</span>
      </div>

      <div className="var-panel__grid">
        {entries.map(([name, varInfo]) => {
          const isHighlighted = activeVariable === name;
          const displayValue = typeof varInfo.value === 'object' ? JSON.stringify(varInfo.value) : String(varInfo.value);

          return (
            <div
              key={name}
              className={`var-card ${isHighlighted ? 'var-card--active' : ''}`}
            >
              <div className="var-card__name">{name}</div>
              <div className="var-card__value">{displayValue}</div>
              <div className="var-card__type">{varInfo.type}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
