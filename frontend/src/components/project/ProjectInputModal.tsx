import { useState } from 'react';
import type { ProjectFileInput } from '../../types/project';

interface ProjectInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (files: ProjectFileInput[], projectName: string) => void;
  onLoadSample: () => void;
  isLoading: boolean;
}

export default function ProjectInputModal({
  isOpen,
  onClose,
  onAnalyze,
  onLoadSample,
  isLoading,
}: ProjectInputModalProps) {
  const [projectName, setProjectName] = useState('My Custom Project');
  const [files, setFiles] = useState<ProjectFileInput[]>([
    { path: 'backend/main.py', content: 'from fastapi import FastAPI\napp = FastAPI()' },
    { path: 'frontend/src/App.tsx', content: 'export default function App() { return <div>App</div>; }' },
  ]);
  const [newPath, setNewPath] = useState('');
  const [newContent, setNewContent] = useState('');

  if (!isOpen) return null;

  const handleAddFile = () => {
    if (!newPath.trim()) return;
    setFiles((prev) => [...prev, { path: newPath.trim(), content: newContent }]);
    setNewPath('');
    setNewContent('');
  };

  const handleRemoveFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (files.length === 0) return;
    onAnalyze(files, projectName);
  };

  return (
    <div className="project-modal-backdrop">
      <div className="project-modal-container">
        <div className="project-modal-header">
          <span className="project-modal-title">📁 Import & Manage Project Files</span>
          <button className="project-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="project-modal-body">
          <div className="project-modal-section">
            <label className="project-input-label">Project Name</label>
            <input
              type="text"
              className="project-text-input"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          <div className="project-modal-section">
            <div className="flex-between">
              <label className="project-input-label">Project Files ({files.length})</label>
              <button
                type="button"
                className="btn-sample-load"
                onClick={onLoadSample}
                disabled={isLoading}
              >
                ✨ Quick Load CodeScape Sample
              </button>
            </div>

            <div className="modal-file-list">
              {files.map((f, i) => (
                <div key={i} className="modal-file-item">
                  <span className="modal-file-path">📄 {f.path}</span>
                  <span className="modal-file-size">({f.content.length} chars)</span>
                  <button
                    type="button"
                    className="modal-file-remove"
                    onClick={() => handleRemoveFile(i)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add file form */}
          <div className="project-modal-add-form">
            <span className="project-input-label">Add a New File to Project:</span>
            <input
              type="text"
              className="project-text-input"
              placeholder="e.g. backend/services/calc.py or frontend/src/Header.tsx"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
            />
            <textarea
              className="project-textarea-input"
              placeholder="Paste file source code here..."
              rows={5}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
            <button
              type="button"
              className="btn-add-file"
              onClick={handleAddFile}
              disabled={!newPath.trim()}
            >
              ➕ Add File to Project
            </button>
          </div>
        </div>

        <div className="project-modal-footer">
          <button type="button" className="btn-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-modal-analyze"
            onClick={handleSubmit}
            disabled={files.length === 0 || isLoading}
          >
            {isLoading ? 'Analyzing Project...' : '🔍 Analyze Architecture'}
          </button>
        </div>
      </div>
    </div>
  );
}
