import { useState, useRef, useEffect } from 'react';
import type { SupportedLanguage } from '../types';

export interface SampleProgram {
  id: string;
  title: string;
  language: SupportedLanguage;
  code: string;
}

export const SAMPLE_PROGRAMS: SampleProgram[] = [
  {
    id: 'variables',
    title: '1. Variables & Addition',
    language: 'python',
    code: `x = 5
y = 10
z = x + y
`,
  },
  {
    id: 'condition',
    title: '2. If / Else Condition',
    language: 'python',
    code: `x = 10

if x > 5:
    result = "Greater"
else:
    result = "Smaller"
`,
  },
  {
    id: 'for_loop',
    title: '3. For Loop Counter',
    language: 'python',
    code: `total = 0

for i in range(5):
    total += i
`,
  },
  {
    id: 'while_loop',
    title: '4. While Loop Counter',
    language: 'python',
    code: `x = 0

while x < 3:
    x += 1
`,
  },
  {
    id: 'function',
    title: '5. Function Call & Return',
    language: 'python',
    code: `def add(a, b):
    return a + b

result = add(2, 3)
`,
  },
  {
    id: 'factorial',
    title: '6. Factorial Function',
    language: 'python',
    code: `def factorial(n):
    result = 1

    for i in range(1, n + 1):
        result *= i

    return result

answer = factorial(5)
print(answer)
`,
  },
];

interface SampleProgramsSelectorProps {
  onSelectSample: (sample: SampleProgram) => void;
}

export default function SampleProgramsSelector({ onSelectSample }: SampleProgramsSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="sample-selector" ref={dropdownRef}>
      <button
        className="sample-selector__button"
        onClick={() => setIsOpen(!isOpen)}
        title="Select a built-in demonstration code example"
      >
        <span>💡 Examples</span>
        <span className={`sample-selector__chevron ${isOpen ? 'sample-selector__chevron--open' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="sample-selector__dropdown">
          <div className="sample-selector__header">Preset Examples</div>
          {SAMPLE_PROGRAMS.map((sample) => (
            <div
              key={sample.id}
              className="sample-selector__option"
              onClick={() => {
                onSelectSample(sample);
                setIsOpen(false);
              }}
            >
              <span className="sample-selector__option-title">{sample.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
