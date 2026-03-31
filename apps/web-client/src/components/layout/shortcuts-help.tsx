'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { X, Keyboard } from 'lucide-react';

const SHORTCUT_GROUPS = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Cmd', 'K'], description: 'Open command palette' },
      { keys: ['Cmd', '\\'], description: 'Toggle sidebar' },
      { keys: ['Cmd', 'Shift', 'W'], description: 'Switch organization' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ],
  },
  {
    title: 'Tasks',
    shortcuts: [
      { keys: ['C'], description: 'Create new task' },
      { keys: ['Enter'], description: 'Open selected task' },
      { keys: ['Escape'], description: 'Close panel / Cancel' },
      { keys: ['J'], description: 'Move down in list' },
      { keys: ['K'], description: 'Move up in list' },
      { keys: ['X'], description: 'Select / deselect task' },
    ],
  },
  {
    title: 'Messaging',
    shortcuts: [
      { keys: ['Enter'], description: 'Send message' },
      { keys: ['Shift', 'Enter'], description: 'New line in message' },
    ],
  },
] as const;

export function ShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-[var(--accent)]" />
            <h2 className="font-outfit text-lg font-bold text-[var(--foreground)]">Keyboard Shortcuts</h2>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-[var(--background-surface)]">
            <X size={16} className="text-[var(--muted-foreground)]" />
          </button>
        </div>

        <div className="space-y-5 max-h-[60vh] overflow-y-auto">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.shortcuts.map((shortcut) => (
                  <div key={shortcut.description} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-[var(--foreground)]">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key) => (
                        <kbd
                          key={key}
                          className="px-2 py-0.5 text-[10px] font-mono font-medium rounded bg-[var(--background-surface)] border border-[var(--border)] text-[var(--muted-foreground)]"
                        >
                          {key === 'Cmd' ? (navigator.platform.includes('Mac') ? '⌘' : 'Ctrl') : key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-[var(--muted-foreground)] text-center mt-4">
          Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--background-surface)] border border-[var(--border)] font-mono text-[10px]">?</kbd> to toggle this dialog
        </p>
      </div>
    </>
  );
}
