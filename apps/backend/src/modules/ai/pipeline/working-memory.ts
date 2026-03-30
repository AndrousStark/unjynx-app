// ── Tier 1: Working Memory (Valkey, TTL 30min) ──────────────────────
//
// Short-lived session state for multi-turn conversations.
// Enables: anaphora resolution ("mark IT done"), slot-filling flows,
// conversation topic tracking, and disambiguation.
//
// Stored in Valkey (Redis-compatible) with per-user keys.
// Falls back to in-memory Map when Valkey is unavailable.
//
// Architecture inspired by:
//   - ChatGPT's ephemeral session metadata
//   - Amazon Bedrock AgentCore session memory
//   - Airline booking bot slot-filling FSMs

import { logger } from "../../../middleware/logger.js";

const log = logger.child({ module: "working-memory" });

// ── Types ──────────────────────────────────────────────────────────

/** An entity recently mentioned in conversation (task, project, date). */
export interface MentionedEntity {
  readonly type: "task" | "project" | "date" | "channel";
  readonly id: string | null;
  readonly title: string;
  readonly mentionedAt: number;
}

/** Active multi-turn flow state (e.g., task creation with slot-filling). */
export interface ActiveFlow {
  readonly type: string;       // "create_task" | "update_task" | "plan_day" | etc.
  readonly step: string;       // "awaiting_title" | "awaiting_due_date" | etc.
  readonly slots: Record<string, string>; // filled slots so far
  readonly startedAt: number;
}

/** The complete working memory state for a user session. */
export interface WorkingMemoryState {
  // Entity tracking for anaphora resolution
  lastMentionedTaskId: string | null;
  lastMentionedTaskTitle: string | null;
  lastMentionedProjectId: string | null;
  entityStack: MentionedEntity[];        // last 5 mentioned entities

  // Multi-turn flow
  activeFlow: ActiveFlow | null;
  pausedFlows: ActiveFlow[];             // flows interrupted by topic switch

  // Conversation tracking
  conversationTopic: string | null;      // "scheduling" | "progress" | "project_X" | etc.
  lastActionType: string | null;         // "created" | "completed" | "listed" | etc.
  lastActionEntityId: string | null;     // ID of entity from last action
  pendingConfirmation: string | null;    // "Did you mean X or Y?"
  disambiguationCandidates: Array<{ id: string; title: string; score: number }>;

  // Session metadata
  turnCount: number;
  lastActivityAt: number;
}

// ── Defaults ──────────────────────────────────────────────────────

function createEmptyState(): WorkingMemoryState {
  return {
    lastMentionedTaskId: null,
    lastMentionedTaskTitle: null,
    lastMentionedProjectId: null,
    entityStack: [],
    activeFlow: null,
    pausedFlows: [],
    conversationTopic: null,
    lastActionType: null,
    lastActionEntityId: null,
    pendingConfirmation: null,
    disambiguationCandidates: [],
    turnCount: 0,
    lastActivityAt: Date.now(),
  };
}

// ── Storage (Valkey with in-memory fallback) ──────────────────────

const WM_TTL_SECONDS = 1800; // 30 minutes
const MAX_ENTITY_STACK = 5;
const FLOW_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// In-memory fallback
const memoryStore = new Map<string, { state: WorkingMemoryState; expiresAt: number }>();

let valkey: {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: { EX?: number }) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
} | null = null;

async function getValkey() {
  if (valkey) return valkey;
  try {
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    const { Redis } = await import("ioredis");
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
    });
    await client.connect();
    valkey = {
      get: (key: string) => client.get(key),
      set: (key: string, value: string, options?: { EX?: number }) =>
        options?.EX ? client.set(key, value, "EX", options.EX) : client.set(key, value),
      del: (key: string) => client.del(key),
    };
    log.info("Working memory connected to Valkey");
    return valkey;
  } catch {
    log.warn("Valkey unavailable for working memory — using in-memory store");
    return null;
  }
}

