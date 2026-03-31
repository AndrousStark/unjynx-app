'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shimmer } from '@/components/ui/shimmer';
import { useVocabulary } from '@/lib/hooks/use-vocabulary';
import { useOrgStore } from '@/lib/store/org-store';
import { TaskTypeBadge } from '@/components/tasks/task-type-badge';
import {
  getSprints,
  getActiveSprint,
  getSprintTasks,
  createSprint,
  startSprint,
  completeSprint,
  addTaskToSprint,
  removeTaskFromSprint,
  getBurndown,
  getVelocity,
  saveRetro,
  type Sprint,
  type SprintTask,
  type BurndownEntry,
  type VelocityEntry,
} from '@/lib/api/sprints';
import { getTasks, type Task } from '@/lib/api/tasks';
import {
  Zap,
  Plus,
  Play,
  CheckCircle2,
  Target,
  Calendar,
  Loader2,
  ArrowRight,
  BarChart3,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';

// ─── Sprint Header ──────────────────────────────────────────────

function SprintHeader({
  sprint,
  onStart,
  onComplete,
  isStarting,
  isCompleting,
}: {
  readonly sprint: Sprint;
  readonly onStart: () => void;
  readonly onComplete: () => void;
  readonly isStarting: boolean;
  readonly isCompleting: boolean;
}) {
  const progress = sprint.committedPoints > 0
    ? Math.round((sprint.completedPoints / sprint.committedPoints) * 100)
    : 0;

  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background-surface)] mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-outfit text-lg font-bold text-[var(--foreground)]">{sprint.name}</h2>
            {sprint.goal && (
              <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                <Target size={10} /> {sprint.goal}
              </p>
            )}
          </div>
          <Badge variant="outline" className={cn(
            'text-[10px] px-2 py-0.5',
            sprint.status === 'active' ? 'text-emerald-400 border-emerald-400/30' :
            sprint.status === 'completed' ? 'text-blue-400 border-blue-400/30' :
            'text-[var(--muted-foreground)]',
          )}>
            {sprint.status}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {sprint.status === 'planning' && (
            <Button size="sm" onClick={onStart} disabled={isStarting}>
              {isStarting ? <Loader2 size={12} className="animate-spin mr-1" /> : <Play size={12} className="mr-1" />}
              Start Sprint
            </Button>
          )}
          {sprint.status === 'active' && (
            <Button size="sm" variant="outline" onClick={onComplete} disabled={isCompleting}>
              {isCompleting ? <Loader2 size={12} className="animate-spin mr-1" /> : <CheckCircle2 size={12} className="mr-1" />}
              Complete
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-emerald-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-medium text-[var(--foreground)]">
          {sprint.completedPoints}/{sprint.committedPoints} pts ({progress}%)
        </span>
      </div>

      {/* Dates */}
      {(sprint.startDate || sprint.endDate) && (
        <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--muted-foreground)]">
          <Calendar size={10} />
          {sprint.startDate && <span>Start: {new Date(sprint.startDate).toLocaleDateString()}</span>}
          {sprint.endDate && <span>End: {new Date(sprint.endDate).toLocaleDateString()}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Sprint Task Card ───────────────────────────────────────────

function SprintTaskCard({
  sprintTask,
  onRemove,
}: {
  readonly sprintTask: SprintTask;
  readonly onRemove: () => void;
}) {
  const { task } = sprintTask;
  const isDone = task.status === 'completed' || task.status === 'done';

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)]',
      'bg-[var(--card)] hover:border-[var(--accent)]/30 transition-colors',
      isDone && 'opacity-60',
    )}>
      {task.estimatePoints != null && (
        <span className="w-6 h-5 rounded bg-[var(--accent)]/10 flex items-center justify-center text-[10px] font-bold text-[var(--accent)]">
          {task.estimatePoints}
        </span>
      )}
      <TaskTypeBadge type={sprintTask.task.priority === 'urgent' ? 'bug' : 'task'} size="xs" />
      <span className={cn('text-sm text-[var(--foreground)] flex-1 truncate', isDone && 'line-through')}>{task.title}</span>
      <Badge variant="outline" className="text-[9px]">{task.status}</Badge>
      <button onClick={onRemove} className="text-[var(--muted-foreground)] hover:text-[var(--destructive)] text-xs">
        &times;
      </button>
    </div>
  );
}

// ─── Burndown Chart ─────────────────────────────────────────────

