'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTasks, useUpdateTask } from '@/lib/hooks/use-tasks';
import { useDetailPanelStore } from '@/lib/store/detail-panel-store';
import { cn } from '@/lib/utils/cn';
import { priorityColor, priorityLabel } from '@/lib/utils/priority';
import { formatDueDate, formatRelative } from '@/lib/utils/format';
import { TaskListShimmer } from '@/components/ui/shimmer';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ArrowUp,
  ArrowDown,
  Filter,
  Table2,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import type { Task } from '@/lib/api/tasks';

// ─── Column Definitions ─────────────────────────────────────────

interface ColumnDef {
  readonly key: string;
  readonly label: string;
  readonly width: string;
  readonly sortable: boolean;
  readonly filterable: boolean;
}

const COLUMNS: readonly ColumnDef[] = [
  { key: 'select', label: '', width: 'w-10', sortable: false, filterable: false },
  { key: 'title', label: 'Title', width: 'min-w-[240px] flex-1', sortable: true, filterable: false },
  { key: 'status', label: 'Status', width: 'w-28', sortable: true, filterable: true },
  { key: 'priority', label: 'Priority', width: 'w-24', sortable: true, filterable: true },
  { key: 'dueDate', label: 'Due Date', width: 'w-28', sortable: true, filterable: false },
  { key: 'project', label: 'Project', width: 'w-32', sortable: true, filterable: false },
  { key: 'assignee', label: 'Assignee', width: 'w-28', sortable: false, filterable: false },
  { key: 'labels', label: 'Tags', width: 'w-28', sortable: false, filterable: false },
  { key: 'createdAt', label: 'Created', width: 'w-28', sortable: true, filterable: false },
];

// ─── Status Badge ───────────────────────────────────────────────

const STATUS_STYLES: Record<Task['status'], { bg: string; text: string; label: string }> = {
  todo: { bg: 'bg-[var(--muted)]', text: 'text-[var(--muted-foreground)]', label: 'To Do' },
  pending: { bg: 'bg-[var(--muted)]', text: 'text-[var(--muted-foreground)]', label: 'Pending' },
  in_progress: { bg: 'bg-unjynx-violet/15', text: 'text-unjynx-violet', label: 'In Progress' },
  done: { bg: 'bg-unjynx-emerald/15', text: 'text-unjynx-emerald', label: 'Done' },
  completed: { bg: 'bg-unjynx-emerald/15', text: 'text-unjynx-emerald', label: 'Completed' },
  cancelled: { bg: 'bg-unjynx-rose/15', text: 'text-unjynx-rose', label: 'Cancelled' },
};

function StatusBadge({ status }: { readonly status: Task['status'] }) {
  const style = STATUS_STYLES[status];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium', style.bg, style.text)}>
      {style.label}
    </span>
  );
}

// ─── Inline Cell Editors ────────────────────────────────────────

