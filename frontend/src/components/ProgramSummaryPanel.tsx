import type { ProgramSummaryResponse } from '../types';

interface ProgramSummaryPanelProps {
  summary: ProgramSummaryResponse | null;
  isLoading: boolean;
  onClose: () => void;
}

export default function ProgramSummaryPanel({ summary, isLoading, onClose }: ProgramSummaryPanelProps) {
  if (!summary && !isLoading) return null;

  return (
    <div className="modal-backdrop fade-in" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header__title">
            <span>📖 Program Summary & Explanation</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {isLoading ? (
            <div className="modal-loading">
              <div className="parse-button__spinner modal-spinner" />
              <span>Generating AI Program Explanation...</span>
            </div>
          ) : summary ? (
            <div className="summary-content">
              {/* Section 1: Purpose */}
              <div className="summary-section">
                <div className="summary-section__title">🎯 PROGRAM PURPOSE</div>
                <div className="summary-section__text">{summary.purpose}</div>
              </div>

              {/* Section 2: How It Works */}
              <div className="summary-section">
                <div className="summary-section__title">⚙️ HOW IT WORKS</div>
                <div className="summary-steps-list">
                  {summary.how_it_works.map((step, idx) => (
                    <div key={idx} className="summary-step-item">
                      <span className="summary-step-num">{idx + 1}.</span>
                      <span className="summary-step-text">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Key Concepts */}
              {summary.concepts && summary.concepts.length > 0 && (
                <div className="summary-section">
                  <div className="summary-section__title">💡 KEY CONCEPTS</div>
                  <div className="concepts-badges-grid">
                    {summary.concepts.map((concept, idx) => (
                      <span key={idx} className="concept-badge">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: Final Variables & Output */}
              <div className="summary-grid-2col">
                {/* Final Variables */}
                <div className="summary-section">
                  <div className="summary-section__title">📦 FINAL VARIABLES</div>
                  {Object.keys(summary.final_variables || {}).length === 0 ? (
                    <div className="summary-empty-hint">No final variables</div>
                  ) : (
                    <div className="final-vars-list">
                      {Object.entries(summary.final_variables).map(([k, val]) => (
                        <div key={k} className="final-var-item">
                          <span className="final-var-name">{k}</span>
                          <span className="final-var-val">{JSON.stringify(val)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Output Console */}
                <div className="summary-section">
                  <div className="summary-section__title">💻 PROGRAM OUTPUT</div>
                  {summary.output.length === 0 ? (
                    <div className="summary-empty-hint">No printed output</div>
                  ) : (
                    <div className="summary-output-box">
                      {summary.output.map((outStr, idx) => (
                        <div key={idx} className="summary-output-line">
                          {outStr}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