function wmKey(userId: string): string {
  return `wm:${userId}`;
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Load the working memory state for a user.
 * Returns empty state if none exists.
 */
export async function loadWorkingMemory(userId: string): Promise<WorkingMemoryState> {
  const key = wmKey(userId);

  // Try Valkey
  const client = await getValkey();
  if (client) {
    try {
      const raw = await client.get(key);
      if (raw) {
        const state = JSON.parse(raw) as WorkingMemoryState;
        // Check if active flow has timed out
        if (state.activeFlow && Date.now() - state.activeFlow.startedAt > FLOW_TIMEOUT_MS) {
          return { ...state, activeFlow: null };
        }
        return state;
      }
    } catch {
      // Fall through
    }
  }

  // In-memory fallback
  const mem = memoryStore.get(key);
  if (mem && mem.expiresAt > Date.now()) {
    return mem.state;
  }
  if (mem) memoryStore.delete(key);

  return createEmptyState();
}

/**
 * Save the working memory state for a user.
 * Resets the TTL on every save.
 */
export async function saveWorkingMemory(
  userId: string,
  state: WorkingMemoryState,
): Promise<void> {
  const key = wmKey(userId);
  const updated: WorkingMemoryState = {
    ...state,
    lastActivityAt: Date.now(),
  };
  const serialized = JSON.stringify(updated);

  const client = await getValkey();
  if (client) {
    try {
      await client.set(key, serialized, { EX: WM_TTL_SECONDS });
      return;
    } catch {
      // Fall through
    }
  }

  memoryStore.set(key, {
    state: updated,
    expiresAt: Date.now() + WM_TTL_SECONDS * 1000,
  });
}

/**
 * Clear working memory for a user (e.g., on logout or explicit reset).
 */
export async function clearWorkingMemory(userId: string): Promise<void> {
  const key = wmKey(userId);

  const client = await getValkey();
  if (client) {
    try {
      await client.del(key);
    } catch {
      // Ignore
    }
  }

  memoryStore.delete(key);
}

// ── Mutation Helpers ──────────────────────────────────────────────

/**
 * Record that a task was mentioned/interacted with.
 * Powers anaphora resolution ("mark IT done").
 */
export function recordTaskMention(
  state: WorkingMemoryState,
  taskId: string,
  taskTitle: string,
): WorkingMemoryState {
  const entity: MentionedEntity = {
    type: "task",
    id: taskId,
    title: taskTitle,
    mentionedAt: Date.now(),
  };

  // Push to front, limit stack size
  const newStack = [entity, ...state.entityStack.filter((e) => e.id !== taskId)].slice(0, MAX_ENTITY_STACK);

  return {
    ...state,
    lastMentionedTaskId: taskId,
    lastMentionedTaskTitle: taskTitle,
    entityStack: newStack,
  };
}

/**
 * Record the last action performed (for undo context and topic tracking).
 */
export function recordAction(
  state: WorkingMemoryState,
  actionType: string,
  entityId: string | null,
): WorkingMemoryState {
  return {
    ...state,
    lastActionType: actionType,
    lastActionEntityId: entityId,
    turnCount: state.turnCount + 1,
  };
}

/**
 * Start a multi-turn flow (e.g., task creation with missing slots).
 */
export function startFlow(
  state: WorkingMemoryState,
  flowType: string,
  initialSlots: Record<string, string> = {},
): WorkingMemoryState {
  // If there's an active flow, pause it
  const pausedFlows = state.activeFlow
    ? [state.activeFlow, ...state.pausedFlows].slice(0, 3)
    : state.pausedFlows;

  return {
    ...state,
    activeFlow: {
      type: flowType,
      step: "started",
      slots: initialSlots,
      startedAt: Date.now(),
    },
    pausedFlows,
  };
}

/**
 * Update the active flow's step and slots.
 */
export function updateFlow(
  state: WorkingMemoryState,
  step: string,
  newSlots: Record<string, string> = {},
): WorkingMemoryState {
  if (!state.activeFlow) return state;

  return {
    ...state,
    activeFlow: {
      ...state.activeFlow,
      step,
      slots: { ...state.activeFlow.slots, ...newSlots },
    },
  };
}

/**
 * Complete the active flow and return to idle.
 */
export function completeFlow(state: WorkingMemoryState): WorkingMemoryState {
  // Check if there's a paused flow to resume
  const [resumeFlow, ...remainingPaused] = state.pausedFlows;

  return {
    ...state,
    activeFlow: resumeFlow ?? null,
    pausedFlows: remainingPaused,
  };
}

/**
 * Cancel the active flow.
 */
export function cancelFlow(state: WorkingMemoryState): WorkingMemoryState {
  return {
    ...state,
    activeFlow: null,
    pendingConfirmation: null,
    disambiguationCandidates: [],
  };
}

/**
 * Set a pending confirmation question.
 */
export function setPendingConfirmation(
  state: WorkingMemoryState,
  question: string,
  candidates: Array<{ id: string; title: string; score: number }> = [],
): WorkingMemoryState {
  return {
    ...state,
    pendingConfirmation: question,
    disambiguationCandidates: candidates,
  };
}

/**
 * Clear pending confirmation.
 */
export function clearConfirmation(state: WorkingMemoryState): WorkingMemoryState {
  return {
    ...state,
    pendingConfirmation: null,
    disambiguationCandidates: [],
  };
}

/**
 * Set the conversation topic.
 */
export function setTopic(
  state: WorkingMemoryState,
  topic: string | null,
): WorkingMemoryState {
  return {
    ...state,
    conversationTopic: topic,
  };
}

// ── Anaphora Resolution ──────────────────────────────────────────

/**
 * Resolve "it", "that", "this" to the most recently mentioned entity.
 * Returns null if no resolution is possible.
 */
export function resolveAnaphora(
  state: WorkingMemoryState,
  pronoun: string,
  expectedType?: "task" | "project" | "date",
): MentionedEntity | null {
  const lower = pronoun.toLowerCase();

  // Direct references
  if (lower === "it" || lower === "that" || lower === "this" || lower === "this one") {
    // Filter by expected type if provided
    const candidates = expectedType
      ? state.entityStack.filter((e) => e.type === expectedType)
      : state.entityStack;

    return candidates[0] ?? null;
  }

  // "the last one" / "the first one"
  if (lower.includes("last") || lower.includes("previous")) {
    return state.entityStack[0] ?? null;
  }

  // Numbered reference from a list ("the second one", "#2")
  const numMatch = lower.match(/(?:#|number\s+|the\s+)?(\d+)/);
  if (numMatch && state.disambiguationCandidates.length > 0) {
    const index = parseInt(numMatch[1], 10) - 1;
    const candidate = state.disambiguationCandidates[index];
    if (candidate) {
      return { type: "task", id: candidate.id, title: candidate.title, mentionedAt: Date.now() };
    }
  }

  return null;
}

/**
 * Check if the user's message contains anaphoric references.
 */
export function hasAnaphoricReference(text: string): boolean {
  return /\b(it|that|this|this one|the last one|the first one|#\d+)\b/i.test(text);
}

// ── Context Serialization ────────────────────────────────────────

/**
 * Serialize working memory to a compact string for LLM context injection.
 * Target: ~30-50 tokens.
 */
export function serializeWorkingMemory(state: WorkingMemoryState): string {
  const parts: string[] = [];

  if (state.lastMentionedTaskTitle) {
    parts.push(`Last task: "${state.lastMentionedTaskTitle}"`);
  }

  if (state.activeFlow) {
    parts.push(`Active flow: ${state.activeFlow.type} (step: ${state.activeFlow.step})`);
    const slotCount = Object.keys(state.activeFlow.slots).length;
    if (slotCount > 0) {
      parts.push(`Slots filled: ${slotCount}`);
    }
  }

  if (state.pendingConfirmation) {
    parts.push(`Pending: ${state.pendingConfirmation}`);
  }

  if (state.conversationTopic) {
    parts.push(`Topic: ${state.conversationTopic}`);
  }

  if (state.lastActionType) {
    parts.push(`Last action: ${state.lastActionType}`);
  }

  return parts.length > 0 ? `Session: ${parts.join(". ")}` : "";
}
