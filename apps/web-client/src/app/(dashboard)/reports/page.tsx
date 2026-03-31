'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { Shimmer } from '@/components/ui/shimmer';
import { Badge } from '@/components/ui/badge';
import { useVocabulary } from '@/lib/hooks/use-vocabulary';
import {
  getVelocity, getCycleTime, getWorkload, getSlaCompliance, getOrgSummary,
  type VelocityData, type CycleTimeData, type WorkloadData, type SlaComplianceData, type OrgSummary,
} from '@/lib/api/reports';
import {
  BarChart3, TrendingUp, Users, Shield, LayoutDashboard,
  CheckCircle2, AlertTriangle, Clock, Target,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ─── Tab Types ───────────────────────────────────────────────────

type ReportTab = 'summary' | 'velocity' | 'cycle_time' | 'workload' | 'sla';

const TABS: readonly { id: ReportTab; label: string; icon: React.ElementType }[] = [
  { id: 'summary', label: 'Summary', icon: LayoutDashboard },
  { id: 'velocity', label: 'Velocity', icon: TrendingUp },
  { id: 'cycle_time', label: 'Cycle Time', icon: Clock },
  { id: 'workload', label: 'Workload', icon: Users },
  { id: 'sla', label: 'SLA', icon: Shield },
];

// ─── Summary Tab ─────────────────────────────────────────────────

function SummaryTab({ data }: { readonly data: OrgSummary }) {
  const stats = [
    { label: 'Total Tasks', value: data.totalTasks, icon: Target, color: 'text-[var(--accent)]' },
    { label: 'Completed', value: data.completedTasks, icon: CheckCircle2, color: 'text-[var(--success)]' },
    { label: 'Overdue', value: data.overdueTasks, icon: AlertTriangle, color: 'text-[var(--destructive)]' },
    { label: 'Active Members', value: data.activeMembers, icon: Users, color: 'text-[var(--gold)]' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className={s.color} />
                <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Completion Rate */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-[var(--foreground)]">Completion Rate</span>
          <span className="text-2xl font-bold text-[var(--accent)]">{data.completionRate}%</span>
        </div>
        <div className="h-3 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--success)] transition-all duration-700"
            style={{ width: `${data.completionRate}%` }}
          />
        </div>
      </div>

      {/* This Week */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-1">Created This Week</p>
          <p className="text-xl font-bold text-[var(--foreground)]">{data.tasksCreatedThisWeek}</p>
        </div>
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-1">Completed This Week</p>
          <p className="text-xl font-bold text-[var(--success)]">{data.tasksCompletedThisWeek}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Velocity Tab ────────────────────────────────────────────────

function VelocityTab({ data }: { readonly data: VelocityData }) {
  if (data.sprints.length === 0) return <EmptyChart message="No completed sprints yet. Complete a sprint to see velocity data." />;

  const chartData = [...data.sprints].reverse();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Sprint Velocity</h3>
        <Badge variant="outline" className="text-[10px]">Avg: {data.averageVelocity} pts/sprint</Badge>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="committed" fill="var(--accent)" opacity={0.4} name="Committed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" fill="var(--success)" name="Completed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Cycle Time Tab ──────────────────────────────────────────────

function CycleTimeTab({ data }: { readonly data: CycleTimeData }) {
  if (!data.averageDays) return <EmptyChart message="No completed tasks in this period." />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <p className="text-[10px] text-[var(--muted-foreground)] uppercase">Average</p>
          <p className="text-xl font-bold text-[var(--foreground)]">{data.averageDays} days</p>
        </div>
        <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <p className="text-[10px] text-[var(--muted-foreground)] uppercase">Median</p>
          <p className="text-xl font-bold text-[var(--foreground)]">{data.medianDays} days</p>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-[var(--foreground)]">Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[...data.distribution]}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="range" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="count" fill="var(--accent)" name="Tasks" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {data.byPriority.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">By Priority</h3>
          <div className="space-y-1">
            {data.byPriority.map((p) => (
              <div key={p.priority} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--background-surface)]">
                <span className="text-xs text-[var(--foreground)] capitalize">{p.priority}</span>
                <span className="text-xs font-medium text-[var(--muted-foreground)]">{p.avgDays} days avg</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Workload Tab ────────────────────────────────────────────────

function WorkloadTab({ data }: { readonly data: WorkloadData }) {
  if (data.members.length === 0) return <EmptyChart message="No active team members." />;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">Team Workload</h3>
      {data.members.map((m) => (
        <div key={m.userId} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center text-white text-xs font-bold">
            {(m.name ?? 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--foreground)] truncate">{m.name ?? m.userId.slice(0, 8)}</p>
            <div className="flex items-center gap-3 text-[10px] text-[var(--muted-foreground)]">
              <span>{m.activeTasks} active</span>
              <span className="text-[var(--success)]">{m.completedThisPeriod} done this week</span>
              {m.overdueCount > 0 && <span className="text-[var(--destructive)]">{m.overdueCount} overdue</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-[var(--foreground)]">{m.activeTasks}</p>
            <p className="text-[9px] text-[var(--muted-foreground)]">tasks</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SLA Tab ─────────────────────────────────────────────────────

const SLA_COLORS = ['#10B981', '#EF4444'];

function SlaTab({ data }: { readonly data: SlaComplianceData }) {
  if (data.policies.length === 0) return <EmptyChart message="No SLA policies configured. Create one in Settings." />;

  return (
    <div className="space-y-4">
      {/* Overall donut */}
      <div className="flex items-center gap-6">
        <div className="w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Within SLA', value: data.overallComplianceRate },
                  { name: 'Breached', value: 100 - data.overallComplianceRate },
                ]}
                cx="50%" cy="50%" innerRadius={35} outerRadius={55}
                dataKey="value" strokeWidth={0}
              >
                <Cell fill={SLA_COLORS[0]} />
                <Cell fill={SLA_COLORS[1]} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          <p className="text-3xl font-bold text-[var(--foreground)]">{data.overallComplianceRate}%</p>
          <p className="text-xs text-[var(--muted-foreground)]">Overall SLA Compliance</p>
        </div>
      </div>

      {/* Per-policy breakdown */}
      <h3 className="text-sm font-semibold text-[var(--foreground)]">By Policy</h3>
      {data.policies.map((p) => (
        <div key={p.policyName} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--foreground)]">{p.policyName}</span>
            <span className={cn('text-sm font-bold', p.complianceRate >= 90 ? 'text-[var(--success)]' : p.complianceRate >= 70 ? 'text-[var(--warning)]' : 'text-[var(--destructive)]')}>
              {p.complianceRate}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--success)]" style={{ width: `${p.complianceRate}%` }} />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-[var(--muted-foreground)]">
            <span>{p.withinSla} within SLA</span>
            <span>{p.breached} breached</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty Chart ─────────────────────────────────────────────────

function EmptyChart({ message }: { readonly message: string }) {
  return (
    <div className="text-center py-16">
      <BarChart3 size={40} className="mx-auto text-[var(--muted-foreground)] mb-3" />
      <p className="text-sm text-[var(--muted-foreground)]">{message}</p>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export default function ReportsPage() {
  const t = useVocabulary();
  const [activeTab, setActiveTab] = useState<ReportTab>('summary');

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['report-summary'],
    queryFn: getOrgSummary,
    staleTime: 60_000,
    enabled: activeTab === 'summary',
  });

  const { data: velocity, isLoading: loadingVelocity } = useQuery({
    queryKey: ['report-velocity'],
    queryFn: () => getVelocity('00000000-0000-0000-0000-000000000000', 10),
    staleTime: 60_000,
    enabled: activeTab === 'velocity',
  });

  const { data: cycleTime, isLoading: loadingCycle } = useQuery({
    queryKey: ['report-cycle-time'],
    queryFn: () => getCycleTime({ days: 30 }),
    staleTime: 60_000,
    enabled: activeTab === 'cycle_time',
  });

  const { data: workload, isLoading: loadingWorkload } = useQuery({
    queryKey: ['report-workload'],
    queryFn: () => getWorkload(),
    staleTime: 60_000,
    enabled: activeTab === 'workload',
  });

  const { data: sla, isLoading: loadingSla } = useQuery({
    queryKey: ['report-sla'],
    queryFn: () => getSlaCompliance({ days: 30 }),
    staleTime: 60_000,
    enabled: activeTab === 'sla',
  });

  const isLoading = (activeTab === 'summary' && loadingSummary) || (activeTab === 'velocity' && loadingVelocity)
    || (activeTab === 'cycle_time' && loadingCycle) || (activeTab === 'workload' && loadingWorkload)
    || (activeTab === 'sla' && loadingSla);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-emerald-500 flex items-center justify-center shadow-lg">
          <BarChart3 size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-outfit text-lg font-bold text-[var(--foreground)]">Reports</h1>
          <p className="text-[10px] text-[var(--muted-foreground)]">Analytics and performance insights</p>
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
                activeTab === tab.id
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--background-surface)]',
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
          <Shimmer className="h-24 rounded-xl" />
          <Shimmer className="h-64 rounded-xl" />
        </div>
      ) : (
        <>
          {activeTab === 'summary' && summary && <SummaryTab data={summary} />}
          {activeTab === 'velocity' && velocity && <VelocityTab data={velocity} />}
          {activeTab === 'cycle_time' && cycleTime && <CycleTimeTab data={cycleTime} />}
          {activeTab === 'workload' && workload && <WorkloadTab data={workload} />}
          {activeTab === 'sla' && sla && <SlaTab data={sla} />}
        </>
      )}
    </div>
  );
}
