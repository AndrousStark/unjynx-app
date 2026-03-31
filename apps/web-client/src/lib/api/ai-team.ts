// ---------------------------------------------------------------------------
// AI Team Features API
// ---------------------------------------------------------------------------

import { apiClient } from './client';

export interface StandupSummary {
  readonly date: string;
  readonly completedYesterday: readonly { title: string; assignee: string | null }[];
  readonly inProgressToday: readonly { title: string; assignee: string | null; dueDate: string | null }[];
  readonly blockers: readonly { title: string; assignee: string | null; reason: string }[];
  readonly aiSummary: string;
  readonly memberCount: number;
}

export interface RiskReport {
  readonly overdueTasks: readonly { id: string; title: string; assigneeId: string | null; dueDate: string }[];
  readonly staleTasks: readonly { id: string; title: string; daysSinceUpdate: number }[];
  readonly unassignedHighPriority: readonly { id: string; title: string; priority: string }[];
  readonly riskLevel: 'low' | 'medium' | 'high' | 'critical';
  readonly aiInsight: string;
}

export interface AssignmentSuggestion {
  readonly userId: string;
  readonly userName: string | null;
  readonly reason: string;
  readonly confidence: number;
  readonly currentTaskCount: number;
}

export interface ProjectHealth {
  readonly projectId: string;
  readonly health: 'green' | 'yellow' | 'red';
  readonly score: number;
  readonly metrics: {
    readonly totalTasks: number;
    readonly completedTasks: number;
    readonly overdueTasks: number;
    readonly completionRate: number;
    readonly avgDaysToComplete: number | null;
  };
  readonly aiInsight: string;
}

export interface AiSuggestion {
  readonly id: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly suggestionType: string;
  readonly suggestion: Record<string, unknown>;
  readonly confidence: string | null;
  readonly accepted: boolean | null;
  readonly createdAt: string;
}

export interface AiCostSummary {
  readonly totalOperations: number;
  readonly totalTokens: number;
  readonly byType: Record<string, number>;
}

export const getStandup = () => apiClient.get<StandupSummary>('/api/v1/ai-team/standup');
export const getRisks = () => apiClient.get<RiskReport>('/api/v1/ai-team/risks');
export const suggestAssignee = (taskTitle: string, taskPriority?: string) =>
  apiClient.post<readonly AssignmentSuggestion[]>('/api/v1/ai-team/suggest-assignee', { taskTitle, taskPriority });
export const getProjectHealth = (projectId: string) =>
  apiClient.get<ProjectHealth>(`/api/v1/ai-team/health/${projectId}`);
export const getSuggestions = (params?: { entityType?: string; entityId?: string }) =>
  apiClient.get<readonly AiSuggestion[]>('/api/v1/ai-team/suggestions', { params });
export const acceptSuggestion = (id: string) => apiClient.post(`/api/v1/ai-team/suggestions/${id}/accept`);
export const dismissSuggestion = (id: string) => apiClient.post(`/api/v1/ai-team/suggestions/${id}/dismiss`);
export const getAiOperations = (params?: { operationType?: string; limit?: number }) =>
  apiClient.get('/api/v1/ai-team/operations', { params });
export const getAiCost = () => apiClient.get<AiCostSummary>('/api/v1/ai-team/cost');
