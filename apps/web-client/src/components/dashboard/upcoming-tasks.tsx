'use client';

import { useTasks } from '@/lib/hooks/use-tasks';
import { useDetailPanelStore } from '@/lib/store/detail-panel-store';
import { cn } from '@/lib/utils/cn';
import { priorityColor } from '@/lib/utils/priority';
import { formatDueDate, formatDueTime } from '@/lib/utils/format';
import { Shimmer } from '@/components/ui/shimmer';
import { Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function UpcomingTasks() {
  const { data: tasks, isLoading } = useTasks({
    status: 'todo',
    limit: 5,
  });
  const openPanel = useDetailPanelStore((s) => s.openPanel);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)]">
          Upcoming Tasks
        </h3>
        <Link
          href="/tasks"
          className="text-xs text-unjynx-violet hover:text-unjynx-violet-hover transition-colors flex items-center gap-1"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Shimmer className="w-2.5 h-2.5 rounded-full" />
              <Shimmer className={cn('h-4', i % 2 === 0 ? 'w-2/3' : 'w-1/2')} />
              <Shimmer className="h-3 w-14 ml-auto" />
            </div>
          ))}
        </div>
      ) : !tasks?.length ? (
        <p className="text-sm text-[var(--muted-foreground)] text-center py-6">
          No upcoming tasks. Time to create some!
        </p>
      ) : (
        <div className="space-y-1">
          {tasks.slice(0, 5).map((task) => {
            const isOverdue =
              task.dueDate && new Date(task.dueDate) < new Date();

            return (
              <button
                key={task.id}
                onClick={() => openPanel('task', task.id)}
                className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-[var(--background-surface)] transition-colors text-left"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: priorityColor(task.priority) }}
                />
                <span className="text-sm text-[var(--foreground)] truncate flex-1">
                  {task.title}
                </span>
                {task.dueDate && (
                  <span
                    className={cn(
                      'text-xs flex-shrink-0 flex items-center gap-1',
                      isOverdue ? 'text-unjynx-rose' : 'text-[var(--muted-foreground)]',
                    )}
                  >
                    <Clock size={10} />
                    {formatDueDate(task.dueDate)}
                    {task.dueTime && ` ${formatDueTime(task.dueTime)}`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
