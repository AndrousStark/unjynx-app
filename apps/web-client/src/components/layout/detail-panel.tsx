'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { useDetailPanelStore } from '@/lib/store/detail-panel-store';
import { useKeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcut';
import { X, MoreHorizontal } from 'lucide-react';

// ─── Detail Panel ───────────────────────────────────────────────
//
// 480px slide-in panel from the right edge. Smooth cubic-bezier
// transition, backdrop blur on mobile, sticky header, scrollable body.
// Accepts children prop for flexible content rendering.
//

interface DetailPanelProps {
  /** Content rendered inside the scrollable body. */
  readonly children?: React.ReactNode;
  /** Optional extra actions rendered in the header row. */
  readonly headerActions?: React.ReactNode;
}

export function DetailPanel({ children, headerActions }: DetailPanelProps) {
  const isOpen = useDetailPanelStore((s) => s.isOpen);
  const contentType = useDetailPanelStore((s) => s.contentType);
  const close = useDetailPanelStore((s) => s.closePanel);

  // Derive header title from content type
  const title =
    contentType === 'task'
      ? 'Task Details'
      : contentType === 'project'
        ? 'Project Details'
        : contentType === 'channel'
          ? 'Channel Details'
          : 'Details';

  // Close on Escape
  useKeyboardShortcut('Escape', close, { enabled: isOpen });

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (!isOpen) return;
    const isMobile = window.innerWidth < 1024;
    if (!isMobile) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* ── Mobile backdrop with blur ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in lg:hidden"
          onClick={close}
          role="presentation"
        />
      )}

      {/* ── Slide-in panel ── */}
      <aside
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50',
          'w-full sm:w-[480px]',
          'flex flex-col',
          'bg-[var(--background)] border-l border-[var(--border)]',
          'shadow-[-8px_0_40px_rgba(0,0,0,0.25)]',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-label={title}
        aria-hidden={!isOpen}
      >
        {/* ── Sticky header ── */}
        <div
          className={cn(
            'flex items-center justify-between gap-3 px-5 py-3.5 flex-shrink-0',
            'border-b border-[var(--border)]',
            'bg-[var(--background)]/95 backdrop-blur-sm',
          )}
        >
          <h2 className="font-outfit font-semibold text-base text-[var(--foreground)] truncate">
            {title}
          </h2>

          <div className="flex items-center gap-1">
            {headerActions}
            <button
              onClick={close}
              className={cn(
                'p-1.5 rounded-lg',
                'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]',
                'hover:bg-[var(--background-surface)]',
                'transition-colors focus-ring',
              )}
              aria-label="Close panel"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children ?? (
            <div className="flex flex-col items-center justify-center h-full px-6 py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--background-surface)] flex items-center justify-center mb-4">
                <MoreHorizontal size={24} className="text-[var(--muted-foreground)]" />
              </div>
              <p className="text-sm font-medium text-[var(--foreground-secondary)]">
                Select an item to view details
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1.5">
                Click on a task or project to see more info here
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
