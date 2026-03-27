'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, updateTask, type Task } from '@/lib/api/tasks';
import { scheduleTasks } from '@/lib/api/ai';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shimmer } from '@/components/ui/shimmer';
import { priorityColor } from '@/lib/utils/priority';
import {
  Sparkles,
  Calendar,
  Clock,
  Check,
  X,
  ChevronRight,
  Zap,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────

interface ScheduleSlot {
  readonly taskId: string;
  readonly suggestedStart: string;
  readonly suggestedEnd: string;
  readonly reason: string;
}

interface ScheduleResult {
  readonly schedule: readonly ScheduleSlot[];
  readonly insights: string;
}

type SlotDecision = 'pending' | 'accepted' | 'rejected';

// ─── Task Selection Card ────────────────────────────────────────

function TaskSelectionCard({
  task,
  selected,
  onToggle,
}: {
  task: Task;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
        selected
          ? 'border-unjynx-violet/50 bg-unjynx-violet/5 shadow-sm'
          : 'border-[var(--border)] hover:border-unjynx-violet/30 hover:bg-[var(--background-surface)]',
      )}
    >
      <div
        className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
          selected ? 'bg-unjynx-violet border-unjynx-violet' : 'border-[var(--border)]',
        )}
      >
        {selected && <Check size={12} className="text-white" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)] truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: priorityColor(task.priority) }}
          />
          <span className="text-[10px] text-[var(--muted-foreground)] capitalize">{task.priority}</span>
          {task.dueDate && (
            <>
              <span className="text-[10px] text-[var(--muted-foreground)]">|</span>
              <span className="text-[10px] text-[var(--muted-foreground)]">
                Due {new Date(task.dueDate).toLocaleDateString()}
              </span>
            </>
          )}
        </div>
      </div>

      <ChevronRight size={14} className={cn('text-[var(--muted-foreground)] transition-transform', selected && 'rotate-90')} />
    </button>
  );
}

// ─── Schedule Slot Card ─────────────────────────────────────────

function ScheduleSlotCard({
  slot,
  task,
  decision,
  onAccept,
  onReject,
  isApplying,
}: {
  slot: ScheduleSlot;
  task: Task | undefined;
  decision: SlotDecision;
  onAccept: () => void;
  onReject: () => void;
  isApplying: boolean;
}) {
  return (
    <div
      className={cn(
        'p-4 rounded-xl border transition-all',
        decision === 'accepted' && 'border-emerald-500/30 bg-emerald-500/5',
        decision === 'rejected' && 'border-rose-500/30 bg-rose-500/5 opacity-50',
        decision === 'pending' && 'border-[var(--border)] bg-[var(--background-surface)]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)] truncate">
            {task?.title ?? `Task ${slot.taskId.slice(0, 8)}`}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-unjynx-violet">
              <Clock size={12} />
              <span className="font-mono">{slot.suggestedStart}</span>
              <span className="text-[var(--muted-foreground)]">→</span>
              <span className="font-mono">{slot.suggestedEnd}</span>
            </div>
          </div>

          <p className="text-xs text-[var(--muted-foreground)] mt-1.5 leading-relaxed">
            {slot.reason}
          </p>
        </div>

        {decision === 'pending' && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onAccept}
              disabled={isApplying}
              className="text-emerald-400 hover:bg-emerald-500/10"
              title="Accept"
            >
              {isApplying ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onReject}
              className="text-rose-400 hover:bg-rose-500/10"
              title="Reject"
            >
              <X size={14} />
            </Button>
          </div>
        )}

        {decision === 'accepted' && (
          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function AiSchedulePage() {
  const queryClient = useQueryClient();
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);
  const [decisions, setDecisions] = useState<Record<string, SlotDecision>>({});
  const [applyingId, setApplyingId] = useState<string | null>(null);

  // Fetch unscheduled tasks (no dueDate, not done)
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', 'unscheduled'],
    queryFn: () => getTasks({ status: 'todo', limit: 50 }),
    staleTime: 30_000,
  });

  const unscheduledTasks = (tasks ?? []).filter((t) => !t.dueDate && t.status !== 'done');

  // Schedule mutation
  const scheduleMutation = useMutation({
    mutationFn: (taskIds: string[]) => scheduleTasks(taskIds),
    onSuccess: (result) => {
      setScheduleResult(result);
      const initialDecisions: Record<string, SlotDecision> = {};
      for (const slot of result.schedule) {
        initialDecisions[slot.taskId] = 'pending';
      }
      setDecisions(initialDecisions);
    },
  });

  // Toggle task selection
  const toggleTask = useCallback((id: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Select all / deselect all
  const toggleAll = useCallback(() => {
    if (selectedTaskIds.size === unscheduledTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(unscheduledTasks.map((t) => t.id)));
    }
  }, [selectedTaskIds.size, unscheduledTasks]);

  // Request AI schedule
  const handleSchedule = useCallback(() => {
    const ids = Array.from(selectedTaskIds);
    if (ids.length === 0) return;
    scheduleMutation.mutate(ids);
  }, [selectedTaskIds, scheduleMutation]);

  // Accept a schedule slot — update task dueDate
  const handleAccept = useCallback(async (slot: ScheduleSlot) => {
    setApplyingId(slot.taskId);
    try {
      // Parse suggested time to create a dueDate
      const today = new Date().toISOString().slice(0, 10);
      await updateTask(slot.taskId, {
        dueDate: today,
        dueTime: slot.suggestedStart,
      });
      setDecisions((prev) => ({ ...prev, [slot.taskId]: 'accepted' }));
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch {
      // Keep as pending on error
    }
    setApplyingId(null);
  }, [queryClient]);

  // Reject a slot
  const handleReject = useCallback((taskId: string) => {
    setDecisions((prev) => ({ ...prev, [taskId]: 'rejected' }));
  }, []);

  // Accept all pending
  const handleAcceptAll = useCallback(async () => {
    if (!scheduleResult) return;
    for (const slot of scheduleResult.schedule) {
      if (decisions[slot.taskId] === 'pending') {
        await handleAccept(slot);
      }
    }
  }, [scheduleResult, decisions, handleAccept]);

  // Back to selection
  const handleReset = useCallback(() => {
    setScheduleResult(null);
    setDecisions({});
    setSelectedTaskIds(new Set());
  }, []);

  const tasksMap = new Map((tasks ?? []).map((t) => [t.id, t]));
  const pendingCount = Object.values(decisions).filter((d) => d === 'pending').length;
  const acceptedCount = Object.values(decisions).filter((d) => d === 'accepted').length;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ai" className="p-1.5 rounded-lg hover:bg-[var(--background-surface)] transition-colors">
          <ArrowLeft size={18} className="text-[var(--muted-foreground)]" />
        </Link>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-unjynx-violet to-blue-500 flex items-center justify-center shadow-lg shadow-unjynx-violet/20">
          <Calendar size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-outfit text-lg font-bold text-[var(--foreground)]">AI Auto-Schedule</h1>
          <p className="text-[10px] text-[var(--muted-foreground)]">Let AI find the best time for your tasks</p>
        </div>
      </div>

      {!scheduleResult ? (
        /* ─── Step 1: Select Tasks ──────────────────────── */
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-[var(--foreground)]">Unscheduled Tasks</h2>
              <Badge variant="outline" className="text-[10px]">{unscheduledTasks.length}</Badge>
            </div>
            {unscheduledTasks.length > 0 && (
              <button
                onClick={toggleAll}
                className="text-xs text-unjynx-violet hover:underline"
              >
                {selectedTaskIds.size === unscheduledTasks.length ? 'Deselect all' : 'Select all'}
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <Shimmer key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : unscheduledTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 size={40} className="mx-auto text-emerald-400 mb-3" />
              <p className="text-sm text-[var(--foreground)]">All tasks are scheduled!</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">Create new tasks or check your calendar.</p>
            </div>
          ) : (
            <div className="space-y-2 mb-6">
              {unscheduledTasks.map((task) => (
                <TaskSelectionCard
                  key={task.id}
                  task={task}
                  selected={selectedTaskIds.has(task.id)}
                  onToggle={() => toggleTask(task.id)}
                />
              ))}
            </div>
          )}

          {/* Schedule button */}
          {unscheduledTasks.length > 0 && (
            <Button
              onClick={handleSchedule}
              disabled={selectedTaskIds.size === 0 || scheduleMutation.isPending}
              className="w-full bg-gradient-to-r from-unjynx-violet to-blue-500 hover:opacity-90 transition-opacity"
              size="lg"
            >
              {scheduleMutation.isPending ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  AI is analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" />
                  Schedule {selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? 's' : ''} with AI
                </>
              )}
            </Button>
          )}

          {scheduleMutation.isError && (
            <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <AlertCircle size={14} className="text-rose-400 flex-shrink-0" />
              <p className="text-xs text-rose-300">
                {scheduleMutation.error instanceof Error ? scheduleMutation.error.message : 'Failed to schedule. Check your AI quota.'}
              </p>
            </div>
          )}
        </>
      ) : (
        /* ─── Step 2: Review Schedule ───────────────────── */
        <>
          {/* AI insights banner */}
          {scheduleResult.insights && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-unjynx-violet/10 to-blue-500/10 border border-unjynx-violet/20 mb-5">
              <div className="flex items-start gap-2">
                <Zap size={14} className="text-unjynx-violet mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[var(--foreground)] leading-relaxed">{scheduleResult.insights}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[var(--foreground)]">
              Suggested Schedule
              {acceptedCount > 0 && (
                <span className="text-emerald-400 ml-2">({acceptedCount} applied)</span>
              )}
            </h2>
            {pendingCount > 1 && (
              <Button variant="ghost" size="sm" onClick={handleAcceptAll} className="text-xs text-emerald-400">
                <Check size={12} className="mr-1" />
                Accept all
              </Button>
            )}
          </div>

          <div className="space-y-3 mb-6">
            {scheduleResult.schedule.map((slot) => (
              <ScheduleSlotCard
                key={slot.taskId}
                slot={slot}
                task={tasksMap.get(slot.taskId)}
                decision={decisions[slot.taskId] ?? 'pending'}
                onAccept={() => handleAccept(slot)}
                onReject={() => handleReject(slot.taskId)}
                isApplying={applyingId === slot.taskId}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              <ArrowLeft size={14} className="mr-1.5" />
              Back
            </Button>
            <Link href="/ai" className="flex-1">
              <Button variant="default" className="w-full">Done</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
