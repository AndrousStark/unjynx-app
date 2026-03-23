'use client';

import { useState, useMemo } from 'react';
import { useTasks } from '@/lib/hooks/use-tasks';
import { cn } from '@/lib/utils/cn';
import { priorityColor } from '@/lib/utils/priority';
import { formatDueTime } from '@/lib/utils/format';
import { useDetailPanelStore } from '@/lib/store/detail-panel-store';
import { Shimmer } from '@/components/ui/shimmer';
import { EmptyState } from '@/components/ui/empty-state';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  getHours,
  parseISO,
} from 'date-fns';
import type { Task } from '@/lib/api/tasks';

// ─── Sub-view Types ─────────────────────────────────────────────

type CalendarView = 'month' | 'week' | 'day';

// ─── Month View ─────────────────────────────────────────────────

function MonthView({
  currentDate,
  tasks,
  onSelectDate,
  selectedDate,
}: {
  readonly currentDate: Date;
  readonly tasks: readonly Task[];
  readonly onSelectDate: (date: Date) => void;
  readonly selectedDate: Date | null;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (task.dueDate) {
        const key = task.dueDate.split('T')[0];
        const arr = map.get(key) ?? [];
        arr.push(task);
        map.set(key, arr);
      }
    }
    return map;
  }, [tasks]);

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-[var(--muted-foreground)] py-2"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px bg-[var(--border)] rounded-lg overflow-hidden">
        {days.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDate.get(dayKey) ?? [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const today = isToday(day);

          return (
            <button
              key={dayKey}
              onClick={() => onSelectDate(day)}
              className={cn(
                'bg-[var(--background)] p-2 min-h-[80px] lg:min-h-[100px] text-left transition-colors hover:bg-[var(--background-surface)]',
                !isCurrentMonth && 'opacity-40',
                isSelected && 'ring-2 ring-unjynx-violet ring-inset',
              )}
            >
              <span
                className={cn(
                  'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium',
                  today
                    ? 'bg-unjynx-gold text-unjynx-midnight font-bold'
                    : 'text-[var(--foreground)]',
                )}
              >
                {format(day, 'd')}
              </span>
              {/* Task dots */}
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 mt-1 flex-wrap">
                  {dayTasks.slice(0, 4).map((t) => (
                    <span
                      key={t.id}
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: priorityColor(t.priority) }}
                      title={t.title}
                    />
                  ))}
                  {dayTasks.length > 4 && (
                    <span className="text-[8px] text-[var(--muted-foreground)]">
                      +{dayTasks.length - 4}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week View ──────────────────────────────────────────────────

function WeekView({
  currentDate,
  tasks,
}: {
  readonly currentDate: Date;
  readonly tasks: readonly Task[];
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  const openPanel = useDetailPanelStore((s) => s.openPanel);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (task.dueDate) {
        const key = task.dueDate.split('T')[0];
        const arr = map.get(key) ?? [];
        arr.push(task);
        map.set(key, arr);
      }
    }
    return map;
  }, [tasks]);

  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7am - 8pm

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[var(--border)]">
          <div className="p-2" />
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                'p-2 text-center border-l border-[var(--border)]',
                isToday(day) && 'bg-unjynx-gold/5',
              )}
            >
              <p className="text-xs text-[var(--muted-foreground)]">
                {format(day, 'EEE')}
              </p>
              <p
                className={cn(
                  'text-sm font-medium',
                  isToday(day) ? 'text-unjynx-gold font-bold' : 'text-[var(--foreground)]',
                )}
              >
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>

        {/* Time slots */}
        {hours.map((hour) => (
          <div
            key={hour}
            className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[var(--border)] min-h-[48px]"
          >
            <div className="p-1 text-[10px] text-[var(--muted-foreground)] text-right pr-2 pt-1">
              {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
            </div>
            {days.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayTasks = (tasksByDate.get(dayKey) ?? []).filter((t) => {
                if (!t.dueTime) return hour === 9; // default to 9am
                const taskHour = parseInt(t.dueTime.split(':')[0], 10);
                return taskHour === hour;
              });

              return (
                <div
                  key={`${dayKey}-${hour}`}
                  className={cn(
                    'border-l border-[var(--border)] p-0.5',
                    isToday(day) && 'bg-unjynx-gold/5',
                  )}
                >
                  {dayTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => openPanel('task', task.id)}
                      className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate mb-0.5 transition-colors hover:opacity-80"
                      style={{
                        backgroundColor: priorityColor(task.priority) + '25',
                        color: priorityColor(task.priority),
                        borderLeft: `2px solid ${priorityColor(task.priority)}`,
                      }}
                    >
                      {task.title}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Day View ───────────────────────────────────────────────────

function DayView({
  currentDate,
  tasks,
}: {
  readonly currentDate: Date;
  readonly tasks: readonly Task[];
}) {
  const openPanel = useDetailPanelStore((s) => s.openPanel);
  const dayKey = format(currentDate, 'yyyy-MM-dd');
  const dayTasks = tasks.filter((t) => t.dueDate?.startsWith(dayKey));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-0">
      <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)] mb-3">
        {format(currentDate, 'EEEE, MMMM d, yyyy')}
      </h3>

      <div className="border border-[var(--border)] rounded-lg overflow-hidden">
        {hours.map((hour) => {
          const hourTasks = dayTasks.filter((t) => {
            if (!t.dueTime) return hour === 9;
            return parseInt(t.dueTime.split(':')[0], 10) === hour;
          });

          const isNow = isToday(currentDate) && getHours(new Date()) === hour;

          return (
            <div
              key={hour}
              className={cn(
                'flex border-b border-[var(--border)] min-h-[48px]',
                isNow && 'bg-unjynx-gold/5',
              )}
            >
              <div className="w-16 flex-shrink-0 p-2 text-xs text-[var(--muted-foreground)] text-right border-r border-[var(--border)]">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              <div className="flex-1 p-1 space-y-0.5">
                {hourTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => openPanel('task', task.id)}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: priorityColor(task.priority) + '20',
                      color: priorityColor(task.priority),
                      borderLeft: `3px solid ${priorityColor(task.priority)}`,
                    }}
                  >
                    <span>{task.title}</span>
                    {task.dueTime && (
                      <span className="ml-2 text-xs opacity-75">
                        {formatDueTime(task.dueTime)}
                      </span>
                    )}
                  </button>
                ))}
                {isNow && (
                  <div className="h-0.5 bg-unjynx-gold rounded-full relative">
                    <span className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-unjynx-gold" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Selected Date Tasks ────────────────────────────────────────

function SelectedDateTasks({
  date,
  tasks,
}: {
  readonly date: Date;
  readonly tasks: readonly Task[];
}) {
  const openPanel = useDetailPanelStore((s) => s.openPanel);
  const dayKey = format(date, 'yyyy-MM-dd');
  const dayTasks = tasks.filter((t) => t.dueDate?.startsWith(dayKey));

  if (dayTasks.length === 0) return null;

  return (
    <div className="mt-4 glass-card p-4">
      <h4 className="font-outfit font-semibold text-sm text-[var(--foreground)] mb-2">
        Tasks for {format(date, 'MMMM d')}
      </h4>
      <div className="space-y-1">
        {dayTasks.map((task) => (
          <button
            key={task.id}
            onClick={() => openPanel('task', task.id)}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-[var(--background-surface)] transition-colors text-left"
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: priorityColor(task.priority) }}
            />
            <span className="text-sm text-[var(--foreground)] truncate">{task.title}</span>
            {task.dueTime && (
              <span className="text-xs text-[var(--muted-foreground)] ml-auto">
                {formatDueTime(task.dueTime)}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Calendar Page ──────────────────────────────────────────────

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { data: tasks, isLoading } = useTasks();

  const allTasks = tasks ?? [];

  function navigatePrev() {
    if (view === 'month') setCurrentDate((d) => subMonths(d, 1));
    else if (view === 'week') setCurrentDate((d) => subWeeks(d, 1));
    else setCurrentDate((d) => subDays(d, 1));
  }

  function navigateNext() {
    if (view === 'month') setCurrentDate((d) => addMonths(d, 1));
    else if (view === 'week') setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => addDays(d, 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  }

  const headerLabel =
    view === 'month'
      ? format(currentDate, 'MMMM yyyy')
      : view === 'week'
        ? `Week of ${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`
        : format(currentDate, 'EEEE, MMMM d, yyyy');

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h1 className="font-outfit text-xl font-bold text-[var(--foreground)]">Calendar</h1>
        <Shimmer variant="card" className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-outfit text-xl font-bold text-[var(--foreground)]">Calendar</h1>

        {/* View tabs */}
        <div className="flex items-center gap-1 bg-[var(--background-surface)] rounded-lg p-1 border border-[var(--border)]">
          {(['month', 'week', 'day'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors',
                view === v
                  ? 'bg-unjynx-violet text-white'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={navigatePrev}
            className="p-1.5 rounded-lg hover:bg-[var(--background-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-outfit font-semibold text-base text-[var(--foreground)] min-w-[200px] text-center">
            {headerLabel}
          </h2>
          <button
            onClick={navigateNext}
            className="p-1.5 rounded-lg hover:bg-[var(--background-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <button
          onClick={goToToday}
          className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-surface)] transition-colors"
        >
          Today
        </button>
      </div>

      {/* Calendar Views */}
      {allTasks.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon size={32} className="text-unjynx-gold" />}
          title="No tasks scheduled"
          description="Tasks with due dates will appear on the calendar."
        />
      ) : (
        <>
          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              tasks={allTasks}
              onSelectDate={setSelectedDate}
              selectedDate={selectedDate}
            />
          )}
          {view === 'week' && (
            <WeekView currentDate={currentDate} tasks={allTasks} />
          )}
          {view === 'day' && (
            <DayView currentDate={currentDate} tasks={allTasks} />
          )}

          {/* Selected date tasks (month view only) */}
          {view === 'month' && selectedDate && (
            <SelectedDateTasks date={selectedDate} tasks={allTasks} />
          )}
        </>
      )}
    </div>
  );
}
