'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tree, type NodeRendererProps } from 'react-arborist';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shimmer } from '@/components/ui/shimmer';
import { useVocabulary } from '@/lib/hooks/use-vocabulary';
import {
  getGoalTree, createGoal, updateGoal,
  type GoalWithChildren, type Goal,
} from '@/lib/api/goals';
import {
  Target, Plus, ChevronRight, ChevronDown, User,
  Loader2, Check, Building2, Users, UserCircle,
  GripVertical,
} from 'lucide-react';

// ─── Status Config ───────────────────────────────────────────────

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

// ─── Tree Data Transformer ──────────────────────────────────────

interface TreeGoal {
  readonly id: string;
  readonly name: string;
  readonly children?: readonly TreeGoal[];
  readonly goal: GoalWithChildren;
}

function goalsToTreeData(goals: readonly GoalWithChildren[]): TreeGoal[] {
  return goals.map((g) => ({
    id: g.id,
    name: g.title,
    children: g.children.length > 0
      ? g.children.map((child) => ({
          id: child.id,
          name: child.title,
          children: [],
          goal: { ...child, children: [], ownerName: null, progressPercent: 0 },
        }))
      : undefined,
    goal: g,
  }));
}

// ─── Tree Node Renderer ─────────────────────────────────────────

function GoalNode({ node, style, dragHandle }: NodeRendererProps<TreeGoal>) {
  const goal = node.data.goal;
  const status = STATUS_CONFIG[goal.status] ?? STATUS_CONFIG.on_track;
  const LevelIcon = LEVEL_ICONS[goal.level] ?? Target;
  const progress = goal.progressPercent ?? 0;

  return (
    <div
      style={style}
      ref={dragHandle}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer group',
        'hover:bg-[var(--background-surface)] transition-colors',
        node.isSelected && 'bg-[var(--accent)]/5 ring-1 ring-[var(--accent)]/20',
      )}
      onClick={() => node.toggle()}
    >
      {/* Drag handle */}
      <GripVertical
        size={12}
        className="flex-shrink-0 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* Expand/collapse arrow */}
      {node.isInternal ? (
        <button
          onClick={(e) => { e.stopPropagation(); node.toggle(); }}
          className="flex-shrink-0 p-0.5"
        >
          {node.isOpen ? (
            <ChevronDown size={14} className="text-[var(--muted-foreground)]" />
          ) : (
            <ChevronRight size={14} className="text-[var(--muted-foreground)]" />
          )}
        </button>
      ) : (
        <div className="w-5 flex-shrink-0" />
      )}

      {/* Level icon */}
      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', status.bg)}>
        <LevelIcon size={14} className={status.color} />
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-[var(--foreground)] truncate">{goal.title}</span>
          <Badge variant="outline" className={cn('text-[9px] px-1 py-0 h-4', status.color, status.bg)}>
            {status.label}
          </Badge>
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 text-[var(--muted-foreground)] capitalize">
            {goal.level}
          </Badge>
        </div>
      </div>

      {/* Progress bar */}
      <div className="hidden sm:flex items-center gap-2 flex-shrink-0 w-32">
        <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500',
              progress >= 100 ? 'bg-[var(--success)]' :
              progress >= 50 ? 'bg-[var(--accent)]' : 'bg-[var(--warning)]',
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <span className="text-[10px] font-medium text-[var(--muted-foreground)] w-8 text-right">
          {progress}%
        </span>
      </div>

      {/* Owner */}
      {goal.ownerName && (
        <span className="hidden md:flex items-center gap-1 text-[10px] text-[var(--muted-foreground)] flex-shrink-0">
          <User size={10} />{goal.ownerName}
        </span>
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
        onKeyDown={(e) => e.key === 'Enter' && title.trim() && mutation.mutate()}
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

  const treeData = useMemo(() => {
    if (!goalTree) return [];
    return goalsToTreeData(goalTree);
  }, [goalTree]);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 animate-fade-in">
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
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => <Shimmer key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : treeData.length === 0 ? (
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
        <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--card)]">
          <Tree
            data={treeData}
            openByDefault={true}
            width="100%"
            height={Math.min(treeData.length * 48 + 100, 600)}
            rowHeight={44}
            indent={24}
            paddingTop={8}
            paddingBottom={8}
          >
            {GoalNode}
          </Tree>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-[10px] text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1"><Building2 size={10} /> Company</span>
        <span className="flex items-center gap-1"><Users size={10} /> Team</span>
        <span className="flex items-center gap-1"><UserCircle size={10} /> Individual</span>
        <span className="ml-auto">Drag to reorder &bull; Click to expand</span>
      </div>
    </div>
  );
}
