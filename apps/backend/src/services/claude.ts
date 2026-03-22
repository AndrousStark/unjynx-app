/**
 * Claude AI service — wraps the Anthropic SDK for UNJYNX.
 *
 * Model routing strategy (cost-optimized):
 *   - Haiku 4.5  (80%) — simple chat, quick answers
 *   - Sonnet 4.6 (15%) — complex reasoning, decomposition
 *   - Opus 4.6   (5%)  — deepest analysis, weekly insights
 *
 * Features:
 *   - Streaming chat completion (SSE-ready)
 *   - Task decomposition (structured JSON)
 *   - Schedule suggestion (structured JSON)
 *   - Weekly insight generation
 *   - Token cost tracking
 *   - Per-user daily rate limiting
 */

import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, TextBlock } from "@anthropic-ai/sdk/resources/messages.js";

import { env } from "../env.js";
import {
  getPersonaPrompt,
  DECOMPOSE_SYSTEM_PROMPT,
  SCHEDULE_SYSTEM_PROMPT,
  INSIGHTS_SYSTEM_PROMPT,
} from "../modules/ai/prompts.js";

// ── Constants ───────────────────────────────────────────────────────

export const CLAUDE_MODELS = {
  haiku: "claude-haiku-4-5-20241022",
  sonnet: "claude-sonnet-4-20250514",
  opus: "claude-opus-4-20250514",
} as const;

export type ModelTier = keyof typeof CLAUDE_MODELS;

/** Daily AI call limits by plan tier. */
const DAILY_LIMITS: Readonly<Record<string, number>> = {
  free: 10,
  pro: 100,
  team: 200,
  enterprise: 1000,
} as const;

const DEFAULT_DAILY_LIMIT = 10;

/** Max tokens per model tier. */
const MAX_TOKENS: Readonly<Record<ModelTier, number>> = {
  haiku: 2048,
  sonnet: 4096,
  opus: 4096,
} as const;

// ── Client singleton ────────────────────────────────────────────────

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

/**
 * Check whether Claude API is available (key configured).
 */
export function isClaudeEnabled(): boolean {
  return !!env.ANTHROPIC_API_KEY;
}

// ── Token cost tracking ─────────────────────────────────────────────

interface TokenUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly model: string;
  readonly estimatedCostUsd: number;
}

/** Approximate per-token costs (USD) as of 2026-03. */
const TOKEN_COSTS: Readonly<Record<ModelTier, { input: number; output: number }>> = {
  haiku: { input: 0.0000008, output: 0.000004 },
  sonnet: { input: 0.000003, output: 0.000015 },
  opus: { input: 0.000015, output: 0.000075 },
};

function calculateCost(
  tier: ModelTier,
  inputTokens: number,
  outputTokens: number,
): number {
  const costs = TOKEN_COSTS[tier];
  return inputTokens * costs.input + outputTokens * costs.output;
}

// ── Rate limiting (in-memory, per-user daily) ───────────────────────

