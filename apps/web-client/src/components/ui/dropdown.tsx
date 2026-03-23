// ---------------------------------------------------------------------------
// Dropdown - Accessible dropdown menu with UNJYNX theme
// ---------------------------------------------------------------------------

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface DropdownContextValue {
  readonly isOpen: boolean;
  readonly close: () => void;
  readonly toggle: () => void;
  readonly triggerId: string;
  readonly menuId: string;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdown(): DropdownContextValue {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error('Dropdown compound components must be used within <Dropdown>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

interface DropdownProps {
  readonly children: ReactNode;
  readonly className?: string;
}

function Dropdown({ children, className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(Math.random().toString(36).slice(2, 9));

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <DropdownContext.Provider
      value={{
        isOpen,
        close,
        toggle,
        triggerId: `dropdown-trigger-${idRef.current}`,
        menuId: `dropdown-menu-${idRef.current}`,
      }}
    >
      <div ref={containerRef} className={cn('relative inline-block', className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

interface DropdownTriggerProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly asChild?: boolean;
}

function DropdownTrigger({ children, className }: DropdownTriggerProps) {
  const { isOpen, toggle, triggerId, menuId } = useDropdown();

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <button
      id={triggerId}
      type="button"
      className={cn('cursor-pointer', className)}
      onClick={toggle}
      onKeyDown={handleKeyDown}
      aria-expanded={isOpen}
      aria-haspopup="menu"
      aria-controls={menuId}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

interface DropdownMenuProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly align?: 'start' | 'end' | 'center';
  readonly side?: 'bottom' | 'top';
}

function DropdownMenu({ children, className, align = 'start', side = 'bottom' }: DropdownMenuProps) {
  const { isOpen, menuId, triggerId } = useDropdown();

  if (!isOpen) return null;

  const alignClasses = {
    start: 'left-0',
    end: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  const sideClasses = {
    bottom: 'top-full mt-1',
    top: 'bottom-full mb-1',
  };

  return (
    <div
      id={menuId}
      role="menu"
      aria-labelledby={triggerId}
      className={cn(
        'absolute z-50 min-w-[180px] overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--popover)] p-1 text-[var(--popover-foreground)] shadow-unjynx-panel animate-scale-in',
        alignClasses[align],
        sideClasses[side],
        className,
      )}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

interface DropdownItemProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly icon?: ReactNode;
  readonly shortcut?: string;
  readonly disabled?: boolean;
  readonly destructive?: boolean;
  readonly onSelect?: () => void;
}

function DropdownItem({
  children,
  className,
  icon,
  shortcut,
  disabled,
  destructive,
  onSelect,
}: DropdownItemProps) {
  const { close } = useDropdown();

  const handleClick = () => {
    if (disabled) return;
    onSelect?.();
    close();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm font-dm-sans outline-none transition-colors',
        'hover:bg-[var(--background-elevated)] focus:bg-[var(--background-elevated)]',
        destructive && 'text-unjynx-rose hover:text-unjynx-rose focus:text-unjynx-rose',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-disabled={disabled}
    >
      {icon ? (
        <span className="flex h-4 w-4 items-center justify-center text-[var(--muted-foreground)]">
          {icon}
        </span>
      ) : null}
      <span className="flex-1">{children}</span>
      {shortcut ? (
        <span className="ml-auto text-xs text-[var(--muted-foreground)] tracking-widest">
          {shortcut}
        </span>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Separator
// ---------------------------------------------------------------------------

function DropdownSeparator({ className }: { readonly className?: string }) {
  return (
    <div
      role="separator"
      className={cn('-mx-1 my-1 h-px bg-[var(--border)]', className)}
    />
  );
}

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

function DropdownLabel({ children, className }: { readonly children: ReactNode; readonly className?: string }) {
  return (
    <div className={cn('px-2 py-1.5 text-xs font-semibold font-outfit text-[var(--muted-foreground)] uppercase tracking-wider', className)}>
      {children}
    </div>
  );
}

export {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
};
