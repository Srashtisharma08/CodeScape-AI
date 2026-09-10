import { useState, useMemo } from 'react';
import type { ProjectFile, FileCategory } from '../../types/project';

interface ProjectFileTreeProps {
  files: ProjectFile[];
  selectedFileId: string | null;
  onSelectFile: (file: ProjectFile) => void;
  highlightedFiles?: string[];
}

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  file?: ProjectFile;
  children: Record<string, TreeNode>;
}

function getFileIcon(ext: string, category: FileCategory): string {
  switch (ext) {
    case '.py':
      return '🐍';
    case '.tsx':
    case '.jsx':
      return '⚛️';
    case '.ts':
    case '.js':
      return '📜';
    case '.json':
      return '📋';
    case '.css':
      return '🎨';
    case '.html':
      return '🌐';
    case '.md':
    case '.txt':
      return '📝';
    default:
      return category === 'entry_point' ? '🚀' : '📄';
  }
}

function getCategoryColor(category: FileCategory): string {
  switch (category) {
    case 'entry_point':
      return '#2563eb';
    case 'frontend_root':
      return '#7c3aed';
    case 'api_route':
      return '#0284c7';
    case 'service':
      return '#16a34a';
    case 'component':
      return '#db2777';
    case 'api_client':
      return '#d97706';
    case 'model':
      return '#0891b2';
    case 'config':
      return '#64748b';
    default:
      return '#94a3b8';
  }
}

export default function ProjectFileTree({
  files,
  selectedFileId,
  onSelectFile,
  highlightedFiles = [],
}: ProjectFileTreeProps) {
  const [collapsedDirs, setCollapsedDirs] = useState<Record<string, boolean>>({});

  // Build tree hierarchy
  const rootNode = useMemo(() => {
    const root: TreeNode = { name: 'root', path: '', isDir: true, children: {} };

    files.forEach((f) => {
      const parts = f.path.split('/');
      let current = root;

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        const subPath = parts.slice(0, index + 1).join('/');

        if (isLast) {
          current.children[part] = {
            name: part,
            path: subPath,
            isDir: false,
            file: f,
            children: {},
          };
        } else {
          if (!current.children[part]) {
            current.children[part] = {
              name: part,
              path: subPath,
              isDir: true,
              children: {},
            };
          }
          current = current.children[part];
        }
      });
    });

    return root;
  }, [files]);

  const toggleCollapse = (dirPath: string) => {
    setCollapsedDirs((prev) => ({ ...prev, [dirPath]: !prev[dirPath] }));
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isCollapsed = Boolean(collapsedDirs[node.path]);

    if (node.isDir) {
      const childrenKeys = Object.keys(node.children).sort((a, b) => {
        const nodeA = node.children[a];
        const nodeB = node.children[b];
        if (nodeA.isDir && !nodeB.isDir) return -1;
        if (!nodeA.isDir && nodeB.isDir) return 1;
        return a.localeCompare(b);
      });

      return (
        <div key={node.path || 'root'} className="file-tree-dir">
          {node.path !== '' && (
            <div
              className="file-tree-dir-header"
              style={{ paddingLeft: `${depth * 14 + 10}px` }}
              onClick={() => toggleCollapse(node.path)}
            >
              <span className="file-tree-arrow">{isCollapsed ? '▶' : '▼'}</span>
              <span className="file-tree-icon">📁</span>
              <span className="file-tree-name">{node.name}</span>
            </div>
          )}

          {!isCollapsed && (
            <div className="file-tree-children">
              {childrenKeys.map((key) => renderNode(node.children[key], node.path === '' ? depth : depth + 1))}
            </div>
          )}
        </div>
      );
    }

    const f = node.file!;
    const isSelected = selectedFileId === f.id || selectedFileId === f.path;
    const isHighlighted = highlightedFiles.includes(f.path);

    return (
      <div
        key={f.path}
        className={`file-tree-item ${isSelected ? 'file-tree-item--selected' : ''} ${
          isHighlighted ? 'file-tree-item--highlighted' : ''
        }`}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        onClick={() => onSelectFile(f)}
        title={f.summary}
      >
        <span
          className="file-tree-dot"
          style={{ backgroundColor: getCategoryColor(f.category) }}
        />
        <span className="file-tree-icon">{getFileIcon(f.extension, f.category)}</span>
        <span className="file-tree-label">{f.name}</span>
        {f.is_entry_point && <span className="entry-point-badge">ENTRY</span>}
      </div>
    );
  };

  return (
    <div className="project-file-tree">
      <div className="project-file-tree__header">
        <span className="project-file-tree__title">📁 Project Structure</span>
        <span className="project-file-tree__count">{files.length} files</span>
      </div>
      <div className="project-file-tree__content">
        {files.length === 0 ? (
          <div className="file-tree-empty">No files loaded</div>
        ) : (
          renderNode(rootNode)
        )}
      </div>
    </div>
  );
}
