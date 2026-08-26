import type { ExplanationResponse, ExplanationLevel } from '../types';
import ExplanationLevelSelector from './ExplanationLevelSelector';

interface AIExplanationPanelProps {
  explanation: ExplanationResponse | null;
  isLoading: boolean;
  error: string | null;
  explanationLevel: ExplanationLevel;
  currentStepIndex: number;
  totalSteps: number;
  onLevelChange: (level: ExplanationLevel) => void;
  onExplainProgram: () => void;
}

export default function AIExplanationPanel({
  explanation,
  isLoading,
  error,
  explanationLevel,
  currentStepIndex,
  totalSteps,
  onLevelChange,
  onExplainProgram,
}: AIExplanationPanelProps) {
  if (currentStepIndex === 0) {
    return (
      <div className="ai-explanation-panel ai-explanation-panel--empty">
        <div className="ast-tree__empty-icon">🤖</div>
        <div className="ast-tree__empty-text">AI Explanation Engine</div>
        <div className="ast-tree__empty-hint">
          Execute code and step through the timeline to see step-by-step AI explanations
        </div>
      </div>
    );
  }

  return (
    <div className="ai-explanation-panel fade-in">
      {/* Control Header: Level Selector & Program Summary Button */}
      <div className="ai-explanation-panel__controls">
        <ExplanationLevelSelector currentLevel={explanationLevel} onLevelChange={onLevelChange} />

        <button
          className="exec-btn exec-btn--summary"
          onClick={onExplainProgram}
          title="Generate a high-level summary explanation for the entire program"
        >
          📖 Explain Whole Program
        </button>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="ai-explanation-loading">
          <div className="parse-button__spinner ai-spinner" />
          <span>Analyzing step {currentStepIndex}...</span>
        </div>
      ) : error ? (
        <div className="ai-explanation-error">
          <span className="ai-explanation-error__icon">⚠️</span>
          <span>{error}</span>
        </div>
      ) : explanation ? (
        <div className="ai-explanation-content">
          {/* Header Banner */}
          <div className="ai-banner">
            <div className="ai-banner__left">
              <span className="ai-banner__line-badge">📍 Line {explanation.line_start}</span>
              <span className="ai-banner__title">{explanation.title}</span>
            </div>
            <span className="ai-banner__step-badge">
              Step {currentStepIndex} of {totalSteps}
            </span>
          </div>

          {/* Section 1: What Happened? */}
          <div className="ai-section ai-section--what">
            <div className="ai-section__header">
              <span className="ai-section__icon">🔍</span>
              <span className="ai-section__title">What Happened?</span>
            </div>
            <div className="ai-section__body">{explanation.what_happened}</div>
          </div>

          {/* Section 2: Why? */}
          <div className="ai-section ai-section--why">
            <div className="ai-section__header">
              <span className="ai-section__icon">❓</span>
              <span className="ai-section__title">Why?</span>
            </div>
            <div className="ai-section__body ai-section__body--pre">{explanation.why}</div>
          </div>

          {/* Section 3: Variables Involved */}
          {explanation.variables_involved && explanation.variables_involved.length > 0 && (
            <div className="ai-section">
              <div className="ai-section__header">
                <span className="ai-section__icon">📦</span>
                <span className="ai-section__title">Variables Involved</span>
              </div>
              <div className="ai-vars-grid">
                {explanation.variables_involved.map((v, idx) => (
                  <div key={idx} className="ai-var-card">
                    <span className="ai-var-name">{v.name}</span>
                    <span className="ai-var-val">{JSON.stringify(v.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Programming Concepts */}
          {explanation.concepts && explanation.concepts.length > 0 && (
            <div className="ai-section">
              <div className="ai-section__header">
                <span className="ai-section__icon">💡</span>
                <span className="ai-section__title">Concepts</span>
              </div>
              <div className="concepts-badges-grid">
                {explanation.concepts.map((concept, idx) => (
                  <span key={idx} className="concept-badge">
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
