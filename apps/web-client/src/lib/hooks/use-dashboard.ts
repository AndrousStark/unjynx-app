// ---------------------------------------------------------------------------
// Dashboard TanStack Query Hooks
// ---------------------------------------------------------------------------

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { CompletionDataPoint, DailyContent, AiSuggestion, Channel } from '@/lib/types';

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const dashboardKeys = {
  all: ['dashboard'] as const,
  rings: () => [...dashboardKeys.all, 'rings'] as const,
  streak: () => [...dashboardKeys.all, 'streak'] as const,
  trend: (days: number) => [...dashboardKeys.all, 'trend', days] as const,
  content: () => [...dashboardKeys.all, 'content'] as const,
  suggestions: () => [...dashboardKeys.all, 'suggestions'] as const,
  channels: () => [...dashboardKeys.all, 'channels'] as const,
} as const;

// ---------------------------------------------------------------------------
// Types matching backend response shapes
// ---------------------------------------------------------------------------

interface ProgressRings {
  readonly todayCompleted: number;
  readonly todayTotal: number;
  readonly weekCompleted: number;
  readonly weekTotal: number;
  readonly monthCompleted: number;
  readonly monthTotal: number;
}

interface StreakInfo {
  readonly currentStreak: number;
  readonly bestStreak: number;
  readonly lastActiveDate: string | null;
}

// ---------------------------------------------------------------------------
// API functions — mapped to REAL backend endpoints
// ---------------------------------------------------------------------------

function getProgressRings(): Promise<ProgressRings> {
  return apiClient.get<ProgressRings>('/api/v1/progress/rings');
}

function getStreak(): Promise<StreakInfo> {
  return apiClient.get<StreakInfo>('/api/v1/progress/streak');
}

function getCompletionTrend(days: number): Promise<readonly CompletionDataPoint[]> {
  return apiClient.get<readonly CompletionDataPoint[]>('/api/v1/progress/completion-trend', {
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

export function useProgressRings() {
  return useQuery({
    queryKey: dashboardKeys.rings(),
    queryFn: getProgressRings,
    staleTime: 60_000,
  });
}

export function useStreak() {
  return useQuery({
    queryKey: dashboardKeys.streak(),
    queryFn: getStreak,
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
    staleTime: 3_600_000,
  });
}

export function useAiSuggestions() {
  return useQuery({
    queryKey: dashboardKeys.suggestions(),
    queryFn: getAiSuggestions,
    staleTime: 300_000,
  });
}

export function useChannels() {
  return useQuery({
    queryKey: dashboardKeys.channels(),
    queryFn: getChannels,
    staleTime: 60_000,
  });
}
