'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils/cn';
import { Shimmer } from '@/components/ui/shimmer';
import { EmptyState } from '@/components/ui/empty-state';
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  Target,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProductivityStats, getProgressHistory, type ProductivityStats, type DailyProgress } from '@/lib/api/progress';
import { getTasks, type Task } from '@/lib/api/tasks';

// ─── Chart Tooltip ──────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: readonly { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--popover)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-[var(--muted-foreground)] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs font-medium" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Derive chart data from tasks ───────────────────────────────

function deriveStatusData(tasks: readonly Task[]): { name: string; value: number; color: string }[] {
  const counts: Record<string, number> = { done: 0, in_progress: 0, todo: 0, cancelled: 0, pending: 0, completed: 0 };
  for (const t of tasks) {
    counts[t.status] = (counts[t.status] ?? 0) + 1;
  }
  return [
    { name: 'Completed', value: counts.done, color: '#00C896' },
    { name: 'In Progress', value: counts.in_progress, color: '#6C3CE0' },
    { name: 'To Do', value: counts.todo, color: '#FFD700' },
    { name: 'Cancelled', value: counts.cancelled, color: '#FF6B8A' },
  ].filter((d) => d.value > 0);
}

function derivePriorityData(tasks: readonly Task[]): { name: string; value: number; color: string }[] {
  const counts = { urgent: 0, high: 0, medium: 0, low: 0, none: 0 };
  for (const t of tasks) {
    counts[t.priority] = (counts[t.priority] ?? 0) + 1;
  }
  return [
    { name: 'Urgent', value: counts.urgent, color: '#FF6B8A' },
    { name: 'High', value: counts.high, color: '#FF9F1C' },
    { name: 'Medium', value: counts.medium, color: '#FFD700' },
    { name: 'Low', value: counts.low, color: '#00C896' },
    { name: 'None', value: counts.none, color: '#9B8BB8' },
  ].filter((d) => d.value > 0);
}

function deriveWeeklyData(history: readonly DailyProgress[]): { week: string; completed: number; created: number }[] {
  if (history.length === 0) return [];
  // Group daily progress into weeks
  const weeks: Record<string, { completed: number; created: number }> = {};
  for (const day of history) {
    const d = new Date(day.date);
    const weekNum = Math.ceil((d.getDate()) / 7);
    const key = `W${weekNum}`;
    const existing = weeks[key] ?? { completed: 0, created: 0 };
    weeks[key] = {
      completed: existing.completed + day.tasksCompleted,
      created: existing.created + day.tasksCreated,
    };
  }
  return Object.entries(weeks).map(([week, data]) => ({ week, ...data }));
}

// ─── Empty Chart Placeholder ────────────────────────────────────

function ChartEmpty({ message }: { readonly message: string }) {
  return (
    <div className="flex items-center justify-center h-[220px] text-center">
      <p className="text-xs text-[var(--muted-foreground)] max-w-[200px]">{message}</p>
    </div>
  );
}

// ─── Reports Page ───────────────────────────────────────────────

