import { useState, useRef, useEffect } from 'react';
import type { SupportedLanguage } from '../types';

interface LanguageConfig {
  id: SupportedLanguage;
  label: string;
  shortLabel: string;
}

const LANGUAGES: LanguageConfig[] = [
  { id: 'python', label: 'Python', shortLabel: 'PY' },
  { id: 'java', label: 'Java', shortLabel: 'JV' },
  { id: 'javascript', label: 'JavaScript', shortLabel: 'JS' },
];

interface LanguageSelectorProps {
  value: SupportedLanguage;
  onChange: (language: SupportedLanguage) => void;
}

export default function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = LANGUAGES.find((l) => l.id === value)!;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="language-selector" ref={ref}>
      <button
        className="language-selector__button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        id="language-selector-button"
      >
        <span className={`language-selector__icon language-selector__icon--${value}`}>
          {selected.shortLabel}
        </span>
        <span>{selected.label}</span>
        <span className={`language-selector__chevron ${isOpen ? 'language-selector__chevron--open' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="language-selector__dropdown" role="listbox" aria-labelledby="language-selector-button">
          {LANGUAGES.map((lang) => (
            <div
              key={lang.id}
              className={`language-selector__option ${lang.id === value ? 'language-selector__option--active' : ''}`}
              role="option"
              aria-selected={lang.id === value}
              onClick={() => {
                onChange(lang.id);
                setIsOpen(false);
              }}
            >
              <span className={`language-selector__icon language-selector__icon--${lang.id}`}>
                {lang.shortLabel}
              </span>
              <span>{lang.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
