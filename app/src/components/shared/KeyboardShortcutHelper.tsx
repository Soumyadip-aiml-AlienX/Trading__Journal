'use client';

import { useState, useEffect } from 'react';

const shortcuts = [
  { keys: ['Ctrl', 'Shift', 'N'], label: 'Quick Trade Entry' },
  { keys: ['Ctrl', 'Shift', 'E'], label: 'Export PDF' },
  { keys: ['Ctrl', 'Shift', 'D'], label: 'Go to Dashboard' },
  { keys: ['Ctrl', 'Shift', 'T'], label: 'Go to Trade Log' },
  { keys: ['Ctrl', 'Shift', 'R'], label: 'Go to Reflection' },
  { keys: ['Ctrl', 'Shift', 'P'], label: 'Go to Performance' },
  { keys: ['?'], label: 'Toggle this shortcut panel' },
  { keys: ['Escape'], label: 'Close modals / panels' },
];

export default function KeyboardShortcutHelper() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      if (e.key === '?') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-sm"
      >
        <div className="glass-card p-5 space-y-4 border border-[var(--color-accent)]/30 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              ⌨️ Keyboard Shortcuts
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-[var(--color-text-muted)] hover:text-white p-1.5 hover:bg-[var(--color-surface-overlay)] rounded cursor-pointer transition-colors"
              aria-label="Close shortcuts panel"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.label}
                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-[var(--color-surface-overlay)] transition-colors"
              >
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {shortcut.label}
                </span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key) => (
                    <kbd
                      key={key}
                      className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-[var(--color-navy)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)]"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-[var(--color-text-muted)] text-center pt-1">
            Press <kbd className="px-1 py-0.5 text-[9px] font-mono bg-[var(--color-navy)] border border-[var(--color-border)] rounded">?</kbd> to toggle
          </p>
        </div>
      </div>
    </>
  );
}
