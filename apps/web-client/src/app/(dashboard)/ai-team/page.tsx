'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shimmer } from '@/components/ui/shimmer';
import {
  getStandup, getRisks, suggestAssignee, getAiCost,
  type StandupSummary, type RiskReport, type AssignmentSuggestion, type AiCostSummary,
} from '@/lib/api/ai-team';
import {
  Sparkles, AlertTriangle, CheckCircle2, Clock, Users,
  TrendingUp, Shield, Zap, Brain, BarChart3,
  ChevronRight, User, Target,
} from 'lucide-react';

// ─── Tab Types ───────────────────────────────────────────────────

type AiTab = 'standup' | 'risks' | 'assign' | 'cost';

const TABS: readonly { id: AiTab; label: string; icon: React.ElementType }[] = [
  { id: 'standup', label: 'Daily Standup', icon: Sparkles },
  { id: 'risks', label: 'Risk Detection', icon: AlertTriangle },
  { id: 'assign', label: 'Smart Assign', icon: Users },
  { id: 'cost', label: 'AI Usage', icon: BarChart3 },
];

// ─── Risk Level Badge ────────────────────────────────────────────

const RISK_COLORS: Record<string, { color: string; bg: string }> = {
  low: { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10' },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/10' },
  critical: { color: 'text-red-400', bg: 'bg-red-500/10' },
};

// ─── Standup Tab ─────────────────────────────────────────────────

