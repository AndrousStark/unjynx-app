'use client';

import { useState } from 'react';
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

// ─── Mock Data ──────────────────────────────────────────────────

const WEEKLY_DATA = Array.from({ length: 12 }, (_, i) => ({
  week: `W${i + 1}`,
  completed: Math.floor(Math.random() * 40) + 20,
  created: Math.floor(Math.random() * 30) + 25,
}));

const MEMBER_DATA = [
  { name: 'Sarah', completed: 24, inProgress: 5 },
  { name: 'Alex', completed: 21, inProgress: 3 },
  { name: 'Emma', completed: 18, inProgress: 7 },
  { name: 'Mike', completed: 15, inProgress: 4 },
  { name: 'James', completed: 12, inProgress: 6 },
];

const STATUS_DATA = [
  { name: 'Completed', value: 145, color: '#00C896' },
  { name: 'In Progress', value: 32, color: '#6C3CE0' },
  { name: 'To Do', value: 28, color: '#FFD700' },
  { name: 'Overdue', value: 8, color: '#FF6B8A' },
];

const PRIORITY_DATA = [
  { name: 'Urgent', value: 12, color: '#FF6B8A' },
  { name: 'High', value: 34, color: '#FF9F1C' },
  { name: 'Medium', value: 78, color: '#FFD700' },
  { name: 'Low', value: 45, color: '#00C896' },
  { name: 'None', value: 44, color: '#9B8BB8' },
];

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

// ─── Reports Page ───────────────────────────────────────────────

export default function ReportsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

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
          <p className="font-bebas text-2xl text-[var(--foreground)]">145</p>
          <p className="text-[10px] text-unjynx-emerald">+12% vs last {period}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-unjynx-violet" />
            <span className="text-xs text-[var(--muted-foreground)]">Completion Rate</span>
          </div>
          <p className="font-bebas text-2xl text-[var(--foreground)]">87%</p>
          <p className="text-[10px] text-unjynx-emerald">+5% vs last {period}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-unjynx-amber" />
            <span className="text-xs text-[var(--muted-foreground)]">Avg Time</span>
          </div>
          <p className="font-bebas text-2xl text-[var(--foreground)]">2.4h</p>
          <p className="text-[10px] text-unjynx-rose">+0.3h vs last {period}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-unjynx-gold" />
            <span className="text-xs text-[var(--muted-foreground)]">Active Members</span>
          </div>
          <p className="font-bebas text-2xl text-[var(--foreground)]">8</p>
          <p className="text-[10px] text-[var(--muted-foreground)]">of 10 total</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Completion Trend */}
        <div className="glass-card p-5">
          <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)] mb-4">
            Weekly Completion Trend
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={WEEKLY_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
        </div>

        {/* Member Performance */}
        <div className="glass-card p-5">
          <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)] mb-4">
            Member Performance
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MEMBER_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="completed" fill="#6C3CE0" radius={[0, 4, 4, 0]} barSize={16} />
                <Bar dataKey="inProgress" fill="#FFD700" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="glass-card p-5">
          <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)] mb-4">
            Task Status Distribution
          </h3>
          <div className="flex items-center gap-6">
            <div className="h-[160px] w-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={STATUS_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {STATUS_DATA.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5">
              {STATUS_DATA.map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-[var(--foreground)]">{s.name}</span>
                  <span className="text-xs text-[var(--muted-foreground)] ml-auto font-medium">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="glass-card p-5">
          <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)] mb-4">
            Priority Distribution
          </h3>
          <div className="flex items-center gap-6">
            <div className="h-[160px] w-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={PRIORITY_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {PRIORITY_DATA.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5">
              {PRIORITY_DATA.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-xs text-[var(--foreground)]">{p.name}</span>
                  <span className="text-xs text-[var(--muted-foreground)] ml-auto font-medium">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
