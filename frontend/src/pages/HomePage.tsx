import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import CodeEditor, { DEFAULT_CODE } from '../components/CodeEditor';
import LanguageSelector from '../components/LanguageSelector';
import SampleProgramsSelector, { SampleProgram } from '../components/SampleProgramsSelector';
import ASTTreeView from '../components/ASTTreeView';
import ParseInfoPanel from '../components/ParseInfoPanel';
import StatusConsole from '../components/StatusConsole';
import TabView from '../components/TabView';
import ExecutionControls from '../components/ExecutionControls';
import ExecutionTimeline from '../components/ExecutionTimeline';
import VariableStatePanel from '../components/VariableStatePanel';
import OutputPanel from '../components/OutputPanel';
import VisualizationCanvas from '../components/VisualizationCanvas';
import AIExplanationPanel from '../components/AIExplanationPanel';
import ProgramSummaryPanel from '../components/ProgramSummaryPanel';

import { parseCode, executeCode, explainStep, explainProgram } from '../services/api';
import { planVisualization } from '../visualization/visualizationPlanner';
import { computeVisualizationState } from '../visualization/visualizationState';

import type {
  SupportedLanguage,
  ASTNode,
  ParseInfo,
  ConsoleMessage,
  ExecutionTrace,
  ExecutionStep,
  ExplanationLevel,
  ExplanationResponse,
  ProgramSummaryResponse,
} from '../types';

let messageIdCounter = 0;

function createMessage(level: ConsoleMessage['level'], message: string): ConsoleMessage {
  return {
    id: String(++messageIdCounter),
    timestamp: new Date(),
    level,
    message,
  };
}

