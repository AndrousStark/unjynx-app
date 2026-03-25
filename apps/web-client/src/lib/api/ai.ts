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

/**
 * Send a chat message and consume the SSE stream, returning the full response.
 *
 * Backend streams SSE events: "text" (content chunks), "usage", "done".
 * We collect all text chunks into a single AiChatMessage.
 */
export async function sendChatMessage(message: string): Promise<AiChatMessage> {
  const BASE_URL =
    typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_API_URL ?? 'https://api.unjynx.me')
      : 'https://api.unjynx.me';

  const token =
    typeof window !== 'undefined'
      ? (document.cookie.match(/(?:^|;\s*)unjynx_token=([^;]*)/)?.[1]
          ? decodeURIComponent(document.cookie.match(/(?:^|;\s*)unjynx_token=([^;]*)/)![1])
          : localStorage.getItem('unjynx_token'))
      : null;

  const res = await fetch(`${BASE_URL}/api/v1/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `AI chat failed: ${res.status}`);
  }

  // Collect SSE text chunks
  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let content = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split('\n')) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.text) content += data.text;
          if (data.content) content += data.content;
        } catch {
          // Non-JSON data line, might be raw text
          const raw = line.slice(6).trim();
          if (raw && raw !== '[DONE]') content += raw;
        }
      }
    }
  }

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: content || 'AI service is currently unavailable. Please try again later.',
    metadata: null,
    createdAt: new Date().toISOString(),
  };
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
