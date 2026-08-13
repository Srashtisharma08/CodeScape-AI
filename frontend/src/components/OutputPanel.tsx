interface OutputPanelProps {
  output: string[];
}

export default function OutputPanel({ output }: OutputPanelProps) {
  if (!output || output.length === 0) {
    return null;
  }

  return (
    <div className="output-panel fade-in">
      <div className="output-panel__header">
        <span className="output-panel__title">STDOUT OUTPUT</span>
      </div>
      <div className="output-panel__content">
        {output.map((line, idx) => (
          <div key={idx} className="output-panel__line">
            <span className="output-panel__prompt">&gt;</span> {line}
          </div>
        ))}
      </div>
    </div>
  );
}
