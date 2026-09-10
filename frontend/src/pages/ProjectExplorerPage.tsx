import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ProjectFileTree from '../components/project/ProjectFileTree';
import ProjectArchitectureGraph from '../components/project/ProjectArchitectureGraph';
import FileInspector from '../components/project/FileInspector';
import ArchitectureWalkthrough from '../components/project/ArchitectureWalkthrough';
import ProjectInputModal from '../components/project/ProjectInputModal';

import { analyzeProject, fetchSampleProject } from '../services/api';
import type {
  ProjectAnalysisResponse,
  ProjectFile,
  ProjectNode,
  ProjectFileInput,
} from '../types/project';

export default function ProjectExplorerPage() {
  const [analysis, setAnalysis] = useState<ProjectAnalysisResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [currentArchitectureStepIndex, setCurrentArchitectureStepIndex] = useState<number>(0);
  const [isArchPlaying, setIsArchPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Load sample project on initial mount
  const handleLoadSample = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sample = await fetchSampleProject();
      const res = await analyzeProject({
        project_name: sample.project_name,
        files: sample.files,
      });
      setAnalysis(res);
      if (res.files.length > 0) {
        setSelectedFile(res.files[0]);
      }
      setCurrentArchitectureStepIndex(0);
      setIsArchPlaying(false);
      setIsModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    handleLoadSample();
  }, [handleLoadSample]);

  // Handle manual project analyze from modal
  const handleAnalyzeCustom = async (files: ProjectFileInput[], projectName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await analyzeProject({
        project_name: projectName,
        files,
      });
      setAnalysis(res);
      if (res.files.length > 0) {
        setSelectedFile(res.files[0]);
      }
      setCurrentArchitectureStepIndex(0);
      setIsArchPlaying(false);
      setIsModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFile = (file: ProjectFile) => {
    setSelectedFile(file);
  };

  const handleSelectNode = (node: ProjectNode) => {
    if (!analysis) return;
    const match = analysis.files.find((f) => f.path === node.file_path || f.id === node.id);
    if (match) setSelectedFile(match);
  };

  const handleSelectFileByPath = (path: string) => {
    if (!analysis) return;
    const match = analysis.files.find((f) => f.path === path);
    if (match) setSelectedFile(match);
  };

  // Compute active walkthrough step highlights
  const activeWalkthroughStep =
    analysis && analysis.architecture_walkthrough.length > 0
      ? analysis.architecture_walkthrough[currentArchitectureStepIndex]
      : null;

  const highlightedFiles = activeWalkthroughStep ? activeWalkthroughStep.highlighted_files : [];
  const highlightedEdges = activeWalkthroughStep ? activeWalkthroughStep.highlighted_edges : [];

  return (
    <div className="project-layout">
      {/* Top Header */}
      <header className="app-header">
        <div className="app-header__logo">
          <div className="app-header__logo-icon">CS</div>
          <span className="app-header__title">CodeScape AI</span>
          <span className="app-header__subtitle">Project Architecture Explorer</span>
        </div>

        <div className="app-header__actions">
          <button
            className="btn-header-action"
            onClick={handleLoadSample}
            disabled={isLoading}
          >
            ✨ Reload Sample
          </button>
          <button
            className="btn-header-action btn-header-action--primary"
            onClick={() => setIsModalOpen(true)}
          >
            📁 Manage / Add Files
          </button>
          <Link to="/" className="btn-header-action">
            ⚡ Single Code Mode
          </Link>
          <span className="app-header__badge">Phase 5</span>
        </div>
      </header>

      {/* High-level Project Summary Banner */}
      {analysis && (
        <div className="project-summary-bar">
          <span className="project-summary-title">🏗️ {analysis.project_name}:</span>
          <span className="project-summary-text">{analysis.project_summary}</span>
        </div>
      )}

      {error && <div className="project-error-bar">⚠️ {error}</div>}

      {/* Main 3-Column Workspace */}
      <div className="project-main-grid">
        {/* Left Column: Project File Tree */}
        <div className="project-col project-col--left">
          <ProjectFileTree
            files={analysis ? analysis.files : []}
            selectedFileId={selectedFile ? selectedFile.id : null}
            onSelectFile={handleSelectFile}
            highlightedFiles={highlightedFiles}
          />
        </div>

        {/* Center Column: Architecture Graph & Walkthrough Controls */}
        <div className="project-col project-col--center">
          <div className="project-graph-wrapper">
            {analysis ? (
              <ProjectArchitectureGraph
                graph={analysis.project_graph}
                selectedFileId={selectedFile ? selectedFile.id : null}
                highlightedFiles={highlightedFiles}
                highlightedEdges={highlightedEdges}
                onSelectNode={handleSelectNode}
              />
            ) : (
              <div className="graph-loading">Loading Architecture Graph...</div>
            )}
          </div>

          {/* Bottom Walkthrough Controls */}
          {analysis && (
            <ArchitectureWalkthrough
              steps={analysis.architecture_walkthrough}
              currentStepIndex={currentArchitectureStepIndex}
              isPlaying={isArchPlaying}
              onStepChange={setCurrentArchitectureStepIndex}
              onPlayPause={() => setIsArchPlaying(!isArchPlaying)}
              onReset={() => {
                setIsArchPlaying(false);
                setCurrentArchitectureStepIndex(0);
              }}
            />
          )}
        </div>

        {/* Right Column: File Inspector */}
        <div className="project-col project-col--right">
          <FileInspector
            file={selectedFile}
            dependencies={analysis ? analysis.dependencies : []}
            allFiles={analysis ? analysis.files : []}
            onSelectFileByPath={handleSelectFileByPath}
          />
        </div>
      </div>

      {/* Project Input & File Paste Modal */}
      <ProjectInputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAnalyze={handleAnalyzeCustom}
        onLoadSample={handleLoadSample}
        isLoading={isLoading}
      />
    </div>
  );
}
