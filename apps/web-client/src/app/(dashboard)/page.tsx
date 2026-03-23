'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { useStats, useCompletionTrend, useAiSuggestions, useChannels } from '@/lib/hooks/use-dashboard';
import { getGreeting } from '@/lib/utils/greeting';
import { formatHours } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ProgressRings } from '@/components/dashboard/progress-rings';
import { ActivityChart } from '@/components/dashboard/activity-chart';
import { UpcomingTasks } from '@/components/dashboard/upcoming-tasks';
import { DailyContentCard } from '@/components/dashboard/daily-content';
import { StatsShimmer, Shimmer } from '@/components/ui/shimmer';
import {
  CheckCircle2,
  Flame,
  Timer,
  Zap,
  Sparkles,
  Radio,
  ArrowRight,
} from 'lucide-react';
import type { CompletionDataPoint } from '@/lib/types';

// ─── AI Suggestions Card ────────────────────────────────────────

function AiSuggestionsCard() {
  const { data: suggestions, isLoading } = useAiSuggestions();

  if (isLoading) {
    return (
      <div className="glass-card p-5">
        <Shimmer className="h-4 w-28 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Shimmer key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const items = suggestions?.slice(0, 3) ?? [];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-unjynx-gold" />
        <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)]">
          AI Suggestions
        </h3>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
          No suggestions right now. Keep working!
        </p>
      ) : (
        <div className="space-y-2.5">
          {items.map((suggestion) => (
            <div
              key={suggestion.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-[var(--background-surface)] hover:bg-[var(--background-elevated)] transition-colors cursor-pointer group"
            >
              <div className="mt-0.5 w-8 h-8 rounded-lg bg-unjynx-violet/15 flex items-center justify-center flex-shrink-0">
                <Sparkles size={14} className="text-unjynx-violet" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)] line-clamp-1">
                  {suggestion.title}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-2">
                  {suggestion.description}
                </p>
              </div>
              <button className="flex-shrink-0 text-xs px-2.5 py-1 rounded-lg bg-unjynx-violet text-white opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                Focus
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Channel Status Card ────────────────────────────────────────

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: '📱',
  telegram: '✈️',
  sms: '💬',
  email: '📧',
  instagram: '📸',
  slack: '💼',
  discord: '🎮',
  push: '🔔',
};

function ChannelStatusCard() {
  const { data: channels, isLoading } = useChannels();

  if (isLoading) {
    return (
      <div className="glass-card p-5">
        <Shimmer className="h-4 w-28 mb-4" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <Shimmer key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Fallback channels if API not connected
  const channelList = channels?.length
    ? channels
    : [
        { id: '1', type: 'whatsapp' as const, status: 'active' as const, label: 'WhatsApp', identifier: '', isVerified: true, isPrimary: true, lastUsedAt: null, createdAt: '', updatedAt: '' },
        { id: '2', type: 'telegram' as const, status: 'active' as const, label: 'Telegram', identifier: '', isVerified: true, isPrimary: false, lastUsedAt: null, createdAt: '', updatedAt: '' },
        { id: '3', type: 'sms' as const, status: 'pending' as const, label: 'SMS', identifier: '', isVerified: false, isPrimary: false, lastUsedAt: null, createdAt: '', updatedAt: '' },
        { id: '4', type: 'email' as const, status: 'active' as const, label: 'Email', identifier: '', isVerified: true, isPrimary: false, lastUsedAt: null, createdAt: '', updatedAt: '' },
        { id: '5', type: 'instagram' as const, status: 'disabled' as const, label: 'Instagram', identifier: '', isVerified: false, isPrimary: false, lastUsedAt: null, createdAt: '', updatedAt: '' },
        { id: '6', type: 'slack' as const, status: 'disabled' as const, label: 'Slack', identifier: '', isVerified: false, isPrimary: false, lastUsedAt: null, createdAt: '', updatedAt: '' },
        { id: '7', type: 'discord' as const, status: 'disabled' as const, label: 'Discord', identifier: '', isVerified: false, isPrimary: false, lastUsedAt: null, createdAt: '', updatedAt: '' },
        { id: '8', type: 'push' as const, status: 'active' as const, label: 'Push', identifier: '', isVerified: true, isPrimary: false, lastUsedAt: null, createdAt: '', updatedAt: '' },
      ];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio size={16} className="text-unjynx-emerald" />
          <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)]">
            Channel Status
          </h3>
        </div>
        <a
          href="/channels"
          className="text-xs text-unjynx-violet hover:text-unjynx-violet-hover transition-colors flex items-center gap-1"
        >
          Manage <ArrowRight size={12} />
        </a>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {channelList.map((ch) => {
          const isActive = ch.status === 'active';
          return (
            <div
              key={ch.id}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--background-surface)]"
            >
              <span className="text-sm">{CHANNEL_ICONS[ch.type] ?? '📡'}</span>
              <span className="text-xs text-[var(--foreground)] capitalize flex-1 truncate">
                {ch.type}
              </span>
              <span
                className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  isActive ? 'bg-unjynx-emerald' : 'bg-unjynx-rose/60',
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Dashboard Page ─────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: trend, isLoading: trendLoading } = useCompletionTrend(30);

  const greeting = getGreeting();
  const displayName = user?.displayName?.split(' ')[0] ?? 'there';

  // Fallback trend data
  const trendData: readonly CompletionDataPoint[] = trend?.length
    ? trend
    : Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          completed: Math.floor(Math.random() * 8) + 2,
          created: Math.floor(Math.random() * 6) + 3,
        };
      });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="font-outfit text-2xl lg:text-3xl font-bold text-[var(--foreground)]">
          {greeting}, <span className="text-gradient-gold">{displayName}</span>
        </h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Here&apos;s what&apos;s happening today
        </p>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <StatsShimmer />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={<CheckCircle2 size={20} className="text-unjynx-gold" />}
            value={stats?.tasksToday ?? 12}
            label="Tasks Today"
            delta={stats?.tasksTodayDelta ?? 15}
            accentClass="bg-unjynx-gold/15"
          />
          <StatsCard
            icon={<Flame size={20} className="text-unjynx-violet" />}
            value={stats?.streak ?? 7}
            label="Day Streak"
            delta={stats?.streakDelta ?? 100}
            accentClass="bg-unjynx-violet/15"
          />
          <StatsCard
            icon={<Timer size={20} className="text-unjynx-emerald" />}
            value={stats?.focusHours ?? 4.5}
            label="Focus Hours"
            delta={stats?.focusHoursDelta ?? 12}
            accentClass="bg-unjynx-emerald/15"
            format={formatHours}
          />
          <StatsCard
            icon={<Zap size={20} className="text-unjynx-amber" />}
            value={stats?.xp ?? 2840}
            label="Total XP"
            delta={stats?.xpDelta ?? 8}
            accentClass="bg-unjynx-amber/15"
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Progress Rings + Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProgressRings tasks={75} focus={60} habits={45} />
            {trendLoading ? (
              <div className="glass-card p-5">
                <Shimmer className="h-4 w-28 mb-4" />
                <Shimmer variant="card" className="h-[200px]" />
              </div>
            ) : (
              <ActivityChart data={trendData} />
            )}
          </div>

          {/* Upcoming Tasks */}
          <UpcomingTasks />
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-4 lg:space-y-6">
          <DailyContentCard />
          <AiSuggestionsCard />
          <ChannelStatusCard />
        </div>
      </div>
    </div>
  );
}
