'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { priorityColor, priorityLabel } from '@/lib/utils/priority';
import { formatDueDate, formatDueTime } from '@/lib/utils/format';
import { useDetailPanelStore } from '@/lib/store/detail-panel-store';
import { useCompleteTask, useUpdateTask } from '@/lib/hooks/use-tasks';
import { Check, GripVertical, MessageSquare, Paperclip } from 'lucide-react';
import { TaskTypeBadge, IssueKeyBadge } from './task-type-badge';
import { SlaBadge } from './sla-badge';
import type { Task } from '@/lib/api/tasks';

interface TaskRowProps {
  readonly task: Task;
  readonly selected?: boolean;
  readonly onSelect?: (taskId: string, shiftKey: boolean) => void;
  readonly compact?: boolean;
}

export function TaskRow({ task, selected = false, onSelect, compact = false }: TaskRowProps) {
  const openPanel = useDetailPanelStore((s) => s.openPanel);
  const completeMutation = useCompleteTask();
  const updateMutation = useUpdateTask();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function handleSaveTitle() {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== task.title) {
      updateMutation.mutate({ id: task.id, payload: { title: trimmed } });
    } else {
      setEditTitle(task.title);
    }
    setEditing(false);
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer',
        'hover:bg-[var(--background-surface)]',
        selected && 'bg-unjynx-violet/10 ring-1 ring-unjynx-violet/30',
        compact && 'py-1.5',
      )}
      onClick={(e) => {
        if (editing) return;
        if (onSelect) {
          onSelect(task.id, e.shiftKey);
        } else {
          openPanel('task', task.id);
        }
      }}
    >
      {/* Drag handle */}
      <GripVertical
        size={14}
        className="flex-shrink-0 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
      />

      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (task.status !== 'done') {
            completeMutation.mutate(task.id);
          }
        }}
        className={cn(
          'flex-shrink-0 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors',
          task.status === 'done'
            ? 'bg-unjynx-emerald border-unjynx-emerald'
            : 'border-current hover:border-unjynx-emerald',
        )}
        style={{ color: task.status !== 'done' ? priorityColor(task.priority) : undefined }}
      >
        {task.status === 'done' && <Check size={10} className="text-white" />}
      </button>

      {/* Task Type Icon */}
      {task.taskType && task.taskType !== 'task' && (
        <TaskTypeBadge type={task.taskType} size="xs" />
      )}

      {/* Issue Key */}
      {task.issueKey && (
        <IssueKeyBadge issueKey={task.issueKey} />
      )}

      {/* Title */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle();
              if (e.key === 'Escape') {
                setEditTitle(task.title);
                setEditing(false);
              }
            }}
            className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none border-b border-unjynx-violet/50"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={cn(
              'text-sm text-[var(--foreground)] truncate block',
              task.status === 'done' && 'line-through text-[var(--muted-foreground)]',
            )}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
          >
            {task.title}
          </span>
        )}
      </div>

      {/* Priority dot */}
      <span
        className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: priorityColor(task.priority) }}
        title={priorityLabel(task.priority)}
      />

      {/* Project badge */}
      {task.projectId && !compact && (
        <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-[var(--background-elevated)] text-[var(--foreground-secondary)] border border-[var(--border)]">
          Project
        </span>
      )}

      {/* Story points */}
      {task.estimatePoints != null && task.estimatePoints > 0 && !compact && (
        <span className="hidden sm:inline-flex items-center justify-center flex-shrink-0 w-6 h-5 rounded bg-[var(--accent)]/10 text-[10px] font-bold text-[var(--accent)]">
          {task.estimatePoints}
        </span>
      )}

      {/* Comment count */}
      {(task.commentCount ?? 0) > 0 && !compact && (
        <span className="hidden md:flex items-center gap-0.5 flex-shrink-0 text-[10px] text-[var(--muted-foreground)]">
          <MessageSquare size={10} />{task.commentCount}
        </span>
      )}

      {/* Attachment count */}
      {(task.attachmentCount ?? 0) > 0 && !compact && (
        <span className="hidden md:flex items-center gap-0.5 flex-shrink-0 text-[10px] text-[var(--muted-foreground)]">
          <Paperclip size={10} />{task.attachmentCount}
        </span>
      )}

      {/* SLA indicator */}
      {task.dueDate && !compact && (
        <SlaBadge dueDate={task.dueDate} status={task.status} compact />
      )}

      {/* Due date */}
      {task.dueDate && (
        <span
          className={cn(
            'flex-shrink-0 text-xs',
            isOverdue ? 'text-unjynx-rose font-medium' : 'text-[var(--muted-foreground)]',
          )}
        >
          {formatDueDate(task.dueDate)}
          {task.dueTime && !compact && (
            <span className="ml-1 hidden md:inline">{formatDueTime(task.dueTime)}</span>
          )}
        </span>
      )}

      {/* Assignee */}
      {task.assigneeId && !compact && (
        <div className="hidden md:flex flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-unjynx-violet/40 to-unjynx-gold/40 items-center justify-center text-[10px] text-[var(--foreground)]">
          A
        </div>
      )}
    </div>
  );
}