function BurndownChart({ data }: { readonly data: readonly BurndownEntry[] }) {
  if (data.length === 0) return <p className="text-xs text-[var(--muted-foreground)] text-center py-8">No burndown data yet. Start the sprint and check back tomorrow.</p>;

  const chartData = data.map((d, i) => ({
    day: `Day ${i + 1}`,
    remaining: d.remainingPoints,
    ideal: data[0].totalPoints - (data[0].totalPoints / Math.max(data.length, 1)) * i,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
          <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={0} stroke="var(--border)" />
          <Line type="monotone" dataKey="ideal" stroke="var(--muted-foreground)" strokeDasharray="5 5" dot={false} name="Ideal" />
          <Line type="monotone" dataKey="remaining" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} name="Actual" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Velocity Chart ─────────────────────────────────────────────

function VelocityChart({ data }: { readonly data: readonly VelocityEntry[] }) {
  if (data.length === 0) return <p className="text-xs text-[var(--muted-foreground)] text-center py-8">No completed sprints yet.</p>;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={[...data].reverse()}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
          <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="committed" fill="var(--accent)" opacity={0.5} name="Committed" radius={[4, 4, 0, 0]} />
          <Bar dataKey="completed" fill="var(--success)" name="Completed" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Create Sprint Modal ────────────────────────────────────────

function CreateSprintForm({
  projectId,
  onCreated,
}: {
  readonly projectId: string;
  readonly onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => createSprint({ projectId, name: name.trim(), goal: goal.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      setName('');
      setGoal('');
      onCreated();
    },
  });

  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background-surface)] space-y-3">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">New Sprint</h3>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Sprint name (e.g., Sprint 5)"
        className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--accent)]/50"
      />
      <input
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="Sprint goal (optional)"
        className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--accent)]/50"
      />
      <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>
        {mutation.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : <Plus size={12} className="mr-1" />}
        Create Sprint
      </Button>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function SprintsPage() {
  const t = useVocabulary();
  const { currentOrgId } = useOrgStore();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState<'board' | 'burndown' | 'velocity'>('board');

  // Use first project for now (TODO: project selector)
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => getTasks(),
    staleTime: 60_000,
  });

  const firstProjectId = tasks?.[0]?.projectId ?? null;

  const { data: sprints, isLoading } = useQuery({
    queryKey: ['sprints', firstProjectId],
    queryFn: () => getSprints(firstProjectId!),
    enabled: !!firstProjectId,
  });

  const activeSprint = sprints?.find((s) => s.status === 'active') ?? sprints?.find((s) => s.status === 'planning');

  const { data: sprintTasks } = useQuery({
    queryKey: ['sprint-tasks', activeSprint?.id],
    queryFn: () => getSprintTasks(activeSprint!.id),
    enabled: !!activeSprint,
  });

  const { data: burndownData } = useQuery({
    queryKey: ['burndown', activeSprint?.id],
    queryFn: () => getBurndown(activeSprint!.id),
    enabled: !!activeSprint && activeTab === 'burndown',
  });

  const { data: velocityData } = useQuery({
    queryKey: ['velocity', firstProjectId],
    queryFn: () => getVelocity(firstProjectId!, 10),
    enabled: !!firstProjectId && activeTab === 'velocity',
  });

  const startMutation = useMutation({
    mutationFn: () => startSprint(activeSprint!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sprints'] }),
  });

  const completeMutation = useMutation({
    mutationFn: () => completeSprint(activeSprint!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sprints'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (taskId: string) => removeTaskFromSprint(activeSprint!.id, taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sprint-tasks'] }),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4">
        <Shimmer className="h-32 rounded-xl mb-4" />
        <Shimmer className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/20">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-outfit text-lg font-bold text-[var(--foreground)]">{t('Section')}s</h1>
            <p className="text-[10px] text-[var(--muted-foreground)]">Manage sprint cycles and track velocity</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={12} className="mr-1" /> New Sprint
        </Button>
      </div>

      {showCreate && firstProjectId && (
        <CreateSprintForm projectId={firstProjectId} onCreated={() => setShowCreate(false)} />
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4">
        {(['board', 'burndown', 'velocity'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              activeTab === tab
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--background-surface)]',
            )}
          >
            {tab === 'board' ? 'Sprint Board' : tab === 'burndown' ? 'Burndown' : 'Velocity'}
          </button>
        ))}
      </div>

      {/* Active Sprint */}
      {activeSprint && (
        <SprintHeader
          sprint={activeSprint}
          onStart={() => startMutation.mutate()}
          onComplete={() => completeMutation.mutate()}
          isStarting={startMutation.isPending}
          isCompleting={completeMutation.isPending}
        />
      )}

      {/* Tab Content */}
      {activeTab === 'board' && (
        <div className="space-y-2">
          {!activeSprint ? (
            <div className="text-center py-16">
              <Zap size={40} className="mx-auto text-[var(--muted-foreground)] mb-3" />
              <p className="text-sm text-[var(--foreground)]">No sprints yet</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">Create your first sprint to start planning.</p>
            </div>
          ) : sprintTasks && sprintTasks.length > 0 ? (
            sprintTasks.map((st) => (
              <SprintTaskCard
                key={st.taskId}
                sprintTask={st}
                onRemove={() => removeMutation.mutate(st.taskId)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-[var(--muted-foreground)]">No tasks in this sprint. Add tasks from your backlog.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'burndown' && (
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <TrendingUp size={14} /> Sprint Burndown
          </h3>
          <BurndownChart data={burndownData ?? []} />
        </div>
      )}

      {activeTab === 'velocity' && (
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
            <BarChart3 size={14} /> Sprint Velocity
          </h3>
          <VelocityChart data={velocityData ?? []} />
        </div>
      )}

      {/* Sprint List */}
      {sprints && sprints.length > 1 && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">All Sprints</h3>
          <div className="space-y-1">
            {sprints.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--background-surface)] transition-colors">
                <div className="flex items-center gap-2">
                  <Zap size={12} className={s.status === 'active' ? 'text-emerald-400' : 'text-[var(--muted-foreground)]'} />
                  <span className="text-sm text-[var(--foreground)]">{s.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--muted-foreground)]">{s.completedPoints}/{s.committedPoints} pts</span>
                  <Badge variant="outline" className="text-[9px]">{s.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
