import { useState, useRef } from 'react';
import type { ProjectGraph, ProjectNode, FileCategory } from '../../types/project';

interface ProjectArchitectureGraphProps {
  graph: ProjectGraph;
  selectedFileId: string | null;
  highlightedFiles?: string[];
  highlightedEdges?: string[][];
  onSelectNode: (node: ProjectNode) => void;
}

function getNodeColor(category: FileCategory): { bg: string; border: string; text: string } {
  switch (category) {
    case 'entry_point':
      return { bg: '#eff6ff', border: '#2563eb', text: '#1e40af' };
    case 'frontend_root':
      return { bg: '#f5f3ff', border: '#7c3aed', text: '#5b21b6' };
    case 'api_route':
      return { bg: '#f0f9ff', border: '#0284c7', text: '#075985' };
    case 'service':
      return { bg: '#f0fdf4', border: '#16a34a', text: '#166534' };
    case 'component':
      return { bg: '#fdf2f8', border: '#db2777', text: '#9d174d' };
    case 'api_client':
      return { bg: '#fffbeb', border: '#d97706', text: '#92400e' };
    case 'model':
      return { bg: '#ecfeff', border: '#0891b2', text: '#155e75' };
    case 'config':
      return { bg: '#f8fafc', border: '#64748b', text: '#334155' };
    default:
      return { bg: '#ffffff', border: '#cbd5e1', text: '#0f172a' };
  }
}

export default function ProjectArchitectureGraph({
  graph,
  selectedFileId,
  highlightedFiles = [],
  highlightedEdges = [],
  onSelectNode,
}: ProjectArchitectureGraphProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<ProjectNode | null>(null);

  const nodeMap = new Map<string, ProjectNode>();
  graph.nodes.forEach((n) => nodeMap.set(n.id, n));

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName !== 'svg' && (e.target as HTMLElement).tagName !== 'rect') {
      // allow interaction with background
    }
    setIsPanning(true);
    startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPanRef.current.x,
        y: e.clientY - startPanRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.max(0.4, Math.min(2.5, prev * zoomFactor)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      className="project-graph-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      <div className="graph-toolbar">
        <button onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))} title="Zoom In">
          ➕
        </button>
        <button onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))} title="Zoom Out">
          ➖
        </button>
        <button onClick={resetView} title="Reset View">
          🎯 Reset
        </button>
        <span className="graph-zoom-indicator">{Math.round(zoom * 100)}%</span>
      </div>

      <svg
        className="project-graph-svg"
        width="100%"
        height="100%"
        viewBox="-50 -50 1100 800"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
          </marker>
          <marker
            id="arrow-highlighted"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb" />
          </marker>
          <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.08" />
          </filter>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Layer Background Badges */}
          <g className="graph-layer-guides" opacity="0.6">
            <text x="30" y="70" fill="#7c3aed" fontSize="12" fontWeight="600">FRONTEND LAYER</text>
            <line x1="30" y1="80" x2="970" y2="80" stroke="#e2e8f0" strokeDasharray="4 4" />

            <text x="30" y="210" fill="#d97706" fontSize="12" fontWeight="600">NETWORK & CLIENT LAYER</text>
            <line x1="30" y1="220" x2="970" y2="220" stroke="#e2e8f0" strokeDasharray="4 4" />

            <text x="30" y="350" fill="#0284c7" fontSize="12" fontWeight="600">BACKEND API & ENTRY LAYER</text>
            <line x1="30" y1="360" x2="970" y2="360" stroke="#e2e8f0" strokeDasharray="4 4" />

            <text x="30" y="490" fill="#16a34a" fontSize="12" fontWeight="600">SERVICES & BUSINESS LOGIC</text>
            <line x1="30" y1="500" x2="970" y2="500" stroke="#e2e8f0" strokeDasharray="4 4" />

            <text x="30" y="630" fill="#64748b" fontSize="12" fontWeight="600">CONFIG & INFRASTRUCTURE</text>
            <line x1="30" y1="640" x2="970" y2="640" stroke="#e2e8f0" strokeDasharray="4 4" />
          </g>

          {/* Render Graph Edges */}
          {graph.edges.map((edge, idx) => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return null;

            const isEdgeHighlighted = highlightedEdges.some(
              ([s, t]) => s === edge.source && t === edge.target
            );

            // Compute curved path
            const dx = tgt.x - src.x;
            const dy = tgt.y - src.y;
            const cx = src.x + dx / 2;
            const cy = src.y + dy / 2 + (Math.abs(dx) > 100 ? 25 : 0);

            return (
              <g key={`edge-${idx}`} className="graph-edge">
                <path
                  d={`M ${src.x} ${src.y} Q ${cx} ${cy} ${tgt.x} ${tgt.y}`}
                  fill="none"
                  stroke={isEdgeHighlighted ? '#2563eb' : edge.is_confirmed ? '#cbd5e1' : '#e2e8f0'}
                  strokeWidth={isEdgeHighlighted ? 2.5 : 1.5}
                  strokeDasharray={edge.is_confirmed ? 'none' : '4 3'}
                  markerEnd={isEdgeHighlighted ? 'url(#arrow-highlighted)' : 'url(#arrow)'}
                />
                {edge.label && (
                  <text
                    x={cx}
                    y={cy - 6}
                    fill={isEdgeHighlighted ? '#1d4ed8' : '#64748b'}
                    fontSize="9"
                    textAnchor="middle"
                    className="edge-label"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Render Graph Nodes */}
          {graph.nodes.map((node) => {
            const isSelected = selectedFileId === node.id || selectedFileId === node.file_path;
            const isHighlighted = highlightedFiles.includes(node.file_path);
            const colors = getNodeColor(node.category);

            const width = 140;
            const height = 52;
            const rx = node.x - width / 2;
            const ry = node.y - height / 2;

            return (
              <g
                key={node.id}
                className={`graph-node ${isSelected ? 'graph-node--selected' : ''} ${
                  isHighlighted ? 'graph-node--highlighted' : ''
                }`}
                transform={`translate(${rx}, ${ry})`}
                onClick={() => onSelectNode(node)}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  width={width}
                  height={height}
                  rx="8"
                  fill={isHighlighted ? '#dbeafe' : colors.bg}
                  stroke={isHighlighted || isSelected ? '#2563eb' : colors.border}
                  strokeWidth={isSelected || isHighlighted ? 2.5 : 1.5}
                  filter="url(#shadow)"
                />
                {/* Category Pill */}
                <rect
                  x="8"
                  y="8"
                  width="12"
                  height="12"
                  rx="3"
                  fill={colors.border}
                />
                <text
                  x="26"
                  y="18"
                  fontSize="10"
                  fontWeight="600"
                  fill={colors.text}
                  className="node-category-tag"
                >
                  {node.category.replace('_', ' ').toUpperCase()}
                </text>

                {/* Node Label (Filename) */}
                <text
                  x="10"
                  y="38"
                  fontSize="12"
                  fontWeight="700"
                  fill="#0f172a"
                  className="node-title"
                >
                  {node.label.length > 18 ? node.label.slice(0, 16) + '…' : node.label}
                </text>

                {node.is_entry_point && (
                  <circle cx={width - 12} cy="14" r="4" fill="#2563eb" />
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {hoveredNode && (
        <div className="graph-tooltip">
          <strong>{hoveredNode.label}</strong> ({hoveredNode.category})
          <div className="text-muted">{hoveredNode.file_path}</div>
        </div>
      )}
    </div>
  );
}
