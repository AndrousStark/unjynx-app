'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTasks, useUpdateTask } from '@/lib/hooks/use-tasks';
import { useDetailPanelStore } from '@/lib/store/detail-panel-store';
import { useVocabulary } from '@/lib/hooks/use-vocabulary';
import { priorityColor } from '@/lib/utils/priority';
import { Shimmer } from '@/components/ui/shimmer';
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar as CalendarIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { Task } from '@/lib/api/tasks';

// FullCalendar must be loaded client-side only (no SSR)
const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false });
const dayGridPlugin = typeof window !== 'undefined' ? require('@fullcalendar/daygrid').default : null;
const timeGridPlugin = typeof window !== 'undefined' ? require('@fullcalendar/timegrid').default : null;
const interactionPlugin = typeof window !== 'undefined' ? require('@fullcalendar/interaction').default : null;
const listPlugin = typeof window !== 'undefined' ? require('@fullcalendar/list').default : null;

// ─── Task → FullCalendar Event Mapper ────────────────────────────

function taskToEvent(task: Task) {
  const isDone = task.status === 'done' || task.status === 'completed';
  return {
    id: task.id,
    title: task.title,
    start: task.dueDate ?? undefined,
    end: task.dueDate ?? undefined,
    allDay: !task.dueTime,
    backgroundColor: isDone ? 'var(--success)' : priorityColor(task.priority),
    borderColor: isDone ? 'var(--success)' : priorityColor(task.priority),
    textColor: '#FFFFFF',
    classNames: [isDone ? 'opacity-50 line-through' : ''],
    extendedProps: {
      taskId: task.id,
      priority: task.priority,
      status: task.status,
      projectId: task.projectId,
      issueKey: task.issueKey,
    },
  };
}

// ─── Custom CSS for FullCalendar Theme ───────────────────────────

const calendarStyles = `
  .fc {
    --fc-border-color: var(--border);
    --fc-button-bg-color: var(--background-surface);
    --fc-button-border-color: var(--border);
    --fc-button-text-color: var(--foreground);
    --fc-button-hover-bg-color: var(--accent);
    --fc-button-hover-border-color: var(--accent);
    --fc-button-active-bg-color: var(--accent);
    --fc-button-active-border-color: var(--accent);
    --fc-today-bg-color: rgba(108, 60, 224, 0.05);
    --fc-neutral-bg-color: var(--background-surface);
    --fc-page-bg-color: var(--background);
    --fc-event-border-color: transparent;
    font-family: 'DM Sans', system-ui, sans-serif;
  }
  .fc .fc-toolbar-title {
    font-family: 'Outfit', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--foreground);
  }
  .fc .fc-col-header-cell-cushion,
  .fc .fc-daygrid-day-number,
  .fc .fc-timegrid-slot-label-cushion {
    color: var(--foreground);
    font-size: 0.75rem;
  }
  .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
    background: var(--accent);
    color: white;
    border-radius: 9999px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .fc .fc-event {
    border-radius: 6px;
    font-size: 0.7rem;
    padding: 1px 4px;
    cursor: pointer;
  }
  .fc .fc-button {
    font-size: 0.75rem;
    padding: 4px 12px;
    border-radius: 8px;
    font-weight: 500;
  }
  .fc .fc-button-primary:not(:disabled).fc-button-active {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
  }
  .fc .fc-scrollgrid {
    border-color: var(--border);
  }
  .fc th {
    background: var(--background-surface);
  }
  .fc .fc-timegrid-now-indicator-line {
    border-color: var(--destructive);
  }
  .fc .fc-timegrid-now-indicator-arrow {
    border-color: var(--destructive);
  }
`;

// ─── Main Page ───────────────────────────────────────────────────

export default function CalendarPage() {
  const t = useVocabulary();
  const { data: tasks, isLoading } = useTasks();
  const updateTask = useUpdateTask();
  const openPanel = useDetailPanelStore((s) => s.openPanel);

  // Convert tasks to FullCalendar events
  const events = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => t.dueDate).map(taskToEvent);
  }, [tasks]);

  // Handle event click → open detail panel
  const handleEventClick = useCallback(
    (info: { event: { id: string } }) => {
      openPanel('task', info.event.id);
    },
    [openPanel],
  );

  // Handle event drop (drag to reschedule)
  const handleEventDrop = useCallback(
    (info: { event: { id: string; start: Date | null } }) => {
      if (info.event.start) {
        updateTask.mutate({
          id: info.event.id,
          payload: { dueDate: info.event.start.toISOString() },
        });
      }
    },
    [updateTask],
  );

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-6 px-4">
        <Shimmer className="h-12 rounded-xl mb-4" />
        <Shimmer className="h-[600px] rounded-xl" />
      </div>
    );
  }

  if (!tasks || tasks.filter((t) => t.dueDate).length === 0) {
    return (
      <div className="max-w-5xl mx-auto py-6 px-4">
        <EmptyState
          icon={<CalendarIcon size={32} className="text-unjynx-gold" />}
          title={`No ${t('Task').toLowerCase()}s scheduled`}
          description={`${t('Task')}s with due dates will appear on the calendar. Drag events to reschedule.`}
        />
      </div>
    );
  }

  const plugins = [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin].filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 animate-fade-in">
      <style>{calendarStyles}</style>

      <FullCalendar
        {...{
          plugins,
          initialView: 'dayGridMonth',
          headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          },
          buttonText: {
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day',
            list: 'List',
          },
          events,
          editable: true,
          droppable: true,
          selectable: true,
          eventClick: handleEventClick,
          eventDrop: handleEventDrop,
          nowIndicator: true,
          dayMaxEvents: 3,
          height: 'auto',
          contentHeight: 650,
          eventDisplay: 'block',
          weekends: true,
          firstDay: 1,
          slotMinTime: '06:00:00',
          slotMaxTime: '22:00:00',
        } as Record<string, unknown>}
      />
    </div>
  );
}
