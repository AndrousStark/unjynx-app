// ---------------------------------------------------------------------------
// AI API — streaming chat, pipeline query, insights, scheduling
// ---------------------------------------------------------------------------

import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AiChatMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly source?: 'layer1_intent' | 'layer2_cache' | 'layer5_llm' | 'streaming';
  readonly model?: string | null;
  readonly tokensUsed?: number;
  readonly metadata?: Record<string, unknown> | null;
  readonly createdAt: string;
}

export type Persona = 'default' | 'drill_sergeant' | 'therapist' | 'ceo' | 'coach';

export interface AiUsage {
  readonly plan: string;
  readonly dailyLimit: number;
  readonly resetAt: string;
}

export interface AiInsightsResult {
  readonly summary: string;
  readonly patterns: readonly { type: string; description: string; confidence: number }[];
  readonly suggestions: readonly { title: string; description: string; impact: string }[];
  readonly prediction: string;
}

export interface PipelineResult {
  readonly response: string;
  readonly source: 'layer1_intent' | 'layer2_cache' | 'layer5_llm';
  readonly intent: string | null;
  readonly model: string | null;
  readonly tier: number;
  readonly cached: boolean;
  readonly tokensUsed: number;
  readonly latencyMs: number;
  readonly data?: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const cookieMatch = document.cookie.match(/(?:^|;\s*)unjynx_token=([^;]*)/);
  if (cookieMatch) return decodeURIComponent(cookieMatch[1]);
  return localStorage.getItem('unjynx_token');
}

function getBaseUrl(): string {
  return typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? 'https://api.unjynx.me')
    : 'https://api.unjynx.me';
}

// ---------------------------------------------------------------------------
// Pipeline Query (non-streaming — fast for direct actions + cached)
// ---------------------------------------------------------------------------

export async function queryAi(
  query: string,
  options?: {
    persona?: Persona;
    conversationHistory?: readonly { role: 'user' | 'assistant'; content: string }[];
  },
): Promise<PipelineResult> {
  return apiClient.post<PipelineResult>('/api/v1/ai/query', {
    query,
    persona: options?.persona,
    conversationHistory: options?.conversationHistory,
  });
}

// ---------------------------------------------------------------------------
// Streaming Chat (real-time token-by-token rendering)
// ---------------------------------------------------------------------------

export interface StreamChatOptions {
  readonly messages: readonly { role: 'user' | 'assistant'; content: string }[];
  readonly persona?: Persona;
  readonly onChunk: (text: string) => void;
  readonly onDone: (usage?: { model: string; tokensUsed: number }) => void;
  readonly onError: (error: string) => void;
}

/**
 * Stream AI chat responses via SSE with real-time token rendering.
 * Returns an AbortController so the caller can cancel the stream.
 */
export function streamChat(options: StreamChatOptions): AbortController {
  const controller = new AbortController();

  (async () => {
    try {
      const token = getAuthToken();
      const baseUrl = getBaseUrl();

      const res = await fetch(`${baseUrl}/api/v1/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: options.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          persona: options.persona ?? 'default',
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        let errorMsg = `AI service error (${res.status})`;
        try {
          const parsed = JSON.parse(text);
          errorMsg = parsed.error ?? parsed.message ?? errorMsg;
        } catch {
          if (text) errorMsg = text;
        }
        options.onError(errorMsg);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        options.onError('No response body');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last incomplete line in buffer
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ') && !line.startsWith('event: ')) continue;

          // Parse SSE event type
          const eventMatch = line.match(/^event:\s*(.+)/);
          if (eventMatch) continue; // Event type line, data follows on next line

          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              options.onDone();
              return;
            }

            // Try to parse as JSON
            try {
              const parsed = JSON.parse(data);
              if (parsed.message) {
                options.onError(parsed.message);
                return;
              }
              // Usage event
              if (parsed.model || parsed.inputTokens) {
                options.onDone({
                  model: parsed.model ?? 'unknown',
                  tokensUsed: (parsed.inputTokens ?? 0) + (parsed.outputTokens ?? 0),
                });
                return;
              }
            } catch {
              // Raw text chunk — this is the streaming content
              if (data) {
                options.onChunk(data);
              }
            }
          }
        }
      }

      // Stream ended without [DONE]
      options.onDone();
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      options.onError(
        error instanceof Error ? error.message : 'Connection failed',
      );
    }
  })();

  return controller;
}

// ---------------------------------------------------------------------------
// Insights & Usage
// ---------------------------------------------------------------------------

export function getAiUsage(): Promise<AiUsage> {
  return apiClient.get<AiUsage>('/api/v1/ai/usage');
}

export function getAiInsights(): Promise<AiInsightsResult> {
  return apiClient.get<AiInsightsResult>('/api/v1/ai/insights');
}

// ---------------------------------------------------------------------------
// Schedule & Decompose
// ---------------------------------------------------------------------------

export function decomposeTask(
  taskTitle: string,
  description?: string,
): Promise<{
  subtasks: readonly { title: string; estimatedMinutes: number; priority: string }[];
  reasoning: string;
}> {
  return apiClient.post('/api/v1/ai/decompose', { taskTitle, description });
}

export function scheduleTasks(
  taskIds: readonly string[],
): Promise<{
  schedule: readonly { taskId: string; suggestedStart: string; suggestedEnd: string; reason: string }[];
  insights: string;
}> {
  return apiClient.post('/api/v1/ai/schedule', { taskIds });
}
