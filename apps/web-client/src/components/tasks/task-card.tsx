'use client';

import { cn } from '@/lib/utils/cn';
import { priorityColor } from '@/lib/utils/priority';
import { formatDueDate, formatDueTime } from '@/lib/utils/format';
import { useDetailPanelStore } from '@/lib/store/detail-panel-store';
import { useCompleteTask } from '@/lib/hooks/use-tasks';
import { Clock, Check } from 'lucide-react';
import type { Task } from '@/lib/api/tasks';

interface TaskCardProps {
  readonly task: Task;
  readonly isDragging?: boolean;
}

export function TaskCard({ task, isDragging = false }: TaskCardProps) {
  const openPanel = useDetailPanelStore((s) => s.openPanel);
  const completeMutation = useCompleteTask();

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div
      className={cn(
        'group glass-card p-3 cursor-pointer transition-all duration-150',
        'hover:shadow-unjynx-card-dark hover:-translate-y-0.5',
        isDragging && 'opacity-50 rotate-2 shadow-lg',
        task.status === 'done' && 'opacity-60',
      )}
      onClick={() => openPanel('task', task.id)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      {/* Priority indicator */}
      <div className="flex items-start gap-2.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (task.status !== 'done') {
              completeMutation.mutate(task.id);
            }
          }}
          className={cn(
            'flex-shrink-0 mt-0.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-colors',
            task.status === 'done'
              ? 'bg-unjynx-emerald border-unjynx-emerald'
              : 'border-current hover:border-unjynx-emerald',
          )}
          style={{ color: task.status !== 'done' ? priorityColor(task.priority) : undefined }}
        >
          {task.status === 'done' && <Check size={10} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-medium text-[var(--foreground)] leading-snug line-clamp-2',
              task.status === 'done' && 'line-through text-[var(--muted-foreground)]',
            )}
          >
            {task.title}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {task.dueDate && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs',
                  isOverdue ? 'text-unjynx-rose' : 'text-[var(--muted-foreground)]',
                )}
              >
                <Clock size={12} />
                {formatDueDate(task.dueDate)}
                {task.dueTime && ` ${formatDueTime(task.dueTime)}`}
              </span>
            )}

            {task.labels.length > 0 && (
              <div className="flex gap-1">
                {task.labels.slice(0, 2).map((label) => (
                  <span
                    key={label}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-unjynx-violet/15 text-unjynx-violet"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignee avatar (bottom-right) */}
      {task.assigneeId && (
        <div className="flex justify-end mt-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-unjynx-violet/40 to-unjynx-gold/40 flex items-center justify-center text-[10px] text-[var(--foreground)]">
            A
          </div>
        </div>
      )}
    </div>
  );
}
