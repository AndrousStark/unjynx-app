'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { CompletionDataPoint } from '@/lib/types';

interface ActivityChartProps {
  readonly data: readonly CompletionDataPoint[];
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: readonly { value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[var(--popover)] border border-[var(--border)] rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-[var(--muted-foreground)] mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm font-medium text-[var(--foreground)]">
          {entry.dataKey === 'completed' ? 'Completed' : 'Created'}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export function ActivityChart({ data }: ActivityChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="glass-card p-5">
      <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)] mb-4">
        Completion Trend
      </h3>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6C3CE0" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6C3CE0" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFD700" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="#6C3CE0"
              strokeWidth={2}
              fill="url(#completedGradient)"
            />
            <Area
              type="monotone"
              dataKey="created"
              stroke="#FFD700"
              strokeWidth={1.5}
              fill="url(#createdGradient)"
              strokeDasharray="4 4"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-[2px] bg-unjynx-violet rounded" />
          <span className="text-xs text-[var(--muted-foreground)]">Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-[2px] bg-unjynx-gold rounded border-dashed" />
          <span className="text-xs text-[var(--muted-foreground)]">Created</span>
        </div>
      </div>
    </div>
  );
}
