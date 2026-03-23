// ---------------------------------------------------------------------------
// Progress API
// ---------------------------------------------------------------------------

import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DailyProgress {
  readonly date: string;
  readonly tasksCompleted: number;
  readonly tasksCreated: number;
  readonly streak: number;
  readonly productivityScore: number;
}

export interface WeeklyReport {
  readonly weekStart: string;
  readonly weekEnd: string;
  readonly totalCompleted: number;
  readonly totalCreated: number;
  readonly averageScore: number;
  readonly topProjects: readonly { readonly projectId: string; readonly name: string; readonly count: number }[];
  readonly peakDay: string;
  readonly peakHour: number;
}

export interface ProductivityStats {
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly totalCompleted: number;
  readonly completionRate: number;
  readonly averageDailyScore: number;
  readonly weeklyTrend: 'up' | 'down' | 'stable';
}

export interface HeatmapData {
  readonly date: string;
  readonly count: number;
  readonly level: 0 | 1 | 2 | 3 | 4;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export function getDailyProgress(date?: string): Promise<DailyProgress> {
  return apiClient.get<DailyProgress>('/api/v1/progress/daily', {
    params: date ? { date } : undefined,
  });
}

export function getWeeklyReport(weekStart?: string): Promise<WeeklyReport> {
  return apiClient.get<WeeklyReport>('/api/v1/progress/weekly', {
    params: weekStart ? { weekStart } : undefined,
  });
}

export function getProductivityStats(): Promise<ProductivityStats> {
  return apiClient.get<ProductivityStats>('/api/v1/progress/stats');
}

export function getHeatmap(params: {
  readonly start: string;
  readonly end: string;
}): Promise<readonly HeatmapData[]> {
  return apiClient.get<readonly HeatmapData[]>('/api/v1/progress/heatmap', {
    params,
  });
}

export function getProgressHistory(params?: {
  readonly page?: number;
  readonly limit?: number;
}): Promise<readonly DailyProgress[]> {
  return apiClient.get<readonly DailyProgress[]>('/api/v1/progress/history', {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}
