// ---------------------------------------------------------------------------
// Dashboard TanStack Query Hooks
// ---------------------------------------------------------------------------

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { StatsOverview, CompletionDataPoint, DailyContent, AiSuggestion, Channel } from '@/lib/types';

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  trend: (days: number) => [...dashboardKeys.all, 'trend', days] as const,
  content: () => [...dashboardKeys.all, 'content'] as const,
  suggestions: () => [...dashboardKeys.all, 'suggestions'] as const,
  channels: () => [...dashboardKeys.all, 'channels'] as const,
} as const;

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

function getStats(): Promise<StatsOverview> {
  return apiClient.get<StatsOverview>('/api/v1/progress/stats');
}

function getCompletionTrend(days: number): Promise<readonly CompletionDataPoint[]> {
  return apiClient.get<readonly CompletionDataPoint[]>('/api/v1/progress/trend', {
    params: { days },
  });
}

function getDailyContent(): Promise<DailyContent> {
  return apiClient.get<DailyContent>('/api/v1/content/daily');
}

function getAiSuggestions(): Promise<readonly AiSuggestion[]> {
  return apiClient.get<readonly AiSuggestion[]>('/api/v1/tasks/suggestions');
}

function getChannels(): Promise<readonly Channel[]> {
  return apiClient.get<readonly Channel[]>('/api/v1/channels');
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: getStats,
    staleTime: 60_000,
  });
}

export function useCompletionTrend(days = 30) {
  return useQuery({
    queryKey: dashboardKeys.trend(days),
    queryFn: () => getCompletionTrend(days),
    staleTime: 120_000,
  });
}

export function useDailyContent() {
  return useQuery({
    queryKey: dashboardKeys.content(),
    queryFn: getDailyContent,
    staleTime: 3_600_000, // 1 hour
  });
}

export function useAiSuggestions() {
  return useQuery({
    queryKey: dashboardKeys.suggestions(),
    queryFn: getAiSuggestions,
    staleTime: 300_000, // 5 min
  });
}

export function useChannels() {
  return useQuery({
    queryKey: dashboardKeys.channels(),
    queryFn: getChannels,
    staleTime: 60_000,
  });
}
