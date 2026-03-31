'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shimmer } from '@/components/ui/shimmer';
import { useVocabulary } from '@/lib/hooks/use-vocabulary';
import {
  getGoalTree, createGoal, updateGoal, getGoalTasks,
  type GoalWithChildren, type Goal,
} from '@/lib/api/goals';
import {
  Target, Plus, ChevronRight, ChevronDown, User,
  Loader2, Check, AlertTriangle, X, TrendingUp,
  Building2, Users, UserCircle,
} from 'lucide-react';

// ─── Status Badge ────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  on_track: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'On Track' },
  at_risk: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'At Risk' },
  behind: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Behind' },
  completed: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Completed' },
  cancelled: { color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Cancelled' },
};

const LEVEL_ICONS: Record<string, React.ElementType> = {
  company: Building2,
  team: Users,
  individual: UserCircle,
};

// ─── Goal Card ───────────────────────────────────────────────────

function GoalCard({
  goal,
  depth = 0,
  onStatusChange,
}: {
  readonly goal: GoalWithChildren;
  readonly depth?: number;
  readonly onStatusChange: (id: string, status: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = goal.children.length > 0;
  const status = STATUS_CONFIG[goal.status] ?? STATUS_CONFIG.on_track;
  const LevelIcon = LEVEL_ICONS[goal.level] ?? Target;

  return (
    <div className={cn('ml-0', depth > 0 && 'ml-6 border-l-2 border-[var(--border)] pl-4')}>
      <div className={cn(
        'p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]',
        'hover:border-[var(--accent)]/30 transition-colors mb-2',
      )}>
        <div className="flex items-start gap-3">
          {/* Expand toggle */}
          {hasChildren ? (
            <button onClick={() => setExpanded(!expanded)} className="mt-1 p-0.5 rounded hover:bg-[var(--background-surface)]">
              {expanded ? <ChevronDown size={14} className="text-[var(--muted-foreground)]" /> : <ChevronRight size={14} className="text-[var(--muted-foreground)]" />}
            </button>
          ) : (
            <div className="w-5" />
          )}

          {/* Level icon */}
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', status.bg)}>
            <LevelIcon size={14} className={status.color} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">{goal.title}</h3>
              <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 h-4', status.color, status.bg)}>
                {status.label}
              </Badge>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-[var(--muted-foreground)]">
                {goal.level}
              </Badge>
            </div>

            {goal.description && (
              <p className="text-xs text-[var(--muted-foreground)] line-clamp-1 mb-2">{goal.description}</p>
            )}

            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500',
                    goal.progressPercent >= 100 ? 'bg-[var(--success)]' :
                    goal.progressPercent >= 50 ? 'bg-[var(--accent)]' :
                    'bg-[var(--warning)]',
                  )}
                  style={{ width: `${Math.min(goal.progressPercent, 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-[var(--foreground)] w-10 text-right">
                {goal.progressPercent}%
              </span>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[var(--muted-foreground)]">
              {goal.ownerName && (
                <span className="flex items-center gap-1"><User size={10} />{goal.ownerName}</span>
              )}
              {goal.dueDate && (
                <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
              )}
              {goal.targetValue && (
                <span>{goal.currentValue}/{goal.targetValue} {goal.unit}</span>
              )}
              {hasChildren && (
                <span>{goal.children.length} sub-goals</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="animate-fade-in">
          {goal.children.map((child) => (
            <GoalCard
              key={child.id}
              goal={{ ...child, children: [], ownerName: null, progressPercent: 0 }}
              depth={depth + 1}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Create Goal Form ────────────────────────────────────────────

function CreateGoalForm({ onCreated }: { readonly onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState<'company' | 'team' | 'individual'>('individual');
  const [target, setTarget] = useState('100');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => createGoal({ title: title.trim(), level, targetValue: target, unit: '%' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-tree'] });
      setTitle('');
      onCreated();
    },
  });

  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background-surface)] mb-4 space-y-3 animate-fade-in">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">New Goal</h3>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What do you want to achieve?"
        className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--accent)]/50"
        autoFocus
      />
      <div className="flex items-center gap-2">
        {(['company', 'team', 'individual'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
              level === l ? 'bg-[var(--accent)] text-white' : 'bg-[var(--background)] text-[var(--muted-foreground)] border border-[var(--border)]',
            )}
          >
            {l}
          </button>
        ))}
      </div>
      <Button size="sm" onClick={() => mutation.mutate()} disabled={!title.trim() || mutation.isPending}>
        {mutation.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : <Plus size={12} className="mr-1" />}
        Create Goal
      </Button>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export default function GoalsPage() {
  const t = useVocabulary();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: goalTree, isLoading } = useQuery({
    queryKey: ['goal-tree'],
    queryFn: getGoalTree,
    staleTime: 60_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateGoal(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goal-tree'] }),
  });

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/20">
            <Target size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-outfit text-lg font-bold text-[var(--foreground)]">Goals &amp; OKRs</h1>
            <p className="text-[10px] text-[var(--muted-foreground)]">Company &rarr; Team &rarr; Individual goal hierarchy</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={12} className="mr-1" /> New Goal
        </Button>
      </div>

      {showCreate && <CreateGoalForm onCreated={() => setShowCreate(false)} />}

      {/* Goal Tree */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => <Shimmer key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : !goalTree || goalTree.length === 0 ? (
        <div className="text-center py-16">
          <Target size={48} className="mx-auto text-[var(--muted-foreground)] mb-4" />
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1">No goals yet</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Create your first goal to start tracking progress.
          </p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={14} className="mr-1.5" /> Create a Goal
          </Button>
        </div>
      ) : (
        <div className="space-y-1">
          {goalTree.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
