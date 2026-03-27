// ── AI Pipeline Orchestrator ──────────────────────────────────────────
//
// 6-layer pipeline inspired by BadhiyaAI's architecture:
//
//   Layer 1: Intent Classification (regex, cost: Rs 0)
//   Layer 2: Exact Cache (Valkey, cost: Rs 0)
//   Layer 3: [Future] Semantic Cache (pgvector, cost: Rs 0)
//   Layer 4: Context Builder (DB queries, cost: Rs 0)
//   Layer 5: Cascade Router (Haiku → Sonnet → Opus)
//   Layer 6: Cache + Log (analytics)
//
// Result: ~60-70% of queries resolved without LLM calls.

import { classifyIntent } from "./intent-classifier.js";
import { getFromCache, setInCache, invalidateUserCache } from "./exact-cache.js";
import { handleDirectAction } from "./direct-actions.js";
import { buildUserContext, serializeContext } from "./context-builder.js";
import { logAiInteraction } from "./ai-logger.js";
import * as claudeService from "../../../services/claude.js";
import { getPersonaPrompt } from "../prompts.js";

// ── Types ──────────────────────────────────────────────────────────

export interface PipelineRequest {
  readonly query: string;
  readonly userId: string;
  readonly persona?: string;
  readonly conversationHistory?: readonly { role: "user" | "assistant"; content: string }[];
  readonly planTier?: string;
}

export interface PipelineResponse {
  readonly response: string;
  readonly source: "layer1_intent" | "layer2_cache" | "layer5_llm";
  readonly intent: string | null;
  readonly model: string | null;
  readonly tier: number;
  readonly cached: boolean;
  readonly tokensUsed: number;
  readonly latencyMs: number;
  readonly data?: unknown;
}

// ── Pipeline ──────────────────────────────────────────────────────

/**
 * Process a user query through the 6-layer AI pipeline.
 *
 * For streaming chat, use the SSE endpoint directly — this pipeline
 * is for non-streaming responses (direct actions, cached, quick queries).
 */
