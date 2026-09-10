import { useState } from 'react';
import type { ProjectFile, DependencyEdge } from '../../types/project';

interface FileInspectorProps {
  file: ProjectFile | null;
  dependencies: DependencyEdge[];
  allFiles: ProjectFile[];
  onSelectFileByPath: (path: string) => void;
}

export default function FileInspector({
  file,
  dependencies,
  allFiles: _allFiles,
  onSelectFileByPath,
}: FileInspectorProps) {
  const [isExplaining, setIsExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  if (!file) {
    return (
      <div className="file-inspector file-inspector--empty">
        <div className="file-inspector__empty-icon">🔍</div>
        <div className="file-inspector__empty-title">Select a File to Inspect</div>
        <div className="file-inspector__empty-text">
          Click any file in the Project Tree or any node in the Architecture Graph to view its
          architectural role, dependencies, and imports.
        </div>
      </div>
    );
  }

  // Outgoing dependencies: what this file imports
  const outgoing = dependencies.filter((d) => d.source_file === file.path);
  // Incoming dependencies: files that import or call this file
  const incoming = dependencies.filter((d) => d.target_file === file.path);

  const handleExplainFile = () => {
    setIsExplaining(true);
    setTimeout(() => {
      setAiExplanation(
        `Architectural Explanation for ${file.name}:\n\n` +
          `• Role: ${file.category.replace('_', ' ').toUpperCase()} in the application hierarchy.\n` +
          `• Primary Responsibility: ${file.summary}\n` +
          `• Inbound Connections: ${incoming.length} files depend on or route to this module.\n` +
          `• Outbound Connections: Imports ${outgoing.length} modules (${outgoing
            .map((o) => o.symbol || o.target_file)
            .join(', ') || 'none'}).\n` +
          `• Complexity: ${file.line_count} lines of code.`
      );
      setIsExplaining(false);
    }, 400);
  };

  return (
    <div className="file-inspector">
      <div className="file-inspector__header">
        <div className="file-inspector__title-row">
          <span className="file-inspector__name">{file.name}</span>
          <span className={`file-inspector__badge badge--${file.category}`}>
            {file.category.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <div className="file-inspector__path">{file.path}</div>
      </div>

      <div className="file-inspector__body">
        {/* Purpose */}
        <div className="file-inspector__section">
          <div className="file-inspector__section-title">🎯 Architectural Purpose</div>
          <div className="file-inspector__purpose">{file.summary}</div>
        </div>

        {/* Explain File Button */}
        <div className="file-inspector__section">
          <button
            className="explain-file-btn"
            onClick={handleExplainFile}
            disabled={isExplaining}
          >
            {isExplaining ? 'Analyzing...' : '✨ Explain This File with AI'}
          </button>
          {aiExplanation && (
            <div className="file-ai-explanation">
              <pre>{aiExplanation}</pre>
            </div>
          )}
        </div>

        {/* Exports / Important Elements */}
        {file.exports.length > 0 && (
          <div className="file-inspector__section">
            <div className="file-inspector__section-title">
              ⚡ Important Elements & Exports ({file.exports.length})
            </div>
            <div className="symbol-tag-list">
              {file.exports.map((exp, idx) => (
                <span key={idx} className="symbol-tag">
                  {exp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Outgoing Dependencies (Imports) */}
        <div className="file-inspector__section">
          <div className="file-inspector__section-title">
            📦 Depends On / Imports ({outgoing.length})
          </div>
          {outgoing.length === 0 ? (
            <div className="text-muted text-sm">No internal imports detected.</div>
          ) : (
            <div className="dep-item-list">
              {outgoing.map((dep, idx) => (
                <div
                  key={idx}
                  className="dep-item"
                  onClick={() => onSelectFileByPath(dep.target_file)}
                >
                  <span className="dep-type-tag">{dep.relationship_type}</span>
                  <span className="dep-target">{dep.target_file}</span>
                  {dep.symbol && <span className="dep-symbol">({dep.symbol})</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incoming Dependencies (Used By) */}
        <div className="file-inspector__section">
          <div className="file-inspector__section-title">
            🔗 Used By ({incoming.length})
          </div>
          {incoming.length === 0 ? (
            <div className="text-muted text-sm">No dependent project files found.</div>
          ) : (
            <div className="dep-item-list">
              {incoming.map((dep, idx) => (
                <div
                  key={idx}
                  className="dep-item"
                  onClick={() => onSelectFileByPath(dep.source_file)}
                >
                  <span className="dep-source">{dep.source_file}</span>
                  <span className="dep-type-tag">{dep.relationship_type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Code Content Preview */}
        {file.content && (
          <div className="file-inspector__section">
            <div className="file-inspector__section-title">
              📄 File Content Preview ({file.line_count} lines)
            </div>
            <pre className="file-content-preview">{file.content}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