function StandupTab({ data }: { readonly data: StandupSummary }) {
  return (
    <div className="space-y-4">
      {/* AI Summary */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[var(--accent)]/10 to-[var(--gold)]/10 border border-[var(--accent)]/20">
        <div className="flex items-start gap-2">
          <Sparkles size={14} className="text-[var(--accent)] mt-0.5 flex-shrink-0" />
          <p className="text-sm text-[var(--foreground)] leading-relaxed">{data.aiSummary}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Completed Yesterday */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={14} className="text-[var(--success)]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Completed Yesterday</h3>
          </div>
          {data.completedYesterday.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)]">No tasks completed</p>
          ) : (
            <ul className="space-y-1.5">
              {data.completedYesterday.map((t, i) => (
                <li key={i} className="text-xs text-[var(--foreground)] flex items-start gap-1.5">
                  <CheckCircle2 size={10} className="text-[var(--success)] mt-0.5 flex-shrink-0" />
                  <span className="truncate">{t.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* In Progress Today */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-[var(--accent)]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">In Progress Today</h3>
          </div>
          {data.inProgressToday.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)]">No tasks in progress</p>
          ) : (
            <ul className="space-y-1.5">
              {data.inProgressToday.map((t, i) => (
                <li key={i} className="text-xs text-[var(--foreground)] flex items-start gap-1.5">
                  <Clock size={10} className="text-[var(--accent)] mt-0.5 flex-shrink-0" />
                  <span className="truncate">{t.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Blockers */}
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-[var(--destructive)]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Blockers</h3>
          </div>
          {data.blockers.length === 0 ? (
            <p className="text-xs text-[var(--success)]">No blockers!</p>
          ) : (
            <ul className="space-y-1.5">
              {data.blockers.map((t, i) => (
                <li key={i} className="text-xs text-[var(--destructive)] flex items-start gap-1.5">
                  <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="truncate block text-[var(--foreground)]">{t.title}</span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">{t.reason}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="text-[10px] text-[var(--muted-foreground)] text-center">
        {data.memberCount} team members &bull; Generated for {data.date}
      </p>
    </div>
  );
}

// ─── Risks Tab ───────────────────────────────────────────────────

function RisksTab({ data }: { readonly data: RiskReport }) {
  const risk = RISK_COLORS[data.riskLevel] ?? RISK_COLORS.low;

  return (
    <div className="space-y-4">
      {/* Risk level banner */}
      <div className={cn('p-4 rounded-xl border', risk.bg, `border-current/20`)}>
        <div className="flex items-center gap-3">
          <Shield size={20} className={risk.color} />
          <div>
            <p className={cn('text-sm font-bold uppercase', risk.color)}>Risk Level: {data.riskLevel}</p>
            <p className="text-xs text-[var(--foreground)] mt-0.5">{data.aiInsight}</p>
          </div>
        </div>
      </div>

      {/* Overdue */}
      {data.overdueTasks.length > 0 && (
        <Section title="Overdue Tasks" icon={AlertTriangle} color="text-[var(--destructive)]" count={data.overdueTasks.length}>
          {data.overdueTasks.map((t) => (
            <TaskItem key={t.id} title={t.title} meta={`Due: ${new Date(t.dueDate).toLocaleDateString()}`} />
          ))}
        </Section>
      )}

      {/* Stale */}
      {data.staleTasks.length > 0 && (
        <Section title="Stale Tasks (7+ days)" icon={Clock} color="text-[var(--warning)]" count={data.staleTasks.length}>
          {data.staleTasks.map((t) => (
            <TaskItem key={t.id} title={t.title} meta={`${t.daysSinceUpdate} days since last update`} />
          ))}
        </Section>
      )}

      {/* Unassigned */}
      {data.unassignedHighPriority.length > 0 && (
        <Section title="Unassigned High Priority" icon={User} color="text-[var(--accent)]" count={data.unassignedHighPriority.length}>
          {data.unassignedHighPriority.map((t) => (
            <TaskItem key={t.id} title={t.title} meta={t.priority} />
          ))}
        </Section>
      )}

      {data.overdueTasks.length === 0 && data.staleTasks.length === 0 && data.unassignedHighPriority.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle2 size={40} className="mx-auto text-[var(--success)] mb-3" />
          <p className="text-sm text-[var(--foreground)]">All clear! No risks detected.</p>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, color, count, children }: {
  readonly title: string; readonly icon: React.ElementType; readonly color: string;
  readonly count: number; readonly children: React.ReactNode;
}) {
  return (
    <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={color} />
        <span className="text-xs font-semibold text-[var(--foreground)]">{title}</span>
        <Badge variant="outline" className="text-[9px] h-4">{count}</Badge>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function TaskItem({ title, meta }: { readonly title: string; readonly meta: string }) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[var(--background-surface)] transition-colors">
      <span className="text-xs text-[var(--foreground)] truncate flex-1">{title}</span>
      <span className="text-[10px] text-[var(--muted-foreground)] ml-2 flex-shrink-0">{meta}</span>
    </div>
  );
}

// ─── Smart Assign Tab ────────────────────────────────────────────

function AssignTab() {
  const [taskTitle, setTaskTitle] = useState('');

  const mutation = useMutation({
    mutationFn: () => suggestAssignee(taskTitle.trim()),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          placeholder="Enter task title to get assignment suggestions..."
          className="flex-1 px-3 py-2 rounded-lg bg-[var(--background-surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--accent)]/50"
          onKeyDown={(e) => e.key === 'Enter' && taskTitle.trim() && mutation.mutate()}
        />
        <Button size="sm" onClick={() => mutation.mutate()} disabled={!taskTitle.trim() || mutation.isPending}>
          <Brain size={12} className="mr-1" /> Suggest
        </Button>
      </div>

      {mutation.data && (mutation.data as readonly AssignmentSuggestion[]).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Suggested Assignees</h3>
          {(mutation.data as readonly AssignmentSuggestion[]).map((s, i) => (
            <div key={s.userId} className={cn(
              'flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]',
              i === 0 && 'border-[var(--accent)]/30 bg-[var(--accent)]/5',
            )}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center text-white text-xs font-bold">
                {(s.userName ?? 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">{s.userName ?? s.userId.slice(0, 8)}</span>
                  {i === 0 && <Badge className="text-[9px] bg-[var(--accent)] text-white">Best Match</Badge>}
                </div>
                <p className="text-[10px] text-[var(--muted-foreground)]">{s.reason}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[var(--accent)]">{Math.round(s.confidence * 100)}%</p>
                <p className="text-[9px] text-[var(--muted-foreground)]">{s.currentTaskCount} tasks</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Cost Tab ────────────────────────────────────────────────────

function CostTab({ data }: { readonly data: AiCostSummary }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <p className="text-[10px] text-[var(--muted-foreground)] uppercase">Operations (30d)</p>
          <p className="text-2xl font-bold text-[var(--foreground)]">{data.totalOperations}</p>
        </div>
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <p className="text-[10px] text-[var(--muted-foreground)] uppercase">Tokens Used (30d)</p>
          <p className="text-2xl font-bold text-[var(--foreground)]">{data.totalTokens.toLocaleString()}</p>
        </div>
      </div>

      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">By Operation Type</h3>
      <div className="space-y-1">
        {Object.entries(data.byType).map(([type, count]) => (
          <div key={type} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--background-surface)]">
            <span className="text-xs text-[var(--foreground)] capitalize">{type.replace(/_/g, ' ')}</span>
            <span className="text-xs font-medium text-[var(--accent)]">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export default function AiTeamPage() {
  const [activeTab, setActiveTab] = useState<AiTab>('standup');

  const { data: standup, isLoading: loadingStandup } = useQuery({
    queryKey: ['ai-standup'],
    queryFn: getStandup,
    staleTime: 60_000,
    enabled: activeTab === 'standup',
  });

  const { data: risks, isLoading: loadingRisks } = useQuery({
    queryKey: ['ai-risks'],
    queryFn: getRisks,
    staleTime: 60_000,
    enabled: activeTab === 'risks',
  });

  const { data: cost, isLoading: loadingCost } = useQuery({
    queryKey: ['ai-cost'],
    queryFn: getAiCost,
    staleTime: 60_000,
    enabled: activeTab === 'cost',
  });

  const isLoading = (activeTab === 'standup' && loadingStandup) || (activeTab === 'risks' && loadingRisks) || (activeTab === 'cost' && loadingCost);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-pink-500 flex items-center justify-center shadow-lg shadow-[var(--accent)]/20">
          <Brain size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-outfit text-lg font-bold text-[var(--foreground)]">AI Team Intelligence</h1>
          <p className="text-[10px] text-[var(--muted-foreground)]">Standup summaries, risk detection, smart assignment</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-6 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                activeTab === tab.id ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted-foreground)] hover:bg-[var(--background-surface)]',
              )}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          <Shimmer className="h-20 rounded-xl" />
          <div className="grid grid-cols-3 gap-3">
            <Shimmer className="h-40 rounded-xl" />
            <Shimmer className="h-40 rounded-xl" />
            <Shimmer className="h-40 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'standup' && standup && <StandupTab data={standup} />}
          {activeTab === 'risks' && risks && <RisksTab data={risks} />}
          {activeTab === 'assign' && <AssignTab />}
          {activeTab === 'cost' && cost && <CostTab data={cost} />}
        </>
      )}
    </div>
  );
}
