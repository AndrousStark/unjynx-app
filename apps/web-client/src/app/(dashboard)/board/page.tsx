'use client';

import { useState, useCallback } from 'react';
import { useTasks, useMoveTask, useCreateTask } from '@/lib/hooks/use-tasks';
import { cn } from '@/lib/utils/cn';
import { TaskCard } from '@/components/tasks/task-card';
import { BoardShimmer } from '@/components/ui/shimmer';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, Columns3 } from 'lucide-react';
import type { Task } from '@/lib/api/tasks';

// ─── Column Config ──────────────────────────────────────────────

interface ColumnConfig {
  readonly id: Task['status'];
  readonly label: string;
  readonly color: string;
  readonly wipLimit?: number;
}

const COLUMNS: readonly ColumnConfig[] = [
  { id: 'todo', label: 'To Do', color: '#9B8BB8' },
  { id: 'in_progress', label: 'In Progress', color: '#6C3CE0', wipLimit: 5 },
  { id: 'done', label: 'Done', color: '#00C896' },
  { id: 'cancelled', label: 'Cancelled', color: '#FF6B8A' },
];

// ─── Board Column ───────────────────────────────────────────────

function BoardColumn({
  column,
  tasks,
  onDrop,
  onAddTask,
}: {
  readonly column: ColumnConfig;
  readonly tasks: readonly Task[];
  readonly onDrop: (taskId: string, status: Task['status']) => void;
  readonly onAddTask: (status: Task['status']) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const isOverWip = column.wipLimit !== undefined && tasks.length >= column.wipLimit;

  return (
    <div
      className={cn(
        'flex flex-col min-w-[280px] max-w-[320px] w-full',
        'rounded-xl transition-colors duration-150',
        isDragOver && 'ring-2 ring-unjynx-violet/40',
      )}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const taskId = e.dataTransfer.getData('text/plain');
        if (taskId) onDrop(taskId, column.id);
      }}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)]">
            {column.label}
          </h3>
          <span className="text-xs text-[var(--muted-foreground)] bg-[var(--background-surface)] px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="p-1 rounded hover:bg-[var(--background-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          title={`Add task to ${column.label}`}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* WIP limit warning */}
      {isOverWip && (
        <div className="mx-2 mb-2 px-2 py-1 rounded bg-unjynx-amber/10 border border-unjynx-amber/30">
          <p className="text-[10px] text-unjynx-amber font-medium">
            WIP limit ({column.wipLimit}) exceeded
          </p>
        </div>
      )}

      {/* Cards */}
      <div
        className={cn(
          'flex-1 space-y-2 px-1 pb-2 min-h-[120px] rounded-lg transition-colors',
          isDragOver && 'bg-unjynx-violet/5',
          tasks.length === 0 && 'border-2 border-dashed border-[var(--border)] flex items-center justify-center',
        )}
      >
        {tasks.length === 0 ? (
          <p className="text-xs text-[var(--muted-foreground)] text-center py-4">
            Drop tasks here
          </p>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Board Page ─────────────────────────────────────────────────

export default function BoardPage() {
  const { data: tasks, isLoading } = useTasks();
  const moveMutation = useMoveTask();
  const createMutation = useCreateTask();

  const handleDrop = useCallback(
    (taskId: string, newStatus: Task['status']) => {
      // We use the update mutation via move for status changes
      moveMutation.mutate({
        id: taskId,
        payload: {},
      });
      // Actually update status
      // Since moveTask doesn't update status, we use updateTask indirectly
      // For now, we'll use the API directly
      import('@/lib/api/tasks').then(({ updateTask }) => {
        updateTask(taskId, { status: newStatus });
      });
    },
    [moveMutation],
  );

  const handleAddTask = useCallback(
    (status: Task['status']) => {
      const title = window.prompt(`Add task to "${status.replace('_', ' ')}":`);
      if (title?.trim()) {
        createMutation.mutate({ title: title.trim() });
      }
    },
    [createMutation],
  );

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h1 className="font-outfit text-xl font-bold text-[var(--foreground)]">Board</h1>
        <BoardShimmer />
      </div>
    );
  }

  const allTasks = tasks ?? [];

  // Group by status
  const tasksByStatus: Record<Task['status'], Task[]> = {
    todo: [],
    in_progress: [],
    done: [],
    cancelled: [],
  };

  for (const task of allTasks) {
    tasksByStatus[task.status].push(task);
  }

  if (allTasks.length === 0) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h1 className="font-outfit text-xl font-bold text-[var(--foreground)]">Board</h1>
        <EmptyState
          icon={<Columns3 size={32} className="text-unjynx-gold" />}
          title="Your board is empty"
          description="Create tasks to see them organized in columns by status."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-outfit text-xl font-bold text-[var(--foreground)]">Board</h1>
        <p className="text-xs text-[var(--muted-foreground)]">
          Drag tasks between columns to change status
        </p>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
        {COLUMNS.map((column) => (
          <BoardColumn
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.id]}
            onDrop={handleDrop}
            onAddTask={handleAddTask}
          />
        ))}
      </div>
    </div>
  );
}
