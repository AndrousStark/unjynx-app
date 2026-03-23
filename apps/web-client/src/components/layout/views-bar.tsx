'use client';

import { useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { useUiStore, type ViewType } from '@/lib/stores/ui-store';
import { useViewsStore } from '@/lib/store/views-store';
import {
  List,
  LayoutGrid,
  Calendar,
  GanttChart,
  Table2,
  SlidersHorizontal,
  ArrowUpDown,
  Plus,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

// ─── View Tab Data ──────────────────────────────────────────────

interface ViewTab {
  readonly id: ViewType;
  readonly label: string;
  readonly icon: React.ElementType;
}

const VIEW_TABS: readonly ViewTab[] = [
  { id: 'list', label: 'List', icon: List },
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'timeline', label: 'Timeline', icon: GanttChart },
  { id: 'table', label: 'Table', icon: Table2 },
];

// ─── Sort Options ───────────────────────────────────────────────

const SORT_OPTIONS: readonly { readonly field: string; readonly label: string }[] = [
  { field: 'due_date', label: 'Due Date' },
  { field: 'priority', label: 'Priority' },
  { field: 'created_at', label: 'Date Created' },
  { field: 'title', label: 'Title' },
  { field: 'updated_at', label: 'Last Updated' },
];

// ─── Sort Dropdown ──────────────────────────────────────────────

function SortDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sort = useViewsStore((s) => s.sort);
  const setSort = useViewsStore((s) => s.setSort);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
          'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]',
          'hover:bg-[var(--background-surface)] transition-colors focus-ring',
        )}
        aria-label="Sort tasks"
      >
        <ArrowUpDown size={14} />
        <span className="hidden sm:inline">Sort</span>
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-1 w-48 rounded-lg overflow-hidden',
            'bg-[var(--popover)] border border-[var(--border)]',
            'unjynx-shadow-sm animate-scale-in origin-top-right z-50',
          )}
        >
          <div className="py-1">
            {SORT_OPTIONS.map((opt) => {
              const isSelected = sort.field === opt.field;
              return (
                <button
                  key={opt.field}
                  onClick={() => {
                    // Toggle direction if same field, otherwise set new field asc
                    const direction =
                      isSelected && sort.direction === 'asc' ? 'desc' : 'asc';
                    setSort(opt.field as typeof sort.field, direction);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-2 text-sm',
                    'hover:bg-[var(--background-surface)] transition-colors',
                    isSelected
                      ? 'text-[var(--foreground)] font-medium'
                      : 'text-[var(--foreground-secondary)]',
                  )}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <span className="text-[var(--gold)] text-xs">
                      {sort.direction === 'asc' ? 'A-Z' : 'Z-A'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Filter Count Badge ─────────────────────────────────────────

function FilterButton() {
  const filters = useViewsStore((s) => s.filters);
  const toggleFilterPanel = useViewsStore((s) => s.toggleFilterPanel);
  const isFilterOpen = useViewsStore((s) => s.isFilterOpen);

  // Count active filters
  const activeCount = Object.values(filters).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );

  return (
    <button
      onClick={toggleFilterPanel}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
        'transition-colors focus-ring',
        isFilterOpen || activeCount > 0
          ? 'text-[var(--gold)] bg-[var(--gold)]/10'
          : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-surface)]',
      )}
      aria-label={`Filters${activeCount > 0 ? ` (${activeCount} active)` : ''}`}
    >
      <SlidersHorizontal size={14} />
      <span className="hidden sm:inline">Filters</span>
      {activeCount > 0 && (
        <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[var(--gold)] text-[var(--background)] text-[10px] font-bold">
          {activeCount}
        </span>
      )}
    </button>
  );
}

// ─── Main Views Bar ─────────────────────────────────────────────

export function ViewsBar() {
  const activeView = useUiStore((s) => s.activeView);
  const setActiveView = useUiStore((s) => s.setActiveView);

  return (
    <div
      className={cn(
        'flex items-center justify-between h-12 px-4 lg:px-6',
        'border-b border-[var(--border)]',
        'bg-[var(--background)]',
      )}
    >
      {/* View tabs */}
      <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
        {VIEW_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
                'transition-all duration-150 whitespace-nowrap focus-ring',
                isActive
                  ? 'text-[var(--foreground)]'
                  : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-surface)]',
              )}
            >
              <Icon size={15} className={isActive ? 'text-[var(--gold)]' : ''} />
              <span>{tab.label}</span>

              {/* Gold underline indicator */}
              {isActive && (
                <span
                  className={cn(
                    'absolute -bottom-[7px] left-2 right-2 h-[2px] rounded-full',
                    'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-rich)]',
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Right actions: Filters, Sort, Add View */}
      <div className="flex items-center gap-1">
        <FilterButton />
        <SortDropdown />

        {/* Add custom view (future) */}
        <button
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
            'text-[var(--muted-foreground)] hover:text-[var(--foreground-secondary)]',
            'hover:bg-[var(--background-surface)] transition-colors focus-ring',
          )}
          aria-label="Add custom view"
          title="Add custom view"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
