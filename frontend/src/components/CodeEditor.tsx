import { useRef, useCallback, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { SupportedLanguage } from '../types';

const LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  python: 'python',
  java: 'java',
  javascript: 'javascript',
};

const DEFAULT_CODE: Record<SupportedLanguage, string> = {
  python: `def factorial(n):
    result = 1

    for i in range(1, n + 1):
        result *= i

    return result

answer = factorial(5)
print(answer)
`,
  java: `public class Calculator {
    private double result;

    public Calculator() {
        this.result = 0;
    }

    public double add(double a, double b) {
        result = a + b;
        return result;
    }

    public static void main(String[] args) {
        Calculator calc = new Calculator();
        System.out.println(calc.add(5, 3));
    }
}
`,
  javascript: `function quickSort(arr) {
  if (arr.length <= 1) {
    return arr;
  }

  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);

  return [...quickSort(left), ...middle, ...quickSort(right)];
}

const numbers = [3, 6, 8, 10, 1, 2, 1];
const sorted = quickSort(numbers);
console.log(sorted);
`,
};

interface CodeEditorProps {
  language: SupportedLanguage;
  value: string;
  onChange: (value: string) => void;
  activeLineNumber?: number | null;
}

export default function CodeEditor({ language, value, onChange, activeLineNumber }: CodeEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.focus();
  }, []);

  const handleChange = useCallback(
    (val: string | undefined) => {
      onChange(val ?? '');
    },
    [onChange]
  );

  // Update line highlighting when activeLineNumber changes
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco) return;

    if (activeLineNumber && activeLineNumber > 0) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
        {
          range: new monaco.Range(activeLineNumber, 1, activeLineNumber, 1),
          options: {
            isWholeLine: true,
            className: 'execution-line-highlight',
            glyphMarginClassName: 'execution-line-glyph',
          },
        },
      ]);
      editor.revealLineInCenterIfOutsideViewport(activeLineNumber);
    } else {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    }
  }, [activeLineNumber]);

  return (
    <div className="editor-wrapper">
      <Editor
        height="100%"
        language={LANGUAGE_MAP[language]}
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme="vs"
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          padding: { top: 12, bottom: 12 },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          tabSize: language === 'python' ? 4 : 2,
          automaticLayout: true,
          glyphMargin: true,
        }}
      />
    </div>
  );
}

export { DEFAULT_CODE };