interface RateBucket {
  readonly count: number;
  readonly resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();

function checkRateLimit(
  profileId: string,
  planTier: string = "free",
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const limit = DAILY_LIMITS[planTier] ?? DEFAULT_DAILY_LIMIT;

  const existing = rateBuckets.get(profileId);

  // Reset if bucket has expired
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + 24 * 60 * 60 * 1000; // 24 hours from now
    rateBuckets.set(profileId, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  const updated: RateBucket = {
    count: existing.count + 1,
    resetAt: existing.resetAt,
  };
  rateBuckets.set(profileId, updated);

  return {
    allowed: true,
    remaining: limit - updated.count,
    resetAt: updated.resetAt,
  };
}

// ── Model selection ─────────────────────────────────────────────────

/**
 * Select the appropriate model tier based on task complexity.
 *
 * Explicit override takes precedence, then heuristic routing.
 */
export function selectModel(
  override?: ModelTier,
  messageCount?: number,
): ModelTier {
  if (override) return override;

  // Longer conversations get more capable models
  if (messageCount && messageCount > 20) return "sonnet";
  if (messageCount && messageCount > 50) return "opus";

  return "haiku";
}

// ── Public API ──────────────────────────────────────────────────────

export interface ChatMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

export interface ChatOptions {
  readonly messages: readonly ChatMessage[];
  readonly persona?: string;
  readonly model?: ModelTier;
  readonly profileId: string;
  readonly planTier?: string;
}

export interface ChatResult {
  readonly content: string;
  readonly usage: TokenUsage;
  readonly rateLimit: { remaining: number; resetAt: number };
}

/**
 * Non-streaming chat completion.
 */
export async function chatCompletion(
  options: ChatOptions,
): Promise<ChatResult> {
  const rateCheck = checkRateLimit(options.profileId, options.planTier);
  if (!rateCheck.allowed) {
    throw new Error(
      `Daily AI limit reached. Resets at ${new Date(rateCheck.resetAt).toISOString()}`,
    );
  }

  const tier = selectModel(options.model, options.messages.length);
  const model = CLAUDE_MODELS[tier];
  const systemPrompt = getPersonaPrompt(options.persona);

  const messages: MessageParam[] = options.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await getClient().messages.create({
    model,
    max_tokens: MAX_TOKENS[tier],
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find(
    (block): block is TextBlock => block.type === "text",
  );

  const usage: TokenUsage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    model,
    estimatedCostUsd: calculateCost(
      tier,
      response.usage.input_tokens,
      response.usage.output_tokens,
    ),
  };

  return {
    content: textBlock?.text ?? "",
    usage,
    rateLimit: {
      remaining: rateCheck.remaining,
      resetAt: rateCheck.resetAt,
    },
  };
}

/**
 * Streaming chat completion — yields text chunks for SSE.
 */
export async function* chatStream(
  options: ChatOptions,
): AsyncGenerator<string, TokenUsage | undefined, unknown> {
  const rateCheck = checkRateLimit(options.profileId, options.planTier);
  if (!rateCheck.allowed) {
    throw new Error(
      `Daily AI limit reached. Resets at ${new Date(rateCheck.resetAt).toISOString()}`,
    );
  }

  const tier = selectModel(options.model, options.messages.length);
  const model = CLAUDE_MODELS[tier];
  const systemPrompt = getPersonaPrompt(options.persona);

  const messages: MessageParam[] = options.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const stream = getClient().messages.stream({
    model,
    max_tokens: MAX_TOKENS[tier],
    system: systemPrompt,
    messages,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }

  // After stream completes, return usage info
  const finalMessage = await stream.finalMessage();
  return {
    inputTokens: finalMessage.usage.input_tokens,
    outputTokens: finalMessage.usage.output_tokens,
    model,
    estimatedCostUsd: calculateCost(
      tier,
      finalMessage.usage.input_tokens,
      finalMessage.usage.output_tokens,
    ),
  };
}

// ── Task Decomposition ──────────────────────────────────────────────

export interface Subtask {
  readonly title: string;
  readonly estimatedMinutes: number;
  readonly priority: "high" | "medium" | "low";
}

export interface DecomposeResult {
  readonly subtasks: readonly Subtask[];
  readonly reasoning: string;
  readonly usage: TokenUsage;
}

/**
 * Decompose a task into actionable subtasks using Claude.
 */
export async function decomposeTask(
  taskTitle: string,
  taskDescription: string | undefined,
  profileId: string,
  planTier?: string,
): Promise<DecomposeResult> {
  const rateCheck = checkRateLimit(profileId, planTier);
  if (!rateCheck.allowed) {
    throw new Error(
      `Daily AI limit reached. Resets at ${new Date(rateCheck.resetAt).toISOString()}`,
    );
  }

  const tier: ModelTier = "sonnet"; // decomposition needs reasoning
  const model = CLAUDE_MODELS[tier];

  const userPrompt = taskDescription
    ? `Task: ${taskTitle}\nDescription: ${taskDescription}`
    : `Task: ${taskTitle}`;

  const response = await getClient().messages.create({
    model,
    max_tokens: MAX_TOKENS[tier],
    system: DECOMPOSE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find(
    (block): block is TextBlock => block.type === "text",
  );

  const usage: TokenUsage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    model,
    estimatedCostUsd: calculateCost(
      tier,
      response.usage.input_tokens,
      response.usage.output_tokens,
    ),
  };

  try {
    const parsed = JSON.parse(textBlock?.text ?? "{}") as {
      subtasks?: Subtask[];
      reasoning?: string;
    };
    return {
      subtasks: parsed.subtasks ?? [],
      reasoning: parsed.reasoning ?? "",
      usage,
    };
  } catch {
    // If JSON parsing fails, return the raw text as reasoning
    return {
      subtasks: [],
      reasoning: textBlock?.text ?? "Failed to parse decomposition",
      usage,
    };
  }
}

// ── Schedule Suggestion ─────────────────────────────────────────────

export interface TaskForScheduling {
  readonly id: string;
  readonly title: string;
  readonly priority: string;
  readonly estimatedMinutes?: number;
}

export interface ScheduleSlot {
  readonly taskId: string;
  readonly suggestedStart: string;
  readonly suggestedEnd: string;
  readonly reason: string;
}

export interface ScheduleResult {
  readonly schedule: readonly ScheduleSlot[];
  readonly insights: string;
  readonly usage: TokenUsage;
}

/**
 * Suggest optimal time slots for a set of tasks.
 */
export async function scheduleSuggestion(
  tasks: readonly TaskForScheduling[],
  userContext: {
    readonly energyForecast?: readonly { hour: number; energy: number }[];
    readonly currentHour?: number;
    readonly timezone?: string;
  },
  profileId: string,
  planTier?: string,
): Promise<ScheduleResult> {
  const rateCheck = checkRateLimit(profileId, planTier);
  if (!rateCheck.allowed) {
    throw new Error(
      `Daily AI limit reached. Resets at ${new Date(rateCheck.resetAt).toISOString()}`,
    );
  }

  const tier: ModelTier = "sonnet";
  const model = CLAUDE_MODELS[tier];

  const userPrompt = JSON.stringify({
    tasks,
    context: {
      currentHour: userContext.currentHour ?? new Date().getHours(),
      timezone: userContext.timezone ?? "Asia/Kolkata",
      energyForecast: userContext.energyForecast ?? [],
    },
  });

  const response = await getClient().messages.create({
    model,
    max_tokens: MAX_TOKENS[tier],
    system: SCHEDULE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find(
    (block): block is TextBlock => block.type === "text",
  );

  const usage: TokenUsage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    model,
    estimatedCostUsd: calculateCost(
      tier,
      response.usage.input_tokens,
      response.usage.output_tokens,
    ),
  };

  try {
    const parsed = JSON.parse(textBlock?.text ?? "{}") as {
      schedule?: ScheduleSlot[];
      insights?: string;
    };
    return {
      schedule: parsed.schedule ?? [],
      insights: parsed.insights ?? "",
      usage,
    };
  } catch {
    return {
      schedule: [],
      insights: textBlock?.text ?? "Failed to parse schedule",
      usage,
    };
  }
}

// ── Insights Generation ─────────────────────────────────────────────

export interface InsightPattern {
  readonly type: "positive" | "negative" | "neutral";
  readonly description: string;
  readonly confidence: number;
}

export interface InsightSuggestion {
  readonly title: string;
  readonly description: string;
  readonly impact: "high" | "medium" | "low";
}

export interface InsightsResult {
  readonly summary: string;
  readonly patterns: readonly InsightPattern[];
  readonly suggestions: readonly InsightSuggestion[];
  readonly prediction: string;
  readonly usage: TokenUsage;
}

/**
 * Generate weekly AI-powered insights from user progress data.
 */
export async function generateInsights(
  progressData: {
    readonly tasksCompleted: number;
    readonly tasksCreated: number;
    readonly avgCompletionTime: number;
    readonly streakDays: number;
    readonly topCategories: readonly string[];
    readonly dailyCompletions: readonly { date: string; count: number }[];
  },
  patterns: {
    readonly peakHours: readonly number[];
    readonly lowHours: readonly number[];
    readonly busiestDay: string;
    readonly quietestDay: string;
  },
  profileId: string,
  planTier?: string,
): Promise<InsightsResult> {
  const rateCheck = checkRateLimit(profileId, planTier);
  if (!rateCheck.allowed) {
    throw new Error(
      `Daily AI limit reached. Resets at ${new Date(rateCheck.resetAt).toISOString()}`,
    );
  }

  const tier: ModelTier = "opus"; // deepest analysis for weekly report
  const model = CLAUDE_MODELS[tier];

  const userPrompt = JSON.stringify({ progressData, patterns });

  const response = await getClient().messages.create({
    model,
    max_tokens: MAX_TOKENS[tier],
    system: INSIGHTS_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find(
    (block): block is TextBlock => block.type === "text",
  );

  const usage: TokenUsage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    model,
    estimatedCostUsd: calculateCost(
      tier,
      response.usage.input_tokens,
      response.usage.output_tokens,
    ),
  };

  try {
    const parsed = JSON.parse(textBlock?.text ?? "{}") as {
      summary?: string;
      patterns?: InsightPattern[];
      suggestions?: InsightSuggestion[];
      prediction?: string;
    };
    return {
      summary: parsed.summary ?? "",
      patterns: parsed.patterns ?? [],
      suggestions: parsed.suggestions ?? [],
      prediction: parsed.prediction ?? "",
      usage,
    };
  } catch {
    return {
      summary: textBlock?.text ?? "Failed to parse insights",
      patterns: [],
      suggestions: [],
      prediction: "",
      usage,
    };
  }
}
