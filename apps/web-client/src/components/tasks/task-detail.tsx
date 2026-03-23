'use client';

import { useState, useRef, useEffect } from 'react';
import { useTask, useUpdateTask, useDeleteTask } from '@/lib/hooks/use-tasks';
import { useDetailPanelStore } from '@/lib/store/detail-panel-store';
import { cn } from '@/lib/utils/cn';
import { priorityColor, priorityLabel } from '@/lib/utils/priority';
import { formatDueDate, formatDueTime, formatRelative } from '@/lib/utils/format';
import { Shimmer, ShimmerGroup } from '@/components/ui/shimmer';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  Flag,
  Tag,
  Trash2,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Bell,
  History,
  ChevronDown,
} from 'lucide-react';
import type { Task } from '@/lib/api/tasks';

interface TaskDetailProps {
  readonly taskId: string;
}

// ─── Priority Picker ────────────────────────────────────────────

const PRIORITIES: readonly Task['priority'][] = ['urgent', 'high', 'medium', 'low', 'none'];

function PriorityPicker({
  value,
  onChange,
}: {
  readonly value: Task['priority'];
  readonly onChange: (p: Task['priority']) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--background-surface)] text-sm transition-colors"
      >
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: priorityColor(value) }} />
        {priorityLabel(value)}
        <ChevronDown size={14} className="text-[var(--muted-foreground)]" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-10 w-36 bg-[var(--popover)] border border-[var(--border)] rounded-lg shadow-lg py-1 animate-scale-in">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              onClick={() => {
                onChange(p);
                setOpen(false);
              }}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[var(--background-surface)] transition-colors',
                p === value && 'bg-[var(--background-surface)]',
              )}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: priorityColor(p) }} />
              {priorityLabel(p)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Status Picker ──────────────────────────────────────────────

const STATUSES: readonly { value: Task['status']; label: string; color: string }[] = [
  { value: 'todo', label: 'To Do', color: 'var(--muted-foreground)' },
  { value: 'in_progress', label: 'In Progress', color: '#6C3CE0' },
  { value: 'done', label: 'Done', color: '#00C896' },
  { value: 'cancelled', label: 'Cancelled', color: '#FF6B8A' },
];

function StatusPicker({
  value,
  onChange,
}: {
  readonly value: Task['status'];
  readonly onChange: (s: Task['status']) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = STATUSES.find((s) => s.value === value) ?? STATUSES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--background-surface)] text-sm transition-colors"
      >
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: current.color }} />
        {current.label}
        <ChevronDown size={14} className="text-[var(--muted-foreground)]" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-10 w-40 bg-[var(--popover)] border border-[var(--border)] rounded-lg shadow-lg py-1 animate-scale-in">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                onChange(s.value);
                setOpen(false);
              }}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[var(--background-surface)] transition-colors',
                s.value === value && 'bg-[var(--background-surface)]',
              )}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Detail Section ─────────────────────────────────────────────

