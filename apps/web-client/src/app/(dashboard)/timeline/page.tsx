'use client';

import { useState, useMemo } from 'react';
import { useTasks, useUpdateTask } from '@/lib/hooks/use-tasks';
import { useDetailPanelStore } from '@/lib/store/detail-panel-store';
import { useVocabulary } from '@/lib/hooks/use-vocabulary';
import { priorityColor } from '@/lib/utils/priority';
import { Shimmer } from '@/components/ui/shimmer';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils/cn';
import { GanttChart, Calendar, List, Maximize2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { Task as ApiTask } from '@/lib/api/tasks';

// Dynamic import — gantt-task-react uses browser APIs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GanttComponent = dynamic<any>(
  () => import('gantt-task-react').then((mod) => mod.Gantt),
  { ssr: false },
);

// ─── View Mode ───────────────────────────────────────────────────

type GanttViewMode = 'Day' | 'Week' | 'Month';

const VIEW_MODES: readonly { value: GanttViewMode; label: string; icon: React.ElementType }[] = [
  { value: 'Day', label: 'Day', icon: Calendar },
  { value: 'Week', label: 'Week', icon: List },
  { value: 'Month', label: 'Month', icon: Maximize2 },
];

// ─── Task → Gantt Task Mapper ────────────────────────────────────

interface GanttTask {
  start: Date;
  end: Date;
  name: string;
  id: string;
  type: 'task' | 'milestone' | 'project';
  progress: number;
  isDisabled: boolean;
  styles: { progressColor: string; progressSelectedColor: string; backgroundColor: string; backgroundSelectedColor: string };
  project?: string;
  dependencies?: string[];
}

function apiTaskToGanttTask(task: ApiTask): GanttTask | null {
  if (!task.dueDate) return null;

  const start = task.startDate ? new Date(task.startDate) : new Date(task.createdAt);
  const end = new Date(task.dueDate);

  // Ensure end is after start
  if (end <= start) {
    end.setDate(start.getDate() + 1);
  }

  const isDone = task.status === 'done' || task.status === 'completed';
  const color = priorityColor(task.priority);

  return {
    start,
    end,
    name: task.issueKey ? `${task.issueKey} ${task.title}` : task.title,
    id: task.id,
    type: task.taskType === 'epic' ? 'project' : 'task',
    progress: isDone ? 100 : task.status === 'in_progress' ? 50 : 0,
    isDisabled: false,
    styles: {
      progressColor: color,
      progressSelectedColor: color,
      backgroundColor: `${color}40`,
      backgroundSelectedColor: `${color}60`,
    },
    project: task.projectId ?? undefined,
  };
}

// ─── Main Page ───────────────────────────────────────────────────

export default function TimelinePage() {
  const t = useVocabulary();
  const { data: tasks, isLoading } = useTasks();
  const updateTask = useUpdateTask();
  const openPanel = useDetailPanelStore((s) => s.openPanel);

  const [viewMode, setViewMode] = useState<GanttViewMode>('Week');

  // Convert to gantt tasks
  const ganttTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks
      .map(apiTaskToGanttTask)
      .filter((t): t is GanttTask => t !== null)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [tasks]);

  // Handle date change (drag to reschedule)
  const handleDateChange = (task: GanttTask) => {
    updateTask.mutate({
      id: task.id,
      payload: {
        dueDate: task.end.toISOString(),
      },
    });
  };

  // Handle click
  const handleClick = (task: GanttTask) => {
    openPanel('task', task.id);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-6 px-4">
        <Shimmer className="h-12 rounded-xl mb-4" />
        <Shimmer className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (ganttTasks.length === 0) {
    return (
      <div className="max-w-6xl mx-auto py-6 px-4">
        <EmptyState
          icon={<GanttChart size={32} className="text-unjynx-gold" />}
          title={`No ${t('Task').toLowerCase()}s with dates`}
          description={`${t('Task')}s with due dates will appear as timeline bars. Add start and due dates to see them here.`}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <GanttChart size={18} className="text-[var(--accent)]" />
          <h1 className="font-outfit text-lg font-bold text-[var(--foreground)]">Timeline</h1>
          <span className="text-xs text-[var(--muted-foreground)]">{ganttTasks.length} {t('Task').toLowerCase()}s</span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--background-surface)] border border-[var(--border)]">
          {VIEW_MODES.map((vm) => {
            const Icon = vm.icon;
            return (
              <button
                key={vm.value}
                onClick={() => setViewMode(vm.value)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                  viewMode === vm.value
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                )}
              >
                <Icon size={12} />
                {vm.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--card)]">
        {typeof window !== 'undefined' && GanttComponent && (
          <GanttComponent
            tasks={ganttTasks}
            viewMode={viewMode}
            onDateChange={handleDateChange}
            onClick={handleClick}
            listCellWidth=""
            columnWidth={viewMode === 'Month' ? 300 : viewMode === 'Week' ? 120 : 60}
            barCornerRadius={6}
            barFill={65}
            fontSize="11"
            headerHeight={50}
            rowHeight={50}
            todayColor="rgba(108, 60, 224, 0.08)"
            arrowColor="var(--accent)"
            arrowIndent={20}
          />
        )}
      </div>

      <p className="text-[10px] text-[var(--muted-foreground)] mt-3 text-center">
        Drag bars to reschedule &bull; Click to view details &bull; Epics shown as project bars
      </p>
    </div>
  );
}
