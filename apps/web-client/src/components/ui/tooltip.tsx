// ---------------------------------------------------------------------------
// Tooltip - Lightweight accessible tooltip with UNJYNX theme
// ---------------------------------------------------------------------------

'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TooltipProps {
  readonly children: ReactNode;
  readonly content: ReactNode;
  readonly side?: 'top' | 'bottom' | 'left' | 'right';
  readonly align?: 'start' | 'center' | 'end';
  readonly delayMs?: number;
  readonly className?: string;
  readonly disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Position classes
// ---------------------------------------------------------------------------

const SIDE_CLASSES = {
  top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
  bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
  left: 'right-full mr-2 top-1/2 -translate-y-1/2',
  right: 'left-full ml-2 top-1/2 -translate-y-1/2',
} as const;

const ALIGN_OVERRIDES = {
  start: { horizontal: 'left-0 translate-x-0', vertical: 'top-0 translate-y-0' },
  center: { horizontal: '', vertical: '' }, // default centering
  end: { horizontal: 'right-0 left-auto translate-x-0', vertical: 'bottom-0 top-auto translate-y-0' },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function Tooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  delayMs = 300,
  className,
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const triggerRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => setIsVisible(true), delayMs);
  }, [delayMs, disabled]);

  const hide = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  // Determine position classes
  const isHorizontal = side === 'left' || side === 'right';
  const alignClass =
    align !== 'center'
      ? (isHorizontal ? ALIGN_OVERRIDES[align].vertical : ALIGN_OVERRIDES[align].horizontal)
      : '';

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      {isVisible && content ? (
        <div
          role="tooltip"
          className={cn(
            'absolute z-[100] max-w-xs pointer-events-none',
            'rounded-md border border-[var(--border)] bg-[var(--popover)] px-3 py-1.5',
            'text-xs font-dm-sans text-[var(--popover-foreground)] shadow-unjynx-panel',
            'animate-fade-in',
            SIDE_CLASSES[side],
            alignClass,
            className,
          )}
        >
          {content}
        </div>
      ) : null}
    </div>
  );
}

export { Tooltip };