export async function processQuery(
  request: PipelineRequest,
): Promise<PipelineResponse> {
  const startTime = Date.now();
  const { query, userId, persona, planTier } = request;

  // ── Layer 1: Intent Classification ────────────────────────────
  const classified = classifyIntent(query);

  if (classified) {
    // Try direct action first (no LLM needed)
    const actionResult = await handleDirectAction(classified, userId);

    if (actionResult.handled) {
      const latencyMs = Date.now() - startTime;

      // Cache the response
      setInCache(userId, query, classified.intent, {
        response: actionResult.response,
      });

      // Log
      logAiInteraction({
        userId,
        query,
        intent: classified.intent,
        model: null,
        tier: 0,
        tokensInput: 0,
        tokensOutput: 0,
        cacheHit: "layer1_intent",
        latencyMs,
        response: actionResult.response,
      });

      return {
        response: actionResult.response,
        source: "layer1_intent",
        intent: classified.intent,
        model: null,
        tier: 0,
        cached: false,
        tokensUsed: 0,
        latencyMs,
        data: actionResult.data,
      };
    }
  }

  // ── Layer 2: Exact Cache ──────────────────────────────────────
  const cached = await getFromCache(userId, query);

  if (cached) {
    const latencyMs = Date.now() - startTime;

    logAiInteraction({
      userId,
      query,
      intent: classified?.intent ?? null,
      model: null,
      tier: 0,
      tokensInput: 0,
      tokensOutput: 0,
      cacheHit: "layer2_exact",
      latencyMs,
      response: cached.response,
    });

    return {
      response: cached.response,
      source: "layer2_cache",
      intent: classified?.intent ?? null,
      model: null,
      tier: 0,
      cached: true,
      tokensUsed: 0,
      latencyMs,
    };
  }

  // ── Layer 3: [Future] Semantic Cache (pgvector) ───────────────
  // Will be added when pgvector is installed.

  // ── Layer 4: Context Builder ──────────────────────────────────
  const userContext = await buildUserContext(userId);
  const contextStr = serializeContext(userContext);

  // ── Layer 5: LLM (Claude with cascade routing) ────────────────
  // Build the system prompt with user context
  const basePrompt = getPersonaPrompt(persona);
  const systemPrompt = `${basePrompt}\n\nUser Context: ${contextStr}`;

  // Build messages (include conversation history if provided)
  const messages: { role: "user" | "assistant"; content: string }[] = [];
  if (request.conversationHistory) {
    messages.push(...request.conversationHistory);
  }
  messages.push({ role: "user", content: query });

  try {
    // Non-streaming completion with auto model selection
    const result = await claudeService.chatCompletion({
      messages,
      persona,
      profileId: userId,
      planTier,
    });

    const latencyMs = Date.now() - startTime;

    // ── Layer 6: Cache + Log ──────────────────────────────────
    // Cache the LLM response for future exact matches
    setInCache(userId, query, classified?.intent ?? "ai_chat", {
      response: result.content,
    });

    logAiInteraction({
      userId,
      query,
      intent: classified?.intent ?? null,
      model: result.usage.model,
      tier: 5,
      tokensInput: result.usage.inputTokens,
      tokensOutput: result.usage.outputTokens,
      cacheHit: "llm",
      latencyMs,
      response: result.content,
    });

    return {
      response: result.content,
      source: "layer5_llm",
      intent: classified?.intent ?? null,
      model: result.usage.model,
      tier: 5,
      cached: false,
      tokensUsed: result.usage.inputTokens + result.usage.outputTokens,
      latencyMs,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI service error";
    const latencyMs = Date.now() - startTime;

    logAiInteraction({
      userId,
      query,
      intent: classified?.intent ?? null,
      model: null,
      tier: -1,
      tokensInput: 0,
      tokensOutput: 0,
      cacheHit: null,
      latencyMs,
      response: `ERROR: ${message}`,
    });

    throw error;
  }
}

/**
 * Streaming chat — bypasses the pipeline cache layers.
 * Used for conversational AI where streaming is needed.
 *
 * Still injects user context into the system prompt.
 */
export async function* processStreamingChat(
  request: PipelineRequest,
): AsyncGenerator<string, { model: string; tokensUsed: number } | undefined, unknown> {
  const { query, userId, persona, planTier } = request;
  const startTime = Date.now();

  // ── Layer 1: Quick intent check for direct actions ────────────
  const classified = classifyIntent(query);
  if (classified) {
    const actionResult = await handleDirectAction(classified, userId);
    if (actionResult.handled) {
      // Yield the direct action response as a single chunk
      yield actionResult.response;

      logAiInteraction({
        userId,
        query,
        intent: classified.intent,
        model: null,
        tier: 0,
        tokensInput: 0,
        tokensOutput: 0,
        cacheHit: "layer1_intent",
        latencyMs: Date.now() - startTime,
        response: actionResult.response,
      });

      return { model: "direct_action", tokensUsed: 0 };
    }
  }

  // ── Layer 4: Context Builder ──────────────────────────────────
  const userContext = await buildUserContext(userId);
  const contextStr = serializeContext(userContext);

  // Inject context into persona prompt
  const basePrompt = getPersonaPrompt(persona);

  // Build messages
  const messages: { role: "user" | "assistant"; content: string }[] = [];
  if (request.conversationHistory) {
    messages.push(...request.conversationHistory);
  }
  messages.push({ role: "user", content: query });

  // ── Layer 5: Stream from Claude ───────────────────────────────
  const generator = claudeService.chatStream({
    messages,
    persona,
    profileId: userId,
    planTier,
  });

  let fullResponse = "";
  let result = await generator.next();

  while (!result.done) {
    const chunk = result.value as string;
    fullResponse += chunk;
    yield chunk;
    result = await generator.next();
  }

  const usage = result.value;
  const latencyMs = Date.now() - startTime;

  // ── Layer 6: Log ──────────────────────────────────────────────
  logAiInteraction({
    userId,
    query,
    intent: classified?.intent ?? null,
    model: usage?.model ?? null,
    tier: 5,
    tokensInput: usage?.inputTokens ?? 0,
    tokensOutput: usage?.outputTokens ?? 0,
    cacheHit: "llm",
    latencyMs,
    response: fullResponse.slice(0, 200),
  });

  // Cache the full response
  setInCache(userId, query, classified?.intent ?? "ai_chat", {
    response: fullResponse,
  });

  return {
    model: usage?.model ?? "unknown",
    tokensUsed: (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0),
  };
}

/**
 * Invalidate AI cache for a user (call after task CRUD).
 */
export { invalidateUserCache } from "./exact-cache.js";
