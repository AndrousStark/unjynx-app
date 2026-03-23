'use client';

import { useState, useCallback } from 'react';
import { useTasks, useCreateTask } from '@/lib/hooks/use-tasks';
import { useViewsStore, type SortField, type SortDirection } from '@/lib/store/views-store';
import { useDetailPanelStore } from '@/lib/store/detail-panel-store';
import { cn } from '@/lib/utils/cn';
import { TaskRow } from '@/components/tasks/task-row';
import { TaskListShimmer } from '@/components/ui/shimmer';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Filter,
  ArrowUpDown,
  Layers,
  ChevronDown,
  X,
  CheckSquare,
  Search,
} from 'lucide-react';
import type { Task } from '@/lib/api/tasks';

// ─── Sort Dropdown ──────────────────────────────────────────────

const SORT_OPTIONS: readonly { field: SortField; label: string }[] = [
  { field: 'due_date', label: 'Due Date' },
  { field: 'priority', label: 'Priority' },
  { field: 'created_at', label: 'Created' },
  { field: 'title', label: 'Title' },
  { field: 'updated_at', label: 'Updated' },
];

function SortDropdown() {
  const [open, setOpen] = useState(false);
  const sort = useViewsStore((s) => s.sort);
  const setSort = useViewsStore((s) => s.setSort);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-surface)] transition-colors"
      >
        <ArrowUpDown size={14} />
        <span className="hidden sm:inline">{SORT_OPTIONS.find((o) => o.field === sort.field)?.label ?? 'Sort'}</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 z-20 w-44 bg-[var(--popover)] border border-[var(--border)] rounded-lg shadow-lg py-1 animate-scale-in">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.field}
              onClick={() => {
                const dir: SortDirection = sort.field === opt.field && sort.direction === 'asc' ? 'desc' : 'asc';
                setSort(opt.field, dir);
                setOpen(false);
              }}
              className={cn(
                'flex items-center justify-between w-full px-3 py-2 text-xs hover:bg-[var(--background-surface)] transition-colors',
                sort.field === opt.field && 'text-unjynx-violet',
              )}
            >
              {opt.label}
              {sort.field === opt.field && (
                <span className="text-[10px]">{sort.direction === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Filter Bar ─────────────────────────────────────────────────

const PRIORITIES: readonly Task['priority'][] = ['urgent', 'high', 'medium', 'low', 'none'];
const STATUSES: readonly Task['status'][] = ['todo', 'in_progress', 'done', 'cancelled'];

function FilterBar() {
  const filters = useViewsStore((s) => s.filters);
  const setFilter = useViewsStore((s) => s.setFilter);
  const clearFilters = useViewsStore((s) => s.clearFilters);
  const isFilterOpen = useViewsStore((s) => s.isFilterOpen);

  if (!isFilterOpen) return null;

  const hasActiveFilters =
    filters.priority.length > 0 || filters.status.length > 0;

  return (
    <div className="flex items-center gap-3 flex-wrap p-3 rounded-lg bg-[var(--background-surface)] border border-[var(--border)] animate-slide-up">
      {/* Priority filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[var(--muted-foreground)]">Priority:</span>
        {PRIORITIES.map((p) => (
          <button
            key={p}
            onClick={() => {
              const current = [...filters.priority];
              const idx = current.indexOf(p);
              if (idx >= 0) {
                current.splice(idx, 1);
              } else {
                current.push(p);
              }
              setFilter('priority', current);
            }}
            className={cn(
              'px-2 py-0.5 rounded text-[10px] font-medium capitalize border transition-colors',
              filters.priority.includes(p)
                ? 'border-unjynx-violet bg-unjynx-violet/20 text-unjynx-violet'
                : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[var(--muted-foreground)]">Status:</span>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              const current = [...filters.status];
              const idx = current.indexOf(s);
              if (idx >= 0) {
                current.splice(idx, 1);
              } else {
                current.push(s);
              }
              setFilter('status', current);
            }}
            className={cn(
              'px-2 py-0.5 rounded text-[10px] font-medium capitalize border transition-colors',
              filters.status.includes(s)
                ? 'border-unjynx-violet bg-unjynx-violet/20 text-unjynx-violet'
                : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            )}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 text-xs text-unjynx-rose hover:text-unjynx-rose/80 transition-colors"
        >
          <X size={12} />
          Clear
        </button>
      )}
    </div>
  );
}

// ─── Quick Create Row ───────────────────────────────────────────

function QuickCreateRow() {
  const [value, setValue] = useState('');
  const createMutation = useCreateTask();

  function handleCreate() {
    const trimmed = value.trim();
    if (!trimmed) return;
    createMutation.mutate({ title: trimmed }, {
      onSuccess: () => setValue(''),
    });
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[var(--border)] hover:border-unjynx-violet/40 transition-colors">
      <Plus size={16} className="text-[var(--muted-foreground)] flex-shrink-0" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleCreate();
        }}
        placeholder="Add a task... (press Enter)"
        className="flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
      />
      {value.trim() && (
        <Button
          variant="default"
          size="sm"
          onClick={handleCreate}
          isLoading={createMutation.isPending}
        >
          Add
        </Button>
      )}
    </div>
  );
}

// ─── Tasks Page ─────────────────────────────────────────────────

export default function TasksPage() {
  const { data: tasks, isLoading } = useTasks();
  const toggleFilterPanel = useViewsStore((s) => s.toggleFilterPanel);
  const isFilterOpen = useViewsStore((s) => s.isFilterOpen);
  const filters = useViewsStore((s) => s.filters);
  const openPanel = useDetailPanelStore((s) => s.openPanel);

  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Filter & sort tasks client-side
  const filteredTasks = (tasks ?? []).filter((task) => {
    if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) return false;
    if (filters.status.length > 0 && !filters.status.includes(task.status)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!task.title.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleSelect = useCallback((taskId: string, shiftKey: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (shiftKey) {
        if (next.has(taskId)) {
          next.delete(taskId);
        } else {
          next.add(taskId);
        }
      } else {
        if (next.has(taskId) && next.size === 1) {
          next.clear();
          // Open detail panel instead
          openPanel('task', taskId);
        } else {
          next.clear();
          next.add(taskId);
        }
      }
      return next;
    });
  }, [openPanel]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-outfit text-xl font-bold text-[var(--foreground)]">Tasks</h1>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <span className="text-xs text-unjynx-violet font-medium">
              {selectedIds.size} selected
            </span>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background-surface)]">
          <Search size={14} className="text-[var(--muted-foreground)]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="flex-1 bg-transparent text-sm outline-none text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
          />
        </div>

        <button
          onClick={toggleFilterPanel}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors',
            isFilterOpen
              ? 'border-unjynx-violet bg-unjynx-violet/10 text-unjynx-violet'
              : 'border-[var(--border)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-surface)]',
          )}
        >
          <Filter size={14} />
          <span className="hidden sm:inline">Filter</span>
        </button>

        <SortDropdown />

        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-surface)] transition-colors">
          <Layers size={14} />
          <span className="hidden sm:inline">Group</span>
        </button>
      </div>

      {/* Filter Bar */}
      <FilterBar />

      {/* Quick Create */}
      <QuickCreateRow />

      {/* Task List */}
      {isLoading ? (
        <TaskListShimmer />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={32} className="text-unjynx-gold" />}
          title="Break the curse"
          description="No tasks match your filters. Create your first task above or adjust your filters."
        />
      ) : (
        <div className="space-y-0.5">
          {filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              selected={selectedIds.has(task.id)}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {/* Task count */}
      {filteredTasks.length > 0 && (
        <p className="text-xs text-[var(--muted-foreground)] text-center pt-2">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