function DetailSection({
  icon,
  label,
  children,
}: {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[var(--border)]">
      <span className="text-[var(--muted-foreground)] mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--muted-foreground)] mb-1">{label}</p>
        {children}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function TaskDetail({ taskId }: TaskDetailProps) {
  const { data: task, isLoading, error } = useTask(taskId);
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const closePanel = useDetailPanelStore((s) => s.closePanel);

  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
    }
  }, [task]);

  useEffect(() => {
    if (editingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [editingTitle]);

  // ─── Loading ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Shimmer className="h-8 w-3/4" />
        <ShimmerGroup count={4} />
        <Shimmer variant="card" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <p className="text-sm text-unjynx-rose text-center py-8">
        Failed to load task details
      </p>
    );
  }

  // ─── Handlers ───────────────────────────────────────────────

  function saveTitle() {
    const trimmed = title.trim();
    if (trimmed && trimmed !== task!.title) {
      updateMutation.mutate({ id: task!.id, payload: { title: trimmed } });
    } else {
      setTitle(task!.title);
    }
    setEditingTitle(false);
  }

  function saveDescription() {
    const trimmed = description.trim();
    if (trimmed !== (task!.description ?? '')) {
      updateMutation.mutate({
        id: task!.id,
        payload: { description: trimmed || null },
      });
    }
  }

  function handleDelete() {
    if (window.confirm('Delete this task permanently?')) {
      deleteMutation.mutate(task!.id, {
        onSuccess: () => closePanel(),
      });
    }
  }

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-0">
      {/* Title */}
      <div className="pb-4 border-b border-[var(--border)]">
        {editingTitle ? (
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTitle();
              if (e.key === 'Escape') {
                setTitle(task.title);
                setEditingTitle(false);
              }
            }}
            className="w-full text-lg font-outfit font-semibold bg-transparent outline-none text-[var(--foreground)] border-b-2 border-unjynx-violet"
          />
        ) : (
          <h3
            className="text-lg font-outfit font-semibold text-[var(--foreground)] cursor-pointer hover:text-unjynx-violet transition-colors"
            onClick={() => setEditingTitle(true)}
          >
            {task.title}
          </h3>
        )}
      </div>

      {/* Status & Priority */}
      <div className="flex items-center gap-3 py-4 border-b border-[var(--border)] flex-wrap">
        <StatusPicker
          value={task.status}
          onChange={(status) => updateMutation.mutate({ id: task.id, payload: { status } })}
        />
        <PriorityPicker
          value={task.priority}
          onChange={(priority) => updateMutation.mutate({ id: task.id, payload: { priority } })}
        />
      </div>

      {/* Description */}
      <DetailSection icon={<MessageSquare size={16} />} label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={saveDescription}
          placeholder="Add a description..."
          className="w-full min-h-[80px] text-sm bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none resize-y"
          rows={3}
        />
      </DetailSection>

      {/* Due Date */}
      <DetailSection icon={<Calendar size={16} />} label="Due Date">
        <p className="text-sm text-[var(--foreground)]">
          {task.dueDate
            ? `${formatDueDate(task.dueDate)}${task.dueTime ? ` at ${formatDueTime(task.dueTime)}` : ''}`
            : 'No due date'}
        </p>
      </DetailSection>

      {/* Labels */}
      <DetailSection icon={<Tag size={16} />} label="Labels">
        <div className="flex flex-wrap gap-1.5">
          {task.labels.length > 0 ? (
            task.labels.map((label) => (
              <span
                key={label}
                className="text-xs px-2 py-0.5 rounded-full bg-unjynx-violet/15 text-unjynx-violet"
              >
                {label}
              </span>
            ))
          ) : (
            <span className="text-sm text-[var(--muted-foreground)]">No labels</span>
          )}
        </div>
      </DetailSection>

      {/* Subtasks placeholder */}
      <DetailSection icon={<CheckSquare size={16} />} label="Subtasks">
        <p className="text-sm text-[var(--muted-foreground)]">No subtasks yet</p>
      </DetailSection>

      {/* Reminders placeholder */}
      <DetailSection icon={<Bell size={16} />} label="Reminders">
        <p className="text-sm text-[var(--muted-foreground)]">No reminders set</p>
      </DetailSection>

      {/* Attachments placeholder */}
      <DetailSection icon={<Paperclip size={16} />} label="Attachments">
        <p className="text-sm text-[var(--muted-foreground)]">No attachments</p>
      </DetailSection>

      {/* Activity log */}
      <DetailSection icon={<History size={16} />} label="Activity">
        <div className="space-y-2">
          <p className="text-xs text-[var(--muted-foreground)]">
            Created {formatRelative(task.createdAt)}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            Updated {formatRelative(task.updatedAt)}
          </p>
          {task.completedAt && (
            <p className="text-xs text-unjynx-emerald">
              Completed {formatRelative(task.completedAt)}
            </p>
          )}
        </div>
      </DetailSection>

      {/* Actions */}
      <div className="pt-4 flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          isLoading={deleteMutation.isPending}
        >
          <Trash2 size={14} />
          Delete Task
        </Button>
      </div>
    </div>
  );
}
