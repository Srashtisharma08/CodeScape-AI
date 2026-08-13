import type { SupportedLanguage } from '../types';

interface ExecutionControlsProps {
  language: SupportedLanguage;
  isExecuting: boolean;
  hasTrace: boolean;
  isPlaying: boolean;
  currentStepIndex: number;
  totalSteps: number;
  speed: number;
  onExecute: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export default function ExecutionControls({
  language,
  isExecuting,
  hasTrace,
  isPlaying,
  currentStepIndex,
  totalSteps,
  speed,
  onExecute,
  onPlayPause,
  onNext,
  onPrev,
  onReset,
  onSpeedChange,
}: ExecutionControlsProps) {
  const isPython = language === 'python';

  return (
    <div className="execution-controls">
      {/* Run Execution Button */}
      <button
        className={`exec-btn exec-btn--primary ${isExecuting ? 'exec-btn--loading' : ''}`}
        onClick={onExecute}
        disabled={isExecuting || !isPython}
        title={!isPython ? 'Execution is currently available for Python' : 'Run Python Execution Engine'}
      >
        {isExecuting ? (
          <>
            <span className="exec-btn__spinner" />
            Executing...
          </>
        ) : (
          <>⚡ Execute</>
        )}
      </button>

      {!isPython && (
        <span className="exec-controls__notice">
          (Execution simulation is active for Python)
        </span>
      )}

      {hasTrace && (
        <>
          <div className="exec-controls__divider" />

          {/* Stepping & Playback Controls */}
          <div className="exec-controls__group">
            <button
              className="exec-btn exec-btn--icon"
              onClick={onReset}
              disabled={currentStepIndex === 0}
              title="Reset to Step 0 (↺)"
            >
              ↺ Reset
            </button>

            <button
              className="exec-btn exec-btn--icon"
              onClick={onPrev}
              disabled={currentStepIndex <= 1}
              title="Previous Step (⏮)"
            >
              ⏮ Prev
            </button>

            <button
              className={`exec-btn ${isPlaying ? 'exec-btn--pause' : 'exec-btn--play'}`}
              onClick={onPlayPause}
              disabled={totalSteps === 0 || currentStepIndex >= totalSteps}
              title={isPlaying ? 'Pause Playback' : 'Play Timeline'}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>

            <button
              className="exec-btn exec-btn--icon"
              onClick={onNext}
              disabled={currentStepIndex >= totalSteps}
              title="Next Step (⏭)"
            >
              Next ⏭
            </button>
          </div>

          <div className="exec-controls__divider" />

          {/* Speed Selector */}
          <div className="exec-controls__speed">
            <span className="exec-controls__speed-label">Speed:</span>
            {[0.5, 1, 1.5, 2].map((s) => (
              <button
                key={s}
                className={`speed-badge ${speed === s ? 'speed-badge--active' : ''}`}
                onClick={() => onSpeedChange(s)}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Step Counter */}
          <div className="exec-controls__step-counter">
            Step <strong>{currentStepIndex}</strong> / {totalSteps}
          </div>
        </>
      )}
    </div>
  );
}
