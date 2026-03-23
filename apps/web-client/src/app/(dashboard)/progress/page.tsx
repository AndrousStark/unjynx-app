'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getProductivityStats,
  getHeatmap,
  type ProductivityStats,
  type HeatmapData,
} from '@/lib/api/progress';
import { useCompletionTrend, useStats } from '@/lib/hooks/use-dashboard';
import { cn } from '@/lib/utils/cn';
import { Shimmer, StatsShimmer } from '@/components/ui/shimmer';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Trophy,
  Target,
  BarChart3,
  Calendar,
  CheckCircle2,
  Zap,
  Clock,
} from 'lucide-react';
import type { CompletionDataPoint } from '@/lib/types';

// ---------------------------------------------------------------------------
// Progress Ring (Large)
// ---------------------------------------------------------------------------

function LargeProgressRing({
  label,
  value,
  color,
  radius,
}: {
  readonly label: string;
  readonly value: number;
  readonly color: string;
  readonly radius: number;
}) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;
  const center = 80;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="8"
          opacity="0.3"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          className="transition-all duration-1000 ease-out"
        />
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          className="fill-[var(--foreground)]"
          fontSize="28"
          fontWeight="bold"
          fontFamily="var(--font-bebas)"
        >
          {Math.round(animatedValue)}%
        </text>
        <text
          x={center}
          y={center + 16}
          textAnchor="middle"
          className="fill-[var(--muted-foreground)]"
          fontSize="10"
          textTransform="uppercase"
        >
          {label}
        </text>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Completion Trend Chart (simple bar chart)
// ---------------------------------------------------------------------------