export default function ReportsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['productivity-stats'],
    queryFn: getProductivityStats,
    staleTime: 60_000,
  });

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['progress-history'],
    queryFn: () => getProgressHistory({ limit: 90 }),
    staleTime: 60_000,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['all-tasks-report'],
    queryFn: () => getTasks({ limit: 10000 }),
    staleTime: 60_000,
  });

  const isLoading = statsLoading || historyLoading || tasksLoading;

  const weeklyData = useMemo(() => deriveWeeklyData(history), [history]);
  const statusData = useMemo(() => deriveStatusData(tasks), [tasks]);
  const priorityData = useMemo(() => derivePriorityData(tasks), [tasks]);

  const completedCount = stats?.totalCompleted ?? tasks.filter((t) => t.status === 'done').length;
  const completionRate = stats?.completionRate ?? (tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100) : 0);
  const trend = stats?.weeklyTrend ?? 'stable';
  const trendLabel = trend === 'up' ? 'Trending up' : trend === 'down' ? 'Trending down' : 'Stable';

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Shimmer className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => <Shimmer key={i} variant="stat" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Shimmer variant="card" className="h-[280px]" />
          <Shimmer variant="card" className="h-[280px]" />
        </div>
      </div>
    );
  }

  const hasData = tasks.length > 0 || history.length > 0;

  if (!hasData) {
    return (
      <div className="animate-fade-in">
        <h2 className="font-outfit text-lg font-bold text-[var(--foreground)] mb-4">Team Analytics</h2>
        <EmptyState
          icon={<BarChart3 size={32} className="text-unjynx-gold" />}
          title="No data to display"
          description="Data will appear here after your team completes tasks. Start creating and completing tasks to see analytics."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-outfit text-lg font-bold text-[var(--foreground)]">
          Team Analytics
        </h2>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center gap-1 bg-[var(--background-surface)] rounded-lg p-1 border border-[var(--border)]">
            {(['week', 'month', 'quarter'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors',
                  period === p
                    ? 'bg-unjynx-violet text-white'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <Download size={14} />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-unjynx-emerald" />
            <span className="text-xs text-[var(--muted-foreground)]">Completed</span>
          </div>
          <p className="font-bebas text-2xl text-[var(--foreground)]">{completedCount}</p>
          <p className="text-[10px] text-[var(--muted-foreground)]">{trendLabel}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-unjynx-violet" />
            <span className="text-xs text-[var(--muted-foreground)]">Completion Rate</span>
          </div>
          <p className="font-bebas text-2xl text-[var(--foreground)]">{completionRate}%</p>
          <p className="text-[10px] text-[var(--muted-foreground)]">of {tasks.length} total tasks</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-unjynx-amber" />
            <span className="text-xs text-[var(--muted-foreground)]">Current Streak</span>
          </div>
          <p className="font-bebas text-2xl text-[var(--foreground)]">{stats?.currentStreak ?? 0}d</p>
          <p className="text-[10px] text-[var(--muted-foreground)]">best: {stats?.longestStreak ?? 0}d</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-unjynx-gold" />
            <span className="text-xs text-[var(--muted-foreground)]">Daily Score</span>
          </div>
          <p className="font-bebas text-2xl text-[var(--foreground)]">{stats?.averageDailyScore ?? 0}</p>
          <p className="text-[10px] text-[var(--muted-foreground)]">avg productivity</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Completion Trend */}
        <div className="glass-card p-5">
          <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)] mb-4">
            Weekly Completion Trend
          </h3>
          {weeklyData.length === 0 ? (
            <ChartEmpty message="Data will appear after your team completes tasks over multiple days." />
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rptCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6C3CE0" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6C3CE0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="completed" stroke="#6C3CE0" strokeWidth={2} fill="url(#rptCompleted)" />
                  <Area type="monotone" dataKey="created" stroke="#FFD700" strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Task Count by Status — replaces hardcoded member bar chart */}
        <div className="glass-card p-5">
          <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)] mb-4">
            Tasks by Status
          </h3>
          {statusData.length === 0 ? (
            <ChartEmpty message="Create tasks to see the status breakdown." />
          ) : (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Status Distribution Pie */}
        <div className="glass-card p-5">
          <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)] mb-4">
            Task Status Distribution
          </h3>
          {statusData.length === 0 ? (
            <ChartEmpty message="No tasks available to display distribution." />
          ) : (
            <div className="flex items-center gap-6">
              <div className="h-[160px] w-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5">
                {statusData.map((s) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs text-[var(--foreground)]">{s.name}</span>
                    <span className="text-xs text-[var(--muted-foreground)] ml-auto font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Priority Distribution Pie */}
        <div className="glass-card p-5">
          <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)] mb-4">
            Priority Distribution
          </h3>
          {priorityData.length === 0 ? (
            <ChartEmpty message="No tasks available to display priority breakdown." />
          ) : (
            <div className="flex items-center gap-6">
              <div className="h-[160px] w-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {priorityData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5">
                {priorityData.map((p) => (
                  <div key={p.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-xs text-[var(--foreground)]">{p.name}</span>
                    <span className="text-xs text-[var(--muted-foreground)] ml-auto font-medium">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
