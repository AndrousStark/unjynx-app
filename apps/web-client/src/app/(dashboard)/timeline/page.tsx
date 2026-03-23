'use client';

import { useState, useMemo } from 'react';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useDetailPanelStore } from '@/lib/store/detail-panel-store';
import { cn } from '@/lib/utils/cn';
import { priorityColor } from '@/lib/utils/priority';
import { Shimmer } from '@/components/ui/shimmer';
import { EmptyState } from '@/components/ui/empty-state';
import { ChevronLeft, ChevronRight, GanttChart, ChevronDown, ChevronUp } from 'lucide-react';
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameDay,
  parseISO,
} from 'date-fns';
import type { Task } from '@/lib/api/tasks';

// ─── Zoom Levels ────────────────────────────────────────────────

type ZoomLevel = 'day' | 'week' | 'month';

const ZOOM_CONFIG = {
  day: { cellWidth: 48, labelFormat: 'd', headerFormat: 'EEE d', range: 14 },
  week: { cellWidth: 32, labelFormat: 'd', headerFormat: 'MMM d', range: 42 },
  month: { cellWidth: 18, labelFormat: 'd', headerFormat: 'MMM', range: 90 },
} as const;

// ─── Timeline Bar ───────────────────────────────────────────────

function TimelineBar({
  task,
  startDate,
  zoom,
}: {
  readonly task: Task;
  readonly startDate: Date;
  readonly zoom: ZoomLevel;
}) {
  const openPanel = useDetailPanelStore((s) => s.openPanel);
  const config = ZOOM_CONFIG[zoom];

  if (!task.dueDate) return null;

  const dueDate = parseISO(task.dueDate);
  const startOffset = differenceInDays(dueDate, startDate);
  // Assume 1-day duration if no end date
  const duration = 1;

  if (startOffset < 0 || startOffset >= config.range) return null;

  return (
    <button
      onClick={() => openPanel('task', task.id)}
      className={cn(
        'absolute top-1.5 h-7 rounded-md flex items-center px-2 text-[10px] font-medium truncate transition-opacity hover:opacity-90 cursor-pointer',
        task.status === 'done' && 'opacity-50',
      )}
      style={{
        left: `${startOffset * config.cellWidth}px`,
        width: `${Math.max(duration * config.cellWidth - 4, config.cellWidth - 4)}px`,
        backgroundColor: priorityColor(task.priority) + '30',
        borderLeft: `3px solid ${priorityColor(task.priority)}`,
        color: priorityColor(task.priority),
      }}
      title={`${task.title} - Due: ${format(dueDate, 'MMM d')}`}
    >
      {task.title}
    </button>
  );
}

// ─── Timeline Page ──────────────────────────────────────────────