function CompletionTrendChart({
  data,
}: {
  readonly data: readonly CompletionDataPoint[];
}) {
  const maxCompleted = Math.max(...data.map((d) => d.completed), 1);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)]">
          Completion Trend (30 days)
        </h3>
        <Badge variant="primary" size="sm">
          <BarChart3 size={10} className="mr-1" />
          {data.reduce((sum, d) => sum + d.completed, 0)} total
        </Badge>
      </div>

      <div className="flex items-end gap-[2px] h-[140px]">
        {data.map((point, i) => {
          const height = (point.completed / maxCompleted) * 100;
          const date = new Date(point.date);
          const isToday = i === data.length - 1;

          return (
            <div
              key={point.date}
              className="flex-1 flex flex-col items-center justify-end group relative"
            >
              <div
                className={cn(
                  'w-full rounded-t transition-all duration-300',
                  isToday
                    ? 'bg-unjynx-gold'
                    : 'bg-unjynx-violet/60 group-hover:bg-unjynx-violet',
                )}
                style={{ height: `${Math.max(height, 2)}%` }}
              />

              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-[var(--popover)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-[10px] whitespace-nowrap shadow-lg">
                  <p className="font-medium text-[var(--foreground)]">
                    {point.completed} completed
                  </p>
                  <p className="text-[var(--muted-foreground)]">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2">
        <span className="text-[10px] text-[var(--muted-foreground)]">
          {new Date(data[0]?.date ?? '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <span className="text-[10px] text-[var(--muted-foreground)]">
          Today
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Productivity Heatmap
// ---------------------------------------------------------------------------

function ProductivityHeatmap({ data }: { readonly data: readonly HeatmapData[] }) {
  const LEVEL_COLORS = [
    'bg-[var(--border)]',
    'bg-unjynx-violet/20',
    'bg-unjynx-violet/40',
    'bg-unjynx-violet/70',
    'bg-unjynx-violet',
  ];

  // Group by week (7 per column)
  const weeks: HeatmapData[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7) as HeatmapData[]);
  }

  const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={16} className="text-unjynx-violet" />
        <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)]">
          Productivity Heatmap
        </h3>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2">
        {/* Day labels */}
        <div className="flex flex-col gap-1 pr-1 flex-shrink-0">
          {DAY_LABELS.map((day, i) => (
            <div key={i} className="h-3 flex items-center">
              <span className="text-[8px] text-[var(--muted-foreground)] w-6">{day}</span>
            </div>
          ))}
        </div>

        {/* Cells */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                className={cn(
                  'w-3 h-3 rounded-[2px] transition-colors',
                  LEVEL_COLORS[day.level],
                )}
                title={`${day.date}: ${day.count} tasks`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] text-[var(--muted-foreground)]">Less</span>
        {LEVEL_COLORS.map((color, i) => (
          <div key={i} className={cn('w-3 h-3 rounded-[2px]', color)} />
        ))}
        <span className="text-[10px] text-[var(--muted-foreground)]">More</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Personal Bests Card
// ---------------------------------------------------------------------------

function PersonalBestsCard({ stats }: { readonly stats: ProductivityStats | undefined }) {
  const bests = [
    {
      icon: <Flame size={16} className="text-unjynx-amber" />,
      label: 'Longest Streak',
      value: `${stats?.longestStreak ?? '--'} days`,
    },
    {
      icon: <CheckCircle2 size={16} className="text-unjynx-emerald" />,
      label: 'Total Completed',
      value: `${stats?.totalCompleted ?? '--'}`,
    },
    {
      icon: <Target size={16} className="text-unjynx-violet" />,
      label: 'Completion Rate',
      value: stats?.completionRate ? `${Math.round(stats.completionRate)}%` : '--%',
    },
    {
      icon: <Zap size={16} className="text-unjynx-gold" />,
      label: 'Daily Average',
      value: stats?.averageDailyScore ? `${Math.round(stats.averageDailyScore)}` : '--',
    },
  ];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={16} className="text-unjynx-gold" />
        <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)]">
          Personal Bests
        </h3>
      </div>

      <div className="space-y-3">
        {bests.map((best) => (
          <div
            key={best.label}
            className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background-surface)]"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--background-elevated)] flex items-center justify-center flex-shrink-0">
              {best.icon}
            </div>
            <div className="flex-1">
              <p className="text-xs text-[var(--muted-foreground)]">{best.label}</p>
              <p className="font-bebas text-lg text-[var(--foreground)]">{best.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Streak History Card
// ---------------------------------------------------------------------------

function StreakHistoryCard({ stats }: { readonly stats: ProductivityStats | undefined }) {
  const trendIcon =
    stats?.weeklyTrend === 'up' ? (
      <TrendingUp size={14} className="text-unjynx-emerald" />
    ) : stats?.weeklyTrend === 'down' ? (
      <TrendingDown size={14} className="text-unjynx-rose" />
    ) : (
      <Minus size={14} className="text-[var(--muted-foreground)]" />
    );

  const trendLabel =
    stats?.weeklyTrend === 'up'
      ? 'Trending up this week'
      : stats?.weeklyTrend === 'down'
        ? 'Trending down this week'
        : 'Stable this week';

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flame size={16} className="text-unjynx-amber" />
        <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)]">
          Streak
        </h3>
      </div>

      {/* Current streak */}
      <div className="flex items-center gap-4 mb-4 p-4 rounded-xl bg-gradient-to-r from-unjynx-violet/10 to-unjynx-gold/10 border border-unjynx-violet/20">
        <div className="w-14 h-14 rounded-full bg-unjynx-gold/20 flex items-center justify-center">
          <Flame size={28} className="text-unjynx-gold" />
        </div>
        <div>
          <p className="font-bebas text-4xl text-[var(--foreground)]">
            {stats?.currentStreak ?? 0}
          </p>
          <p className="text-xs text-[var(--muted-foreground)]">
            day streak
          </p>
        </div>
      </div>

      {/* Weekly trend */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--background-surface)]">
        <Clock size={14} className="text-[var(--muted-foreground)]" />
        <span className="text-sm text-[var(--foreground)] flex-1">{trendLabel}</span>
        {trendIcon}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress Page
// ---------------------------------------------------------------------------

export default function ProgressPage() {
  const { data: overviewStats, isLoading: overviewLoading } = useStats();
  const { data: trend, isLoading: trendLoading } = useCompletionTrend(30);

  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);

  const { data: prodStats, isLoading: prodStatsLoading } = useQuery({
    queryKey: ['progress', 'stats'],
    queryFn: getProductivityStats,
    staleTime: 120_000,
  });

  const { data: heatmap, isLoading: heatmapLoading } = useQuery({
    queryKey: ['progress', 'heatmap'],
    queryFn: () =>
      getHeatmap({
        start: threeMonthsAgo.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0],
      }),
    staleTime: 120_000,
  });

  // Fallback trend data
  const trendData: readonly CompletionDataPoint[] = trend?.length
    ? trend
    : Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          completed: Math.floor(Math.random() * 8) + 1,
          created: Math.floor(Math.random() * 6) + 2,
        };
      });

  // Fallback heatmap data
  const heatmapData: readonly HeatmapData[] = heatmap?.length
    ? heatmap
    : Array.from({ length: 91 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (90 - i));
        const count = Math.floor(Math.random() * 10);
        return {
          date: date.toISOString().split('T')[0],
          count,
          level: (count === 0 ? 0 : count < 3 ? 1 : count < 5 ? 2 : count < 8 ? 3 : 4) as 0 | 1 | 2 | 3 | 4,
        };
      });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-outfit text-xl font-bold text-[var(--foreground)]">
          Progress & Insights
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Track your productivity journey and personal records.
        </p>
      </div>

      {/* Progress Rings */}
      {overviewLoading ? (
        <StatsShimmer />
      ) : (
        <div className="glass-card p-6">
          <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)] mb-6">
            Daily Goals
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 place-items-center">
            <LargeProgressRing label="Tasks" value={75} color="#FFD700" radius={60} />
            <LargeProgressRing label="Focus" value={60} color="#6C3CE0" radius={60} />
            <LargeProgressRing label="Habits" value={45} color="#00C896" radius={60} />
            <LargeProgressRing
              label="Overall"
              value={Math.round((75 + 60 + 45) / 3)}
              color="#F5A623"
              radius={60}
            />
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Completion Trend */}
          {trendLoading ? (
            <div className="glass-card p-5">
              <Shimmer className="h-4 w-40 mb-4" />
              <Shimmer variant="card" className="h-[140px]" />
            </div>
          ) : (
            <CompletionTrendChart data={trendData} />
          )}

          {/* Heatmap */}
          {heatmapLoading ? (
            <div className="glass-card p-5">
              <Shimmer className="h-4 w-40 mb-4" />
              <Shimmer variant="card" className="h-[100px]" />
            </div>
          ) : (
            <ProductivityHeatmap data={heatmapData} />
          )}
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-4 lg:space-y-6">
          {prodStatsLoading ? (
            <>
              <Shimmer variant="card" className="h-64" />
              <Shimmer variant="card" className="h-48" />
            </>
          ) : (
            <>
              <StreakHistoryCard stats={prodStats} />
              <PersonalBestsCard stats={prodStats} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
