// ---------------------------------------------------------------------------
// AI API
// ---------------------------------------------------------------------------

import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AiSuggestion {
  readonly id: string;
  readonly type: 'schedule' | 'priority' | 'breakdown' | 'reminder' | 'insight';
  readonly title: string;
  readonly description: string;
  readonly confidence: number;
  readonly taskId: string | null;
  readonly actionPayload: Record<string, unknown> | null;
  readonly isApplied: boolean;
  readonly createdAt: string;
}

export interface AiChatMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly metadata: Record<string, unknown> | null;
  readonly createdAt: string;
}

export interface AiInsight {
  readonly id: string;
  readonly category: 'productivity' | 'patterns' | 'suggestions' | 'warnings';
  readonly title: string;
  readonly body: string;
  readonly severity: 'info' | 'warning' | 'critical';
  readonly isRead: boolean;
  readonly createdAt: string;
}

export interface SmartScheduleResult {
  readonly suggestedDate: string;
  readonly suggestedTime: string;
  readonly reason: string;
  readonly confidence: number;
  readonly alternatives: readonly {
    readonly date: string;
    readonly time: string;
    readonly reason: string;
  }[];
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export function getSuggestions(params?: {
  readonly type?: AiSuggestion['type'];
  readonly taskId?: string;
  readonly limit?: number;
}): Promise<readonly AiSuggestion[]> {
  return apiClient.get<readonly AiSuggestion[]>('/api/v1/ai/suggestions', {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

export function applySuggestion(id: string): Promise<AiSuggestion> {
  return apiClient.post<AiSuggestion>(`/api/v1/ai/suggestions/${id}/apply`);
}

export function dismissSuggestion(id: string): Promise<void> {
  return apiClient.post(`/api/v1/ai/suggestions/${id}/dismiss`);
}

export function getChatHistory(params?: {
  readonly page?: number;
  readonly limit?: number;
}): Promise<readonly AiChatMessage[]> {
  return apiClient.get<readonly AiChatMessage[]>('/api/v1/ai/chat', {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

export function sendChatMessage(message: string): Promise<AiChatMessage> {
  return apiClient.post<AiChatMessage>('/api/v1/ai/chat', { message });
}

export function getInsights(): Promise<readonly AiInsight[]> {
  return apiClient.get<readonly AiInsight[]>('/api/v1/ai/insights');
}

export function markInsightRead(id: string): Promise<void> {
  return apiClient.post(`/api/v1/ai/insights/${id}/read`);
}

export function getSmartSchedule(taskId: string): Promise<SmartScheduleResult> {
  return apiClient.get<SmartScheduleResult>(`/api/v1/ai/schedule/${taskId}`);
}

export function autoScheduleTasks(taskIds: readonly string[]): Promise<readonly {
  readonly taskId: string;
  readonly suggestedDate: string;
  readonly suggestedTime: string;
}[]> {
  return apiClient.post('/api/v1/ai/schedule/auto', { taskIds });
}
