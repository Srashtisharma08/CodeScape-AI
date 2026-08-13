import { useEffect, useRef } from 'react';
import type { ConsoleMessage } from '../types';

interface StatusConsoleProps {
  messages: ConsoleMessage[];
  onClear: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getLevelLabel(level: ConsoleMessage['level']): string {
  switch (level) {
    case 'info':
      return 'INFO';
    case 'success':
      return 'DONE';
    case 'error':
      return 'ERR';
    case 'warning':
      return 'WARN';
  }
}

export default function StatusConsole({ messages, onClear }: StatusConsoleProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="status-console">
      <div className="status-console__header">
        <div className="status-console__title">
          <span className="status-console__dot" />
          Console
        </div>
        {messages.length > 0 && (
          <button className="status-console__clear" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
      <div className="status-console__messages">
        {messages.length === 0 && (
          <div className="status-console__message">
            <span className="status-console__timestamp">{formatTime(new Date())}</span>
            <span className="status-console__level status-console__level--info">INFO</span>
            <span className="status-console__text">Ready. Paste code and click Parse to begin.</span>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="status-console__message">
            <span className="status-console__timestamp">{formatTime(msg.timestamp)}</span>
            <span className={`status-console__level status-console__level--${msg.level}`}>
              {getLevelLabel(msg.level)}
            </span>
            <span className="status-console__text">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
