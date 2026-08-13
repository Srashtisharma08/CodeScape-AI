import type { ParseInfo } from '../types';

interface ParseInfoPanelProps {
  parseInfo: ParseInfo | null;
}

export default function ParseInfoPanel({ parseInfo }: ParseInfoPanelProps) {
  if (!parseInfo) {
    return (
      <div className="parse-info__empty">
        <div className="ast-tree__empty-icon">📊</div>
        <div className="ast-tree__empty-text">No parse information</div>
        <div className="ast-tree__empty-hint">
          Parse code to view execution metadata and parsing metrics
        </div>
      </div>
    );
  }

  const language = parseInfo.language || 'Unknown';
  const nodeCount = parseInfo.node_count ?? parseInfo.nodeCount ?? 0;
  const parseTimeMs = parseInfo.parse_time_ms ?? parseInfo.parseTimeMs ?? 0;
  const hasErrors = parseInfo.has_errors ?? parseInfo.hasErrors ?? false;

  return (
    <div className="parse-info fade-in">
      <div className="parse-info__grid">
        <div className="parse-info__card">
          <div className="parse-info__card-label">Language</div>
          <div className="parse-info__card-value parse-info__card-value--language">
            {language}
          </div>
        </div>

        <div className="parse-info__card">
          <div className="parse-info__card-label">Node Count</div>
          <div className="parse-info__card-value">
            {nodeCount.toLocaleString()}
          </div>
        </div>

        <div className="parse-info__card">
          <div className="parse-info__card-label">Parse Time</div>
          <div className="parse-info__card-value">
            {parseTimeMs < 1
              ? `${(parseTimeMs * 1000).toFixed(0)}µs`
              : `${parseTimeMs.toFixed(2)}ms`}
          </div>
        </div>

        <div className="parse-info__card">
          <div className="parse-info__card-label">Status</div>
          <div
            className={`parse-info__card-value ${
              hasErrors
                ? 'parse-info__card-value--error'
                : 'parse-info__card-value--success'
            }`}
          >
            {hasErrors ? '⚠ Errors' : '✓ Clean'}
          </div>
        </div>
      </div>
    </div>
  );
}
