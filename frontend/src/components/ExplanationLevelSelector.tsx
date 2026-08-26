import type { ExplanationLevel } from '../types';

interface ExplanationLevelSelectorProps {
  currentLevel: ExplanationLevel;
  onLevelChange: (level: ExplanationLevel) => void;
}

export default function ExplanationLevelSelector({
  currentLevel,
  onLevelChange,
}: ExplanationLevelSelectorProps) {
  const levels: { id: ExplanationLevel; label: string; description: string }[] = [
    { id: 'beginner', label: 'Beginner', description: 'Simple language, direct answers' },
    { id: 'intermediate', label: 'Intermediate', description: 'Clear concepts & control flow' },
    { id: 'detailed', label: 'Detailed', description: 'Step-by-step state & memory breakdown' },
  ];

  return (
    <div className="explanation-level-selector">
      <span className="explanation-level-selector__label">Level:</span>
      <div className="explanation-level-selector__group">
        {levels.map((lvl) => {
          const isActive = currentLevel === lvl.id;
          return (
            <button
              key={lvl.id}
              className={`level-btn ${isActive ? 'level-btn--active' : ''}`}
              onClick={() => onLevelChange(lvl.id)}
              title={lvl.description}
            >
              {lvl.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
