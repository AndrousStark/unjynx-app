'use client';

import { useQuery } from '@tanstack/react-query';
import { getAiInsights, type AiInsightsResult } from '@/lib/api/ai';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shimmer } from '@/components/ui/shimmer';
import {
  ArrowLeft,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Sparkles,
  RefreshCw,
  Target,
  Zap,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

// ─── Pattern Card ───────────────────────────────────────────────

function PatternCard({ pattern }: { pattern: AiInsightsResult['patterns'][number] }) {
  const icon = pattern.type === 'positive' ? <TrendingUp size={14} /> : pattern.type === 'negative' ? <TrendingDown size={14} /> : <Minus size={14} />;
  const colors = {
    positive: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
    negative: 'border-rose-500/20 bg-rose-500/5 text-rose-400',
    neutral: 'border-[var(--border)] bg-[var(--background-surface)] text-[var(--muted-foreground)]',
  };

  return (
    <div className={cn('p-4 rounded-xl border', colors[pattern.type as keyof typeof colors] ?? colors.neutral)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1">
          <p className="text-sm text-[var(--foreground)] leading-relaxed">{pattern.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1 rounded-full bg-[var(--background)] overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  pattern.type === 'positive' ? 'bg-emerald-400' : pattern.type === 'negative' ? 'bg-rose-400' : 'bg-[var(--muted-foreground)]',
                )}
                style={{ width: `${Math.round(pattern.confidence * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-[var(--muted-foreground)]">
              {Math.round(pattern.confidence * 100)}% confidence
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Suggestion Card ────────────────────────────────────────────

function SuggestionCard({ suggestion, index }: { suggestion: AiInsightsResult['suggestions'][number]; index: number }) {
  const impactColors = {
    high: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--background-surface)] hover:border-unjynx-violet/20 transition-colors">
      <div className="w-7 h-7 rounded-lg bg-unjynx-violet/10 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-unjynx-violet">{index + 1}</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-[var(--foreground)]">{suggestion.title}</p>
          <Badge
            variant="outline"
            className={cn('text-[9px] px-1.5 py-0 h-4', impactColors[suggestion.impact as keyof typeof impactColors] ?? '')}
          >
            {suggestion.impact} impact
          </Badge>
        </div>
        <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{suggestion.description}</p>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────

function InsightsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Shimmer className="h-32 rounded-xl" />
      <div className="space-y-3">
        <Shimmer className="h-6 w-32 rounded-md" />
        <Shimmer className="h-20 rounded-xl" />
        <Shimmer className="h-20 rounded-xl" />
      </div>
      <div className="space-y-3">
        <Shimmer className="h-6 w-40 rounded-md" />
        <Shimmer className="h-16 rounded-xl" />
        <Shimmer className="h-16 rounded-xl" />
        <Shimmer className="h-16 rounded-xl" />
      </div>
      <Shimmer className="h-24 rounded-xl" />
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function AiInsightsPage() {
  const { data: insights, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['ai', 'insights'],
    queryFn: getAiInsights,
    staleTime: 6 * 60 * 60_000, // 6 hours
    retry: 1,
  });

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/ai" className="p-1.5 rounded-lg hover:bg-[var(--background-surface)] transition-colors">
            <ArrowLeft size={18} className="text-[var(--muted-foreground)]" />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-unjynx-violet to-amber-500 flex items-center justify-center shadow-lg shadow-unjynx-violet/20">
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-outfit text-lg font-bold text-[var(--foreground)]">AI Insights</h1>
            <p className="text-[10px] text-[var(--muted-foreground)]">Weekly productivity analysis powered by Claude</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => refetch()}
          disabled={isFetching}
          title="Refresh insights"
        >
          <RefreshCw size={16} className={cn(isFetching && 'animate-spin')} />
        </Button>
      </div>

      {isLoading ? (
        <InsightsSkeleton />
      ) : isError ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
            <Brain size={28} className="text-rose-400" />
          </div>
          <h2 className="font-outfit font-semibold text-base text-[var(--foreground)] mb-1">
            Insights unavailable
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            AI service may be offline or you&apos;ve reached your daily limit.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw size={14} className="mr-1.5" />
            Try again
          </Button>
        </div>
      ) : insights ? (
        <div className="space-y-6">
          {/* Summary card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-unjynx-violet/15 to-amber-500/10 border border-unjynx-violet/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-unjynx-violet to-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <BarChart3 size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[var(--foreground)] mb-1.5">Weekly Summary</h2>
                <p className="text-sm text-[var(--foreground)] leading-relaxed">{insights.summary}</p>
              </div>
            </div>
          </div>

          {/* Patterns */}
          {insights.patterns.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target size={14} className="text-unjynx-violet" />
                <h2 className="text-sm font-semibold text-[var(--foreground)]">Patterns Detected</h2>
              </div>
              <div className="space-y-2">
                {insights.patterns.map((pattern, i) => (
                  <PatternCard key={i} pattern={pattern} />
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {insights.suggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={14} className="text-amber-400" />
                <h2 className="text-sm font-semibold text-[var(--foreground)]">Actionable Suggestions</h2>
              </div>
              <div className="space-y-2">
                {insights.suggestions.map((suggestion, i) => (
                  <SuggestionCard key={i} suggestion={suggestion} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Prediction */}
          {insights.prediction && (
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background-surface)]">
              <div className="flex items-start gap-2.5">
                <Zap size={14} className="text-unjynx-gold mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-xs font-semibold text-[var(--foreground)] mb-1">Next Week Prediction</h3>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{insights.prediction}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="flex gap-2 pt-2">
            <Link href="/ai/schedule" className="flex-1">
              <Button variant="outline" className="w-full text-xs">
                <Sparkles size={12} className="mr-1.5" />
                Auto-Schedule
              </Button>
            </Link>
            <Link href="/ai/decompose" className="flex-1">
              <Button variant="outline" className="w-full text-xs">
                <Sparkles size={12} className="mr-1.5" />
                Break Down Task
              </Button>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
