'use client';

interface KeyboardHelpProps {
  onClose: () => void;
}

const shortcuts = [
  { keys: ['→', '↓', 'j', 'Space'], action: 'Next project' },
  { keys: ['←', '↑', 'k'], action: 'Previous project' },
  { keys: ['g'], action: 'Open on GitHub' },
  { keys: ['h'], action: 'Open HN thread' },
  { keys: ['?'], action: 'Toggle this help' },
  { keys: ['Esc'], action: 'Close help' },
];

export function KeyboardHelp({ onClose }: KeyboardHelpProps) {
  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-header">
          <span className="section-label">Keyboard Shortcuts</span>
          <button className="help-close" onClick={onClose}>✕</button>
        </div>
        <ul className="help-list">
          {shortcuts.map(({ keys, action }) => (
            <li key={action} className="help-item">
              <span className="help-keys">
                {keys.map((k) => (
                  <kbd key={k} className="kbd">{k}</kbd>
                ))}
              </span>
              <span className="help-action">{action}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