export default function HomePage() {
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [code, setCode] = useState<string>(DEFAULT_CODE.python);
  const [ast, setAst] = useState<ASTNode | null>(null);
  const [parseInfo, setParseInfo] = useState<ParseInfo | null>(null);
  const [activeTab, setActiveTab] = useState('visual');
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  // Phase 2 & 3 Execution & Visualization State
  const [trace, setTrace] = useState<ExecutionTrace | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);

  // Phase 4 AI Explanation State
  const [explanationLevel, setExplanationLevel] = useState<ExplanationLevel>('intermediate');
  const [currentExplanation, setCurrentExplanation] = useState<ExplanationResponse | null>(null);
  const [isExplainingStep, setIsExplainingStep] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  // Whole Program Summary Modal State
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [programSummary, setProgramSummary] = useState<ProgramSummaryResponse | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Explanation cache map: key = `${step_index}_${level}`
  const explanationCacheRef = useRef<Map<string, ExplanationResponse>>(new Map());

  // Resizable panel state
  const [leftWidth, setLeftWidth] = useState(50);
  const isResizing = useRef(false);

  const addMessage = useCallback((level: ConsoleMessage['level'], message: string) => {
    setMessages((prev) => [...prev, createMessage(level, message)]);
  }, []);

  const handleLanguageChange = useCallback(
    (newLang: SupportedLanguage) => {
      setLanguage(newLang);
      setCode(DEFAULT_CODE[newLang]);
      setTrace(null);
      setCurrentStepIndex(0);
      setIsPlaying(false);
      explanationCacheRef.current.clear();
      setCurrentExplanation(null);
      addMessage('info', `Switched active language to ${newLang.toUpperCase()}`);
    },
    [addMessage]
  );

  const handleSelectSample = useCallback(
    (sample: SampleProgram) => {
      setLanguage(sample.language);
      setCode(sample.code);
      setTrace(null);
      setCurrentStepIndex(0);
      setIsPlaying(false);
      explanationCacheRef.current.clear();
      setCurrentExplanation(null);
      addMessage('info', `Loaded example program: ${sample.title}`);
    },
    [addMessage]
  );

  // Phase 1 Parse Handler
  const handleParse = useCallback(async () => {
    if (!code.trim()) {
      addMessage('warning', 'Parse skipped: Code block cannot be empty');
      return;
    }

    setIsParsing(true);
    const lineCount = code.split('\n').length;
    addMessage('info', `Parsing ${language.toUpperCase()} code (${lineCount} lines)...`);

    try {
      const response = await parseCode({ language, code });

      if (!response || !response.ast) {
        throw new Error('Invalid Response: Server returned 200 OK but AST structure was empty or null.');
      }

      setAst(response.ast);
      const info = response.parse_info || response.parseInfo || {
        language,
        node_count: 0,
        parse_time_ms: 0,
        has_errors: false,
      };
      setParseInfo(info);
      setActiveTab('ast');

      const nodeCount = info.node_count ?? info.nodeCount ?? 0;
      const parseTime = info.parse_time_ms ?? info.parseTimeMs ?? 0;
      const hasErr = info.has_errors ?? info.hasErrors ?? false;
      const timeFormatted = parseTime < 1 ? `${(parseTime * 1000).toFixed(0)}µs` : `${parseTime.toFixed(2)}ms`;

      addMessage(
        'success',
        `Parse succeeded — Generated ${nodeCount} AST nodes in ${timeFormatted}${hasErr ? ' (syntax warning)' : ''}`
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[HomePage handleParse Error]:', err);
      addMessage('error', `Parse failed: ${errorMessage}`);
    } finally {
      setIsParsing(false);
    }
  }, [code, language, addMessage]);

  // Phase 2 & 3 Execution & Visualization Handler
  const handleExecute = useCallback(async () => {
    if (!code.trim()) {
      addMessage('warning', 'Execution skipped: Code block is empty');
      return;
    }

    if (language !== 'python') {
      addMessage('warning', 'Execution simulation is currently active for Python');
      return;
    }

    setIsExecuting(true);
    setIsPlaying(false);
    explanationCacheRef.current.clear();
    setCurrentExplanation(null);
    addMessage('info', 'Starting Python execution engine...');

    try {
      const response = await executeCode({ language, code });
      const execTrace = response.trace;

      if (!execTrace) {
        throw new Error('Execution engine returned empty trace data');
      }

      setTrace(execTrace);

      if (execTrace.status === 'error') {
        addMessage('error', `Execution error: ${execTrace.error_message || 'Runtime error'}`);
      } else if (execTrace.status === 'limit_exceeded') {
        addMessage('warning', `Execution limit exceeded: ${execTrace.error_message}`);
      } else {
        addMessage('success', `Execution completed — ${execTrace.total_steps} steps generated`);
      }

      if (execTrace.steps && execTrace.steps.length > 0) {
        setCurrentStepIndex(1);
      } else {
        setCurrentStepIndex(0);
      }

      setActiveTab('visual');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[HomePage handleExecute Error]:', err);
      addMessage('error', `Execution failed: ${errorMessage}`);
    } finally {
      setIsExecuting(false);
    }
  }, [code, language, addMessage]);

  // Phase 3 Visualization Planner & State Computation
  const visualizationEvents = useMemo(() => {
    return planVisualization(trace);
  }, [trace]);

  const visState = useMemo(() => {
    return computeVisualizationState(visualizationEvents, trace, currentStepIndex);
  }, [visualizationEvents, trace, currentStepIndex]);

  // Phase 4 AI Explanation Fetcher with Caching
  const fetchStepExplanation = useCallback(
    async (stepIdx: number, level: ExplanationLevel) => {
      if (!trace || !trace.steps || stepIdx < 1 || stepIdx > trace.steps.length) {
        setCurrentExplanation(null);
        return;
      }

      const cacheKey = `${stepIdx}_${level}`;
      if (explanationCacheRef.current.has(cacheKey)) {
        setCurrentExplanation(explanationCacheRef.current.get(cacheKey)!);
        return;
      }

      setIsExplainingStep(true);
      setExplanationError(null);

      try {
        const response = await explainStep({
          language,
          code,
          execution_trace: trace,
          current_step_index: stepIdx,
          explanation_level: level,
        });

        explanationCacheRef.current.set(cacheKey, response);
        setCurrentExplanation(response);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('[fetchStepExplanation Error]:', err);
        setExplanationError(errorMsg);
      } finally {
        setIsExplainingStep(false);
      }
    },
    [trace, language, code]
  );

  // Automatically update AI explanation when currentStepIndex or explanationLevel changes
  useEffect(() => {
    if (currentStepIndex > 0 && trace && trace.steps.length > 0) {
      fetchStepExplanation(currentStepIndex, explanationLevel);
    }
  }, [currentStepIndex, explanationLevel, trace, fetchStepExplanation]);

  // Whole Program Explanation Handler
  const handleExplainProgram = useCallback(async () => {
    if (!trace) {
      addMessage('warning', 'Run execution first to explain the whole program');
      return;
    }

    setIsSummaryOpen(true);
    setIsLoadingSummary(true);

    try {
      const summary = await explainProgram({
        language,
        code,
        execution_trace: trace,
      });
      setProgramSummary(summary);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      addMessage('error', `Failed to generate program summary: ${errorMsg}`);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [trace, language, code, addMessage]);

  // Playback Timer Loop
  useEffect(() => {
    let timerId: any = null;

    if (isPlaying && trace && trace.steps.length > 0) {
      const intervalMs = Math.max(200, 1000 / speed);
      timerId = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= trace.steps.length) {
            setIsPlaying(false);
            addMessage('info', 'Visual explanation playback completed');
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isPlaying, trace, speed, addMessage]);

  const handleNextStep = useCallback(() => {
    if (trace && currentStepIndex < trace.steps.length) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [trace, currentStepIndex]);

  const handlePrevStep = useCallback(() => {
    if (currentStepIndex > 1) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const handleResetStep = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(trace && trace.steps.length > 0 ? 1 : 0);
    addMessage('info', 'Execution reset to Step 1');
  }, [trace, addMessage]);

  const handleSelectStep = useCallback((stepIdx: number) => {
    setIsPlaying(false);
    setCurrentStepIndex(stepIdx);
  }, []);

  const handleClearConsole = useCallback(() => {
    setMessages([]);
  }, []);

  // Compute current step details
  const currentStep: ExecutionStep | null =
    trace && currentStepIndex > 0 && currentStepIndex <= trace.steps.length
      ? trace.steps[currentStepIndex - 1]
      : null;

  const activeLineNumber = currentStep ? currentStep.line_start : null;
  const currentOutputs = trace ? trace.output : [];

  // Resize handlers
  const handleResizeStart = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const pct = (e.clientX / window.innerWidth) * 100;
      setLeftWidth(Math.max(25, Math.min(75, pct)));
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const tabs = [
    {
      id: 'visual',
      label: '🎨 Visual Explanation',
      content: (
        <div className="execution-tab-view">
          <ExecutionControls
            language={language}
            isExecuting={isExecuting}
            hasTrace={Boolean(trace && trace.steps.length > 0)}
            isPlaying={isPlaying}
            currentStepIndex={currentStepIndex}
            totalSteps={trace ? trace.steps.length : 0}
            speed={speed}
            onExecute={handleExecute}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            onReset={handleResetStep}
            onSpeedChange={setSpeed}
          />
          <VisualizationCanvas
            visState={visState}
            currentStepIndex={currentStepIndex}
            totalSteps={trace ? trace.steps.length : 0}
          />
        </div>
      ),
    },
    {
      id: 'ai-explain',
      label: '🤖 AI Explanation',
      content: (
        <div className="execution-tab-view">
          <ExecutionControls
            language={language}
            isExecuting={isExecuting}
            hasTrace={Boolean(trace && trace.steps.length > 0)}
            isPlaying={isPlaying}
            currentStepIndex={currentStepIndex}
            totalSteps={trace ? trace.steps.length : 0}
            speed={speed}
            onExecute={handleExecute}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            onReset={handleResetStep}
            onSpeedChange={setSpeed}
          />
          <AIExplanationPanel
            explanation={currentExplanation}
            isLoading={isExplainingStep}
            error={explanationError}
            explanationLevel={explanationLevel}
            currentStepIndex={currentStepIndex}
            totalSteps={trace ? trace.steps.length : 0}
            onLevelChange={setExplanationLevel}
            onExplainProgram={handleExplainProgram}
          />
        </div>
      ),
    },
    {
      id: 'execution',
      label: '⚡ Execution Timeline',
      content: (
        <div className="execution-tab-view">
          <ExecutionControls
            language={language}
            isExecuting={isExecuting}
            hasTrace={Boolean(trace && trace.steps.length > 0)}
            isPlaying={isPlaying}
            currentStepIndex={currentStepIndex}
            totalSteps={trace ? trace.steps.length : 0}
            speed={speed}
            onExecute={handleExecute}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            onReset={handleResetStep}
            onSpeedChange={setSpeed}
          />

          {trace && (
            <>
              <VariableStatePanel
                state={currentStep ? currentStep.state : trace.final_state}
                activeVariable={currentStep?.variable}
              />
              <OutputPanel output={currentOutputs} />
              <ExecutionTimeline
                steps={trace.steps}
                currentStepIndex={currentStepIndex}
                onSelectStep={handleSelectStep}
              />
            </>
          )}

          {!trace && (
            <div className="ast-tree__empty">
              <div className="ast-tree__empty-icon">⚡</div>
              <div className="ast-tree__empty-text">No execution trace generated</div>
              <div className="ast-tree__empty-hint">
                Click <strong>⚡ Execute</strong> in the controls bar to simulate code execution
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'ast',
      label: '🌳 AST Tree',
      content: <ASTTreeView ast={ast} />,
    },
    {
      id: 'info',
      label: '📊 Parse Info',
      content: <ParseInfoPanel parseInfo={parseInfo} />,
    },
  ];

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__logo">
          <div className="app-header__logo-icon">CS</div>
          <span className="app-header__title">CodeScape AI</span>
        </div>
        <div className="app-header__actions">
          <Link to="/project" className="btn-header-action btn-header-action--primary">
            🏗️ Project Explorer
          </Link>
          <span className="app-header__badge">Phase 5</span>
        </div>
      </header>


      {/* Main Content */}
      <div className="app-main">
        {/* Left Panel — Editor */}
        <div className="panel panel--left" style={{ width: `${leftWidth}%` }}>
          <div className="controls-bar">
            <LanguageSelector value={language} onChange={handleLanguageChange} />
            <SampleProgramsSelector onSelectSample={handleSelectSample} />

            <button
              className={`parse-button ${isParsing ? 'parse-button--loading' : ''}`}
              onClick={handleParse}
              disabled={isParsing}
              id="parse-button"
              title="Parse AST"
            >
              {isParsing ? (
                <>
                  <div className="parse-button__spinner" />
                  Parsing...
                </>
              ) : (
                <>🌳 Parse</>
              )}
            </button>

            <button
              className={`parse-button parse-button--execute ${isExecuting ? 'parse-button--loading' : ''}`}
              onClick={handleExecute}
              disabled={isExecuting || language !== 'python'}
              id="execute-button"
              title={language !== 'python' ? 'Execution engine is active for Python' : 'Run Python Execution & Visual Explanation'}
            >
              {isExecuting ? (
                <>
                  <div className="parse-button__spinner" />
                  Executing...
                </>
              ) : (
                <>🎨 Visual Explain</>
              )}
            </button>
          </div>

          <CodeEditor
            language={language}
            value={code}
            onChange={setCode}
            activeLineNumber={activeLineNumber}
          />
        </div>

        {/* Resize Handle */}
        <div
          className={`resize-handle ${isResizing.current ? 'resize-handle--active' : ''}`}
          onMouseDown={handleResizeStart}
        />

        {/* Right Panel — Tabs */}
        <div className="panel panel--right" style={{ width: `${100 - leftWidth}%` }}>
          <TabView tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Status Console */}
      <StatusConsole messages={messages} onClear={handleClearConsole} />

      {/* Program Summary Modal */}
      {isSummaryOpen && (
        <ProgramSummaryPanel
          summary={programSummary}
          isLoading={isLoadingSummary}
          onClose={() => setIsSummaryOpen(false)}
        />
      )}
    </div>
  );
}
