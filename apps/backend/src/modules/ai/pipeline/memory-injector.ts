// ── Memory Injector ──────────────────────────────────────────────────
//
// Combines all memory tiers into a single context string for LLM injection.
// Manages the token budget to keep total context under ~200 tokens.
//
// Tiers:
//   1. Working Memory (Valkey) — session state, last task, active flow
//   2. [Future] Session Summaries — compressed past conversations
//   3. Semantic Memory (PostgreSQL) — persistent user facts
//   4. [Future] Episodic Memory — past interaction episodes
//
// The injected context is appended to the persona system prompt,
// giving the AI awareness of the user's state, preferences, and history.

import {
  loadWorkingMemory,
  saveWorkingMemory,
  serializeWorkingMemory,
  recordTaskMention,
  recordAction,
  type WorkingMemoryState,
} from "./working-memory.js";

import {
  loadFacts,
  serializeFacts,
  extractPreference,
  upsertFact,
  isPreferenceDeclaration,
} from "./semantic-memory.js";

import { buildUserContext, serializeContextForIntent } from "./context-builder.js";

// ── Types ──────────────────────────────────────────────────────────

export interface FullMemoryContext {
  /** The combined context string to inject into the LLM system prompt. */
  readonly contextString: string;
  /** Working memory state (for the pipeline to use). */
  readonly workingMemory: WorkingMemoryState;
  /** Total estimated token count of the injected context. */
  readonly estimatedTokens: number;
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Build the full memory context for an AI request.
 * This is the single entry point that the pipeline calls.
 *
 * @param userId — Profile ID
 * @param intent — Classified intent (for context selection)
 * @returns Combined context string + working memory state
 */
export async function buildFullMemoryContext(
  userId: string,
  intent: string | null,
): Promise<FullMemoryContext> {
  // Load all tiers in parallel
  const [wm, facts, userCtx] = await Promise.all([
    loadWorkingMemory(userId),
    loadFacts(userId),
    buildUserContext(userId),
  ]);

  // Build each tier's contribution
  const parts: string[] = [];

  // Tier 4 (inverted order for prompt): User profile + task context
  const profileContext = serializeContextForIntent(userCtx, intent);
  if (profileContext) parts.push(profileContext);

  // Tier 3: Semantic memory (persistent facts)
  const factsStr = serializeFacts(facts);
  if (factsStr) parts.push(factsStr);

  // Tier 1: Working memory (session state)
  const wmStr = serializeWorkingMemory(wm);
  if (wmStr) parts.push(wmStr);

  const contextString = parts.join("\n\n");

  // Rough token estimation: ~1 token per 4 characters
  const estimatedTokens = Math.ceil(contextString.length / 4);

  return {
    contextString,
    workingMemory: wm,
    estimatedTokens,
  };
}

/**
 * After an AI interaction, update working memory with what happened.
 * Call this after every pipeline response.
 */
export async function updateMemoryAfterAction(
  userId: string,
  wm: WorkingMemoryState,
  action: {
    type: string;
    entityId?: string;
    entityTitle?: string;
    userMessage: string;
  },
): Promise<void> {
  let updated = wm;

  // Record the action
  updated = recordAction(updated, action.type, action.entityId ?? null);

  // Record task mention if applicable
  if (action.entityId && action.entityTitle) {
    updated = recordTaskMention(updated, action.entityId, action.entityTitle);
  }

  // Check if the user's message is a preference declaration
  if (isPreferenceDeclaration(action.userMessage)) {
    const pref = extractPreference(action.userMessage);
    if (pref) {
      // Save to persistent semantic memory (fire-and-forget)
      upsertFact(userId, pref).catch(() => {});
    }
  }

  // Save updated working memory
  await saveWorkingMemory(userId, updated);
}

// Re-export for convenience
export {
  loadWorkingMemory,
  saveWorkingMemory,
  clearWorkingMemory,
  recordTaskMention,
  recordAction,
  startFlow,
  updateFlow,
  completeFlow,
  cancelFlow,
  resolveAnaphora,
  hasAnaphoricReference,
  setPendingConfirmation,
  clearConfirmation,
} from "./working-memory.js";

export {
  loadFacts,
  upsertFact,
  deleteFact,
  extractPreference,
  isPreferenceDeclaration,
} from "./semantic-memory.js";
