'use client';

import { useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutsHelpModalProps {
  onClose: () => void;
  shortcuts?: Shortcut[];
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { keys: ['⌘', 'N'], description: 'New pitch' },
  { keys: ['⌘', '/'], description: 'Focus search' },
  { keys: ['⌘', 'F'], description: 'Toggle filters' },
  { keys: ['⌘', '?'], description: 'Show this help' },
  { keys: ['Esc'],    description: 'Close modal / clear focus' },
];

export default function ShortcutsHelpModal({ onClose, shortcuts = DEFAULT_SHORTCUTS }: ShortcutsHelpModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(26,26,24,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-xl"
        style={{ backgroundColor: 'var(--ice)', border: '1px solid var(--cream)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--cream)' }}
        >
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--stone)', fontFamily: 'Azeret Mono, monospace' }}
            >
              Keyboard
            </p>
            <h2
              className="text-lg font-bold"
              style={{ color: 'var(--ink)', fontFamily: 'Epilogue, sans-serif' }}
            >
              Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="pm-btn p-2"
            aria-label="Close shortcuts help"
          >
            <Icon name="XMarkIcon" size={18} variant="outline" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="px-5 py-4 space-y-2">
          {shortcuts.map((shortcut, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-4 py-2"
              style={{
                borderBottom: idx < shortcuts.length - 1 ? '1px solid var(--cream)' : 'none',
              }}
            >
              <span
                className="text-sm"
                style={{ color: 'var(--ink)', fontFamily: 'Epilogue, sans-serif' }}
              >
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {shortcut.keys.map((key, ki) => (
                  <span key={ki} className="flex items-center gap-1">
                    <kbd
                      className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold"
                      style={{
                        backgroundColor: 'var(--cream)',
                        border: '1px solid var(--cream)',
                        color: 'var(--ink)',
                        fontFamily: 'Azeret Mono, monospace',
                        boxShadow: '0 1px 0 var(--cream)',
                      }}
                    >
                      {key}
                    </kbd>
                    {ki < shortcut.keys.length - 1 && (
                      <span className="text-xs" style={{ color: 'var(--stone)' }}>
                        +
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div
          className="px-5 py-3 rounded-b-2xl border-t"
          style={{ backgroundColor: 'var(--cream)', borderColor: 'var(--cream)' }}
        >
          <p
            className="text-xs text-center"
            style={{ color: 'var(--stone)', fontFamily: 'Epilogue, sans-serif' }}
          >
            Press{' '}
            <kbd
              className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-semibold"
              style={{
                backgroundColor: 'var(--ice)',
                border: '1px solid var(--cream)',
                color: 'var(--ink)',
                fontFamily: 'Azeret Mono, monospace',
              }}
            >
              Esc
            </kbd>{' '}
            to close
          </p>
        </div>
      </div>
    </div>
  );
}