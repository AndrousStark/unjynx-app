'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shimmer } from '@/components/ui/shimmer';
import { apiClient } from '@/lib/api/client';
import {
  Sparkles,
  Sun,
  Moon,
  Clock,
  Check,
  ChevronRight,
  ArrowRight,
  SkipForward,
  Calendar,
  Target,
  Trophy,
  Loader2,
  Zap,
  CheckCircle2,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────

interface TaskSuggestion {
  id: string;
  title: string;
  priority: string;
  dueDate: string | null;
  score: number;
  estimatedMinutes: number;
  isOverdue: boolean;
}

interface PlanBlock {
  taskId: string;
  taskTitle: string;
  priority: string;
  startTime: string;
  endTime: string;
  estimatedMinutes: number;
  status: 'pending' | 'active' | 'completed' | 'skipped' | 'carried';
  position: number;
}

interface DailyPlan {
  blocks: PlanBlock[];
  totalPlannedMinutes: number;
  totalCompletedMinutes: number;
  accuracy: number;
  status: string;
}

interface YesterdaySummary {
  tasksPlanned: number;
  tasksCompleted: number;
  accuracy: number;
  carriedForward: { id: string; title: string; priority: string }[];
}

// ─── API ────────────────────────────────────────────────────────

function getYesterday(): Promise<YesterdaySummary> {
  return apiClient.get('/api/v1/planning/yesterday');
}

function getSuggestions(): Promise<{ tasks: TaskSuggestion[]; availableMinutes: number; mits: string[] }> {
  return apiClient.get('/api/v1/planning/suggestions');
}

function generateSchedule(tasks: { id: string; title: string; priority: string; estimatedMinutes: number }[]): Promise<{ blocks: PlanBlock[] }> {
  return apiClient.post('/api/v1/planning/generate', { tasks });
}

function commitPlan(blocks: PlanBlock[]): Promise<DailyPlan> {
  return apiClient.post('/api/v1/planning/commit', { blocks, mode: 'guided' });
}

function getTodayPlan(): Promise<DailyPlan | null> {
  return apiClient.get('/api/v1/planning/today');
}

function completeBlock(taskId: string): Promise<DailyPlan> {
  return apiClient.post('/api/v1/planning/complete-block', { taskId });
}

function skipBlock(taskId: string): Promise<DailyPlan> {
  return apiClient.post('/api/v1/planning/skip-block', { taskId });
}

// ─── Priority Colors ────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  none: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

// ─── Planning Steps ─────────────────────────────────────────────

type PlanStep = 'review' | 'select' | 'schedule' | 'active' | 'done';

export default function PlanPage() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<PlanStep>('review');
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [estimates, setEstimates] = useState<Record<string, number>>({});

  // Check if there's already an active plan
  const { data: existingPlan } = useQuery({
    queryKey: ['planning', 'today'],
    queryFn: getTodayPlan,
    staleTime: 30_000,
  });

  // Yesterday's summary
  const { data: yesterday, isLoading: loadingYesterday } = useQuery({
    queryKey: ['planning', 'yesterday'],
    queryFn: getYesterday,
    staleTime: 60_000,
  });

  // Task suggestions
  const { data: suggestions, isLoading: loadingSuggestions } = useQuery({
    queryKey: ['planning', 'suggestions'],
    queryFn: getSuggestions,
    staleTime: 30_000,
    enabled: step === 'select',
  });

  // Generate schedule
  const scheduleMutation = useMutation({
    mutationFn: () => {
      const selected = (suggestions?.tasks ?? [])
        .filter((t) => selectedTaskIds.has(t.id))
        .map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          estimatedMinutes: estimates[t.id] ?? t.estimatedMinutes,
        }));
      return generateSchedule(selected);
    },
    onSuccess: () => setStep('schedule'),
  });

  // Commit plan
  const commitMutation = useMutation({
    mutationFn: () => commitPlan(scheduleMutation.data?.blocks ?? []),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planning'] });
      setStep('active');
    },
  });

  // Complete/skip block
  const completeMutation = useMutation({
    mutationFn: (taskId: string) => completeBlock(taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['planning', 'today'] }),
  });

  const skipMutation = useMutation({
    mutationFn: (taskId: string) => skipBlock(taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['planning', 'today'] }),
  });

  // If there's already an active plan, show it
  const activePlan = existingPlan ?? (step === 'active' ? commitMutation.data : null);

  const toggleTask = useCallback((id: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const hour = new Date().getHours();
  const isEvening = hour >= 17;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shadow-lg',
          isEvening
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20'
            : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/20',
        )}>
          {isEvening ? <Moon size={20} className="text-white" /> : <Sun size={20} className="text-white" />}
        </div>
        <div>
          <h1 className="font-outfit text-lg font-bold text-[var(--foreground)]">
            {isEvening ? 'Evening Review' : 'Plan Your Day'}
          </h1>
          <p className="text-[10px] text-[var(--muted-foreground)]">
            {isEvening ? 'Review today, prepare for tomorrow' : 'AI-guided daily planning ritual'}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      {!activePlan && (
        <div className="flex items-center gap-1 mb-6">
          {(['review', 'select', 'schedule'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                step === s
                  ? 'bg-unjynx-violet text-white'
                  : (['review', 'select', 'schedule'].indexOf(step) > i)
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[var(--background-surface)] text-[var(--muted-foreground)]',
              )}>
                {(['review', 'select', 'schedule'].indexOf(step) > i) ? <Check size={14} /> : i + 1}
              </div>
              {i < 2 && <div className={cn('flex-1 h-0.5 rounded', step === s || ['review', 'select', 'schedule'].indexOf(step) > i ? 'bg-unjynx-violet/30' : 'bg-[var(--border)]')} />}
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Yesterday Review */}
      {step === 'review' && !activePlan && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Yesterday's Summary</h2>

          {loadingYesterday ? (
            <div className="space-y-3">
              <Shimmer className="h-24 rounded-xl" />
              <Shimmer className="h-16 rounded-xl" />
            </div>
          ) : (
            <>
              <div className="p-4 rounded-xl bg-gradient-to-r from-unjynx-violet/10 to-amber-500/10 border border-unjynx-violet/20">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-[var(--foreground)]">{yesterday?.tasksCompleted ?? 0}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--foreground)]">{yesterday?.tasksPlanned ?? 0}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">Planned</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--foreground)]">{yesterday?.accuracy ?? 0}%</p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">Accuracy</p>
                  </div>
                </div>
              </div>

              {yesterday?.carriedForward && yesterday.carriedForward.length > 0 && (
                <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <p className="text-xs font-medium text-amber-400 mb-2">
                    {yesterday.carriedForward.length} task{yesterday.carriedForward.length !== 1 ? 's' : ''} carried forward
                  </p>
                  {yesterday.carriedForward.slice(0, 3).map((t) => (
                    <p key={t.id} className="text-xs text-[var(--foreground)] ml-3">
                      • {t.title}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}

          <Button onClick={() => setStep('select')} className="w-full" size="lg">
            <ArrowRight size={16} className="mr-2" />
            Select today&apos;s tasks
          </Button>
        </div>
      )}

      {/* Step 2: Select Tasks */}
      {step === 'select' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Select tasks for today
              <span className="text-[var(--muted-foreground)] ml-1 font-normal">
                ({selectedTaskIds.size} selected)
              </span>
            </h2>
            {suggestions && (
              <Badge variant="outline" className="text-[10px]">
                ~{suggestions.availableMinutes}min available
              </Badge>
            )}
          </div>

          {/* MIT Highlight */}
          {suggestions?.mits && suggestions.mits.length > 0 && (
            <div className="p-3 rounded-xl border border-unjynx-violet/20 bg-unjynx-violet/5">
              <div className="flex items-center gap-1.5 mb-1">
                <Target size={12} className="text-unjynx-violet" />
                <span className="text-[10px] font-medium text-unjynx-violet">Most Important Tasks (MITs)</span>
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)]">
                Focus on these first for maximum impact
              </p>
            </div>
          )}

          {loadingSuggestions ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, i) => <Shimmer key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {(suggestions?.tasks ?? []).map((task) => {
                const isMIT = suggestions?.mits?.includes(task.id);
                return (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                      selectedTaskIds.has(task.id)
                        ? 'border-unjynx-violet/50 bg-unjynx-violet/5'
                        : 'border-[var(--border)] hover:border-unjynx-violet/30',
                      isMIT && !selectedTaskIds.has(task.id) && 'ring-1 ring-unjynx-violet/20',
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                      selectedTaskIds.has(task.id) ? 'bg-unjynx-violet border-unjynx-violet' : 'border-[var(--border)]',
                    )}>
                      {selectedTaskIds.has(task.id) && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-[var(--foreground)] truncate">{task.title}</p>
                        {isMIT && <Zap size={10} className="text-unjynx-violet flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 h-4', PRIORITY_COLORS[task.priority])}>
                          {task.priority}
                        </Badge>
                        <span className="text-[10px] text-[var(--muted-foreground)]">
                          ~{task.estimatedMinutes}min
                        </span>
                        {task.isOverdue && (
                          <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">overdue</Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <Button
            onClick={() => scheduleMutation.mutate()}
            disabled={selectedTaskIds.size === 0 || scheduleMutation.isPending}
            className="w-full bg-gradient-to-r from-unjynx-violet to-blue-500"
            size="lg"
          >
            {scheduleMutation.isPending ? (
              <><Loader2 size={16} className="mr-2 animate-spin" />Generating schedule...</>
            ) : (
              <><Sparkles size={16} className="mr-2" />Schedule {selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? 's' : ''}</>
            )}
          </Button>
        </div>
      )}

      {/* Step 3: Review Schedule */}
      {step === 'schedule' && scheduleMutation.data && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Your Schedule</h2>

          <div className="space-y-2">
            {scheduleMutation.data.blocks.map((block) => (
              <div key={block.taskId} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--background-surface)]">
                <div className="text-center flex-shrink-0 w-16">
                  <p className="text-xs font-mono text-unjynx-violet">{block.startTime}</p>
                  <p className="text-[9px] text-[var(--muted-foreground)]">to {block.endTime}</p>
                </div>
                <div className="w-px h-10 bg-unjynx-violet/30" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--foreground)] truncate">{block.taskTitle}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 h-4', PRIORITY_COLORS[block.priority])}>
                      {block.priority}
                    </Badge>
                    <span className="text-[10px] text-[var(--muted-foreground)]">{block.estimatedMinutes}min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => commitMutation.mutate()}
            disabled={commitMutation.isPending}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-500"
            size="lg"
          >
            {commitMutation.isPending ? (
              <><Loader2 size={16} className="mr-2 animate-spin" />Activating...</>
            ) : (
              <><CheckCircle2 size={16} className="mr-2" />Lock in &amp; start my day</>
            )}
          </Button>
        </div>
      )}

      {/* Active Plan */}
      {(activePlan || step === 'active') && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Today&apos;s Plan</h2>
            {activePlan && (
              <Badge variant="outline" className="text-[10px]">
                {activePlan.accuracy}% complete
              </Badge>
            )}
          </div>

          {/* Progress bar */}
          {activePlan && (
            <div className="h-2 rounded-full bg-[var(--background-surface)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-unjynx-violet to-emerald-500 transition-all duration-500"
                style={{ width: `${activePlan.accuracy}%` }}
              />
            </div>
          )}

          <div className="space-y-2">
            {(activePlan?.blocks ?? []).map((block) => (
              <div
                key={block.taskId}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all',
                  block.status === 'completed' && 'border-emerald-500/30 bg-emerald-500/5 opacity-70',
                  block.status === 'skipped' && 'border-rose-500/30 bg-rose-500/5 opacity-40',
                  block.status === 'pending' && 'border-[var(--border)] bg-[var(--background-surface)]',
                )}
              >
                <div className="text-center flex-shrink-0 w-14">
                  <p className="text-xs font-mono text-[var(--muted-foreground)]">{block.startTime}</p>
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm truncate',
                    block.status === 'completed' ? 'line-through text-[var(--muted-foreground)]' : 'text-[var(--foreground)]',
                  )}>
                    {block.taskTitle}
                  </p>
                </div>

                {block.status === 'pending' && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => completeMutation.mutate(block.taskId)}
                      className="text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <Check size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => skipMutation.mutate(block.taskId)}
                      className="text-[var(--muted-foreground)] hover:bg-rose-500/10"
                    >
                      <SkipForward size={14} />
                    </Button>
                  </div>
                )}

                {block.status === 'completed' && (
                  <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* All done */}
          {activePlan && activePlan.accuracy === 100 && (
            <div className="text-center py-6 animate-scale-in">
              <Trophy size={40} className="mx-auto text-unjynx-gold mb-3" />
              <h3 className="font-outfit font-bold text-lg text-[var(--foreground)]">Perfect day!</h3>
              <p className="text-sm text-[var(--muted-foreground)]">Every task completed. You crushed it.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
