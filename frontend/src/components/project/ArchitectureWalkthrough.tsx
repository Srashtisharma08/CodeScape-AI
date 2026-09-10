import { useEffect } from 'react';
import type { ArchitectureStep } from '../../types/project';

interface ArchitectureWalkthroughProps {
  steps: ArchitectureStep[];
  currentStepIndex: number; // 0-based
  isPlaying: boolean;
  onStepChange: (index: number) => void;
  onPlayPause: () => void;
  onReset: () => void;
}

export default function ArchitectureWalkthrough({
  steps,
  currentStepIndex,
  isPlaying,
  onStepChange,
  onPlayPause,
  onReset,
}: ArchitectureWalkthroughProps) {
  // Autoplay loop
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && steps.length > 0) {
      timer = setInterval(() => {
        if (currentStepIndex >= steps.length - 1) {
          onPlayPause(); // pause at end
        } else {
          onStepChange(currentStepIndex + 1);
        }
      }, 3000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, currentStepIndex, steps.length, onStepChange, onPlayPause]);

  if (steps.length === 0) return null;

  const currentStep = steps[currentStepIndex] || steps[0];

  return (
    <div className="arch-walkthrough">
      <div className="arch-walkthrough__controls">
        <div className="arch-walkthrough__title-section">
          <span className="arch-walkthrough__icon">▶</span>
          <span className="arch-walkthrough__label">Explain Application Flow</span>
          <span className="arch-walkthrough__progress">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
        </div>

        <div className="arch-walkthrough__buttons">
          <button
            className="walkthrough-btn"
            onClick={onReset}
            title="Reset to Step 1"
          >
            ↺ Reset
          </button>
          <button
            className="walkthrough-btn"
            onClick={() => onStepChange(Math.max(0, currentStepIndex - 1))}
            disabled={currentStepIndex === 0}
            title="Previous Step"
          >
            ⏮ Prev
          </button>
          <button
            className={`walkthrough-btn walkthrough-btn--primary ${
              isPlaying ? 'walkthrough-btn--playing' : ''
            }`}
            onClick={onPlayPause}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            className="walkthrough-btn"
            onClick={() => onStepChange(Math.min(steps.length - 1, currentStepIndex + 1))}
            disabled={currentStepIndex >= steps.length - 1}
            title="Next Step"
          >
            Next ⏭
          </button>
        </div>
      </div>

      <div className="arch-step-card">
        <div className="arch-step-card__header">
          <span className="arch-step-card__title">{currentStep.title}</span>
          {currentStep.highlighted_files.length > 0 && (
            <div className="arch-step-card__files">
              {currentStep.highlighted_files.map((p, idx) => (
                <span key={idx} className="step-file-badge">
                  📄 {p}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="arch-step-card__desc">{currentStep.description}</div>
      </div>
    </div>
  );
}