function InlineStatusEditor({
  task,
}: {
  readonly task: Task;
}) {
  const [open, setOpen] = useState(false);
  const updateMutation = useUpdateTask();

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}>
        <StatusBadge status={task.status} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-20 w-32 bg-[var(--popover)] border border-[var(--border)] rounded-lg shadow-lg py-1 animate-scale-in">
          {(Object.keys(STATUS_STYLES) as Task['status'][]).map((s) => (
            <button
              key={s}
              onClick={() => {
                updateMutation.mutate({ id: task.id, payload: { status: s } });
                setOpen(false);
              }}
              className={cn(
                'flex items-center gap-2 w-full px-2 py-1.5 text-[10px] hover:bg-[var(--background-surface)] transition-colors',
                task.status === s && 'bg-[var(--background-surface)]',
              )}
            >
              <StatusBadge status={s} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InlinePriorityEditor({
  task,
}: {
  readonly task: Task;
}) {
  const [open, setOpen] = useState(false);
  const updateMutation = useUpdateTask();
  const priorities: readonly Task['priority'][] = ['urgent', 'high', 'medium', 'low', 'none'];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5"
      >
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: priorityColor(task.priority) }}
        />
        <span className="text-xs text-[var(--foreground)]">{priorityLabel(task.priority)}</span>
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-20 w-28 bg-[var(--popover)] border border-[var(--border)] rounded-lg shadow-lg py-1 animate-scale-in">
          {priorities.map((p) => (
            <button
              key={p}
              onClick={() => {
                updateMutation.mutate({ id: task.id, payload: { priority: p } });
                setOpen(false);
              }}
              className={cn(
                'flex items-center gap-2 w-full px-2 py-1.5 text-xs hover:bg-[var(--background-surface)] transition-colors',
                task.priority === p && 'bg-[var(--background-surface)]',
              )}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityColor(p) }} />
              {priorityLabel(p)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Table Page ─────────────────────────────────────────────────

export default function TablePage() {
  const { data: tasks, isLoading } = useTasks();
  const openPanel = useDetailPanelStore((s) => s.openPanel);

  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [page, setPage] = useState(0);
  const pageSize = 25;

  // Toggle sort
  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  // Sort tasks
  const sorted = useMemo(() => {
    const arr = [...(tasks ?? [])];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'priority': {
          const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };
          cmp = (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
          break;
        }
        case 'dueDate':
          cmp = (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
          break;
        case 'createdAt':
          cmp = a.createdAt.localeCompare(b.createdAt);
          break;
        default:
          cmp = 0;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [tasks, sortKey, sortDir]);

  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(sorted.length / pageSize);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === paged.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paged.map((t) => t.id)));
    }
  }, [selectedIds.size, paged]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h1 className="font-outfit text-xl font-bold text-[var(--foreground)]">Table</h1>
        <TaskListShimmer />
      </div>
    );
  }

  if (!tasks?.length) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h1 className="font-outfit text-xl font-bold text-[var(--foreground)]">Table</h1>
        <EmptyState
          icon={<Table2 size={32} className="text-unjynx-gold" />}
          title="No data to display"
          description="Create tasks to see them in the spreadsheet view."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-outfit text-xl font-bold text-[var(--foreground)]">Table</h1>
        {selectedIds.size > 0 && (
          <span className="text-xs text-unjynx-violet font-medium">
            {selectedIds.size} row{selectedIds.size > 1 ? 's' : ''} selected
          </span>
        )}
      </div>

      {/* Spreadsheet table */}
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-3 py-2.5 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider',
                    col.width,
                    col.sortable && 'cursor-pointer hover:text-[var(--foreground)] transition-colors select-none',
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  {col.key === 'select' ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleAll(); }}
                      className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                        selectedIds.size === paged.length && paged.length > 0
                          ? 'bg-unjynx-violet border-unjynx-violet'
                          : 'border-[var(--border)] hover:border-unjynx-violet',
                      )}
                    >
                      {selectedIds.size === paged.length && paged.length > 0 && (
                        <Check size={10} className="text-white" />
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && sortKey === col.key && (
                        sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                      )}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((task) => {
              const isSelected = selectedIds.has(task.id);
              return (
                <tr
                  key={task.id}
                  className={cn(
                    'border-b border-[var(--border)] hover:bg-[var(--background-surface)] transition-colors',
                    isSelected && 'bg-unjynx-violet/5',
                  )}
                >
                  {/* Select */}
                  <td className="px-3 py-2">
                    <button
                      onClick={() => toggleSelect(task.id)}
                      className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                        isSelected
                          ? 'bg-unjynx-violet border-unjynx-violet'
                          : 'border-[var(--border)] hover:border-unjynx-violet',
                      )}
                    >
                      {isSelected && <Check size={10} className="text-white" />}
                    </button>
                  </td>

                  {/* Title */}
                  <td className="px-3 py-2">
                    <button
                      onClick={() => openPanel('task', task.id)}
                      className={cn(
                        'text-sm font-medium text-[var(--foreground)] hover:text-unjynx-violet transition-colors text-left truncate max-w-[300px] block',
                        task.status === 'done' && 'line-through text-[var(--muted-foreground)]',
                      )}
                    >
                      {task.title}
                    </button>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2">
                    <InlineStatusEditor task={task} />
                  </td>

                  {/* Priority */}
                  <td className="px-3 py-2">
                    <InlinePriorityEditor task={task} />
                  </td>

                  {/* Due Date */}
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        'text-xs',
                        task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
                          ? 'text-unjynx-rose'
                          : 'text-[var(--foreground-secondary)]',
                      )}
                    >
                      {formatDueDate(task.dueDate)}
                    </span>
                  </td>

                  {/* Project */}
                  <td className="px-3 py-2">
                    <span className="text-xs text-[var(--foreground-secondary)]">
                      {task.projectId ? `Project` : '-'}
                    </span>
                  </td>

                  {/* Assignee */}
                  <td className="px-3 py-2">
                    {task.assigneeId ? (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-unjynx-violet/40 to-unjynx-gold/40 flex items-center justify-center text-[10px]">
                        A
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--muted-foreground)]">-</span>
                    )}
                  </td>

                  {/* Tags */}
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {task.labels.slice(0, 2).map((l) => (
                        <span
                          key={l}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-unjynx-violet/10 text-unjynx-violet"
                        >
                          {l}
                        </span>
                      ))}
                      {task.labels.length === 0 && (
                        <span className="text-xs text-[var(--muted-foreground)]">-</span>
                      )}
                    </div>
                  </td>

                  {/* Created */}
                  <td className="px-3 py-2">
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {formatRelative(task.createdAt)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--muted-foreground)]">
            Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg hover:bg-[var(--background-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-[var(--foreground-secondary)] px-2">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-[var(--background-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