export default function TimelinePage() {
  const { data: tasks, isLoading } = useTasks();
  const [zoom, setZoom] = useState<ZoomLevel>('week');
  const [baseDate, setBaseDate] = useState(new Date());
  const [collapsedProjects, setCollapsedProjects] = useState<ReadonlySet<string>>(new Set());
  const openPanel = useDetailPanelStore((s) => s.openPanel);

  const config = ZOOM_CONFIG[zoom];

  const startDate = useMemo(() => {
    if (zoom === 'day') return subDays(baseDate, 2);
    if (zoom === 'week') return startOfWeek(subWeeks(baseDate, 1));
    return startOfMonth(subMonths(baseDate, 1));
  }, [baseDate, zoom]);

  const endDate = useMemo(() => addDays(startDate, config.range), [startDate, config.range]);
  const days = useMemo(
    () => eachDayOfInterval({ start: startDate, end: endDate }),
    [startDate, endDate],
  );

  const allTasks = tasks ?? [];

  // Group by project
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; tasks: Task[] }>();
    const noProject: Task[] = [];

    for (const task of allTasks) {
      if (task.projectId) {
        const existing = map.get(task.projectId);
        if (existing) {
          existing.tasks.push(task);
        } else {
          map.set(task.projectId, { name: `Project ${task.projectId.slice(0, 6)}`, tasks: [task] });
        }
      } else {
        noProject.push(task);
      }
    }

    const result: { id: string; name: string; tasks: Task[] }[] = [];
    if (noProject.length > 0) {
      result.push({ id: '__none__', name: 'No Project', tasks: noProject });
    }
    for (const [id, group] of map) {
      result.push({ id, ...group });
    }
    return result;
  }, [allTasks]);

  function navigatePrev() {
    if (zoom === 'day') setBaseDate((d) => subDays(d, 7));
    else if (zoom === 'week') setBaseDate((d) => subWeeks(d, 2));
    else setBaseDate((d) => subMonths(d, 1));
  }

  function navigateNext() {
    if (zoom === 'day') setBaseDate((d) => addDays(d, 7));
    else if (zoom === 'week') setBaseDate((d) => addWeeks(d, 2));
    else setBaseDate((d) => addMonths(d, 1));
  }

  function toggleProject(id: string) {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h1 className="font-outfit text-xl font-bold text-[var(--foreground)]">Timeline</h1>
        <Shimmer variant="card" className="h-[400px]" />
      </div>
    );
  }

  if (allTasks.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h1 className="font-outfit text-xl font-bold text-[var(--foreground)]">Timeline</h1>
        <EmptyState
          icon={<GanttChart size={32} className="text-unjynx-gold" />}
          title="No tasks on the timeline"
          description="Tasks with due dates will appear here as timeline bars."
        />
      </div>
    );
  }

  const todayOffset = differenceInDays(new Date(), startDate);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-outfit text-xl font-bold text-[var(--foreground)]">Timeline</h1>

        {/* Zoom selector */}
        <div className="flex items-center gap-1 bg-[var(--background-surface)] rounded-lg p-1 border border-[var(--border)]">
          {(['day', 'week', 'month'] as const).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors',
                zoom === z
                  ? 'bg-unjynx-violet text-white'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button onClick={navigatePrev} className="p-1.5 rounded-lg hover:bg-[var(--background-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium text-[var(--foreground)] min-w-[180px] text-center">
          {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
        </span>
        <button onClick={navigateNext} className="p-1.5 rounded-lg hover:bg-[var(--background-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => setBaseDate(new Date())}
          className="ml-2 px-2.5 py-1 rounded-lg border border-[var(--border)] text-xs text-[var(--foreground-secondary)] hover:bg-[var(--background-surface)] transition-colors"
        >
          Today
        </button>
      </div>

      {/* Gantt Chart */}
      <div className="glass-card overflow-auto">
        <div className="flex">
          {/* Left: Task list */}
          <div className="flex-shrink-0 w-[200px] lg:w-[260px] border-r border-[var(--border)]">
            {/* Header */}
            <div className="h-10 border-b border-[var(--border)] px-3 flex items-center">
              <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Tasks
              </span>
            </div>
            {/* Task rows */}
            {grouped.map((group) => (
              <div key={group.id}>
                {/* Group header */}
                <button
                  onClick={() => toggleProject(group.id)}
                  className="flex items-center gap-2 w-full px-3 h-8 border-b border-[var(--border)] bg-[var(--background-surface)] hover:bg-[var(--background-elevated)] transition-colors"
                >
                  {collapsedProjects.has(group.id) ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  <span className="text-xs font-semibold text-[var(--foreground)] truncate">
                    {group.name}
                  </span>
                  <span className="text-[10px] text-[var(--muted-foreground)] ml-auto">
                    {group.tasks.length}
                  </span>
                </button>
                {/* Tasks */}
                {!collapsedProjects.has(group.id) &&
                  group.tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => openPanel('task', task.id)}
                      className="flex items-center gap-2 w-full px-3 pl-7 h-10 border-b border-[var(--border)] hover:bg-[var(--background-surface)] transition-colors text-left"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: priorityColor(task.priority) }}
                      />
                      <span className="text-xs text-[var(--foreground)] truncate">
                        {task.title}
                      </span>
                    </button>
                  ))}
              </div>
            ))}
          </div>

          {/* Right: Timeline */}
          <div className="flex-1 overflow-x-auto">
            {/* Date headers */}
            <div className="flex h-10 border-b border-[var(--border)]">
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'flex-shrink-0 flex items-center justify-center border-r border-[var(--border)] text-[10px]',
                    isToday(day) ? 'text-unjynx-gold font-bold bg-unjynx-gold/5' : 'text-[var(--muted-foreground)]',
                  )}
                  style={{ width: `${config.cellWidth}px` }}
                >
                  {format(day, config.labelFormat)}
                </div>
              ))}
            </div>

            {/* Task bars */}
            {grouped.map((group) => (
              <div key={group.id}>
                {/* Group spacer */}
                <div className="h-8 border-b border-[var(--border)] bg-[var(--background-surface)]" />
                {/* Task rows */}
                {!collapsedProjects.has(group.id) &&
                  group.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="relative h-10 border-b border-[var(--border)]"
                      style={{ width: `${days.length * config.cellWidth}px` }}
                    >
                      <TimelineBar task={task} startDate={startDate} zoom={zoom} />
                    </div>
                  ))}
              </div>
            ))}

            {/* Today marker */}
            {todayOffset >= 0 && todayOffset < config.range && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-unjynx-gold z-10 pointer-events-none"
                style={{ left: `${200 + todayOffset * config.cellWidth + config.cellWidth / 2}px` }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Placeholder for dependencies */}
      <p className="text-xs text-[var(--muted-foreground)] text-center">
        Task dependency arrows coming in a future update
      </p>
    </div>
  );
}
