import { useState, useCallback } from 'react';
import type { ASTNode } from '../types';

/**
 * Categorize a tree-sitter node type for color coding in light theme.
 */
function getNodeCategory(type?: string): string {
  if (!type) return 'default';
  const t = type.toLowerCase();

  // Modules / Programs
  if (['module', 'program', 'compilation_unit', 'source_file'].includes(t)) return 'module';

  // Functions & Methods
  if (t.includes('function') || t.includes('method') || t.includes('lambda') || t.includes('arrow'))
    return 'function';

  // Classes & Interfaces
  if (t.includes('class') || t.includes('interface') || t.includes('enum') || t.includes('struct'))
    return 'class';

  // Variables & Declarations
  if (
    t.includes('variable') ||
    t.includes('assignment') ||
    t.includes('declarator') ||
    (t.includes('declaration') && !t.includes('function') && !t.includes('class') && !t.includes('method'))
  )
    return 'variable';

  // Loops
  if (t.includes('for') || t.includes('while') || t.includes('loop') || t.includes('do_statement'))
    return 'loop';

  // Conditionals
  if (t.includes('if') || t.includes('else') || t.includes('switch') || t.includes('case') || t.includes('ternary'))
    return 'conditional';

  // Imports
  if (t.includes('import') || t.includes('require') || t.includes('package') || t.includes('include'))
    return 'import';

  // Return & Control flow
  if (t.includes('return') || t.includes('yield') || t.includes('break') || t.includes('continue'))
    return 'return';

  // Literals & Primitive Values
  if (t.includes('literal') || t.includes('string') || t.includes('number') || t.includes('boolean') || t.includes('integer') || t.includes('float'))
    return 'literal';

  // Expressions & Calls
  if (t.includes('expression') || t.includes('call') || t.includes('argument'))
    return 'expression';

  return 'default';
}

interface ASTNodeViewProps {
  node: ASTNode;
  depth: number;
  defaultExpanded: boolean;
}

function ASTNodeView({ node, depth, defaultExpanded }: ASTNodeViewProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!node || typeof node !== 'object') {
    return null;
  }

  const rawChildren = Array.isArray(node.children) ? node.children : [];
  const children = rawChildren.filter((child): child is ASTNode => Boolean(child && typeof child === 'object'));
  const hasChildren = children.length > 0;

  const nodeType = node.type || 'Node';
  const category = getNodeCategory(nodeType);
  const nodeName = node.name || null;

  const startLine = node.start_line ?? node.startLine ?? 1;
  const endLine = node.end_line ?? node.endLine ?? startLine;

  const toggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasChildren) {
        setExpanded((prev) => !prev);
      }
    },
    [hasChildren]
  );

  return (
    <div className="ast-node">
      <div className="ast-node__row" onClick={toggle} title={`Type: ${nodeType} (Lines ${startLine}-${endLine})`}>
        <span
          className={`ast-node__toggle ${expanded ? 'ast-node__toggle--expanded' : ''} ${!hasChildren ? 'ast-node__toggle--leaf' : ''}`}
        >
          ▶
        </span>
        <span className={`ast-node__type ast-node__type--${category}`}>
          {nodeType}
        </span>
        {nodeName && <span className="ast-node__name">{nodeName}</span>}
        <span className="ast-node__line-info">
          L{startLine}{startLine !== endLine ? `–${endLine}` : ''}
        </span>
      </div>

      {hasChildren && expanded && (
        <div className="ast-node__children">
          {children.map((child, i) => (
            <ASTNodeView
              key={`${child.type || 'node'}-${child.start_line || child.startLine || 0}-${i}`}
              node={child}
              depth={depth + 1}
              defaultExpanded={depth + 1 < 3}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ASTTreeViewProps {
  ast: ASTNode | null;
}

export default function ASTTreeView({ ast }: ASTTreeViewProps) {
  if (!ast) {
    return (
      <div className="ast-tree__empty">
        <div className="ast-tree__empty-icon">🌳</div>
        <div className="ast-tree__empty-text">No AST to display</div>
        <div className="ast-tree__empty-hint">
          Paste your code and click <strong>▶ Parse</strong> to generate the visual AST
        </div>
      </div>
    );
  }

  return (
    <div className="ast-tree fade-in">
      <ASTNodeView node={ast} depth={0} defaultExpanded={true} />
    </div>
  );
}
