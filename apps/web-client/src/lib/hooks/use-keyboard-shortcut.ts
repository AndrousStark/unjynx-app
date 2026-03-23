'use client';

import { useEffect, useCallback } from 'react';

/**
 * Hook for registering global keyboard shortcuts.
 * Automatically handles Meta (Mac) vs Ctrl (Win/Linux).
 */
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: {
    readonly meta?: boolean;
    readonly shift?: boolean;
    readonly alt?: boolean;
    readonly enabled?: boolean;
  } = {},
): void {
  const { meta = false, shift = false, alt = false, enabled = true } = options;

  const handler = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Skip if focus is in an input/textarea/contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Cmd+K even in inputs (for command palette)
        if (key !== 'k' || !meta) return;
      }

      const metaMatch = meta ? (event.metaKey || event.ctrlKey) : true;
      const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
      const altMatch = alt ? event.altKey : !event.altKey;

      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        metaMatch &&
        shiftMatch &&
        altMatch
      ) {
        event.preventDefault();
        callback();
      }
    },
    [key, callback, meta, shift, alt, enabled],
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler, enabled]);
}
