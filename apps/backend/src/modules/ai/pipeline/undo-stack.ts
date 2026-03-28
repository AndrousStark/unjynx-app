// ── Undo Stack (Command Pattern) ──────────────────────────────────
//
// Records every AI-performed action as a reversible command.
// Stored in memory (per-user stack, max 10 actions, 5-min TTL).
//
// Enables: "undo", "that was wrong", "revert that", "take that back"

import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { tasks } from "../../../db/schema/index.js";

// ── Types ──────────────────────────────────────────────────────────

interface UndoableAction {
  readonly type: "create_task" | "complete_task" | "start_task" | "batch_complete" | "create_multiple";
  readonly entityIds: readonly string[];
  readonly previousState: Record<string, unknown>;
  readonly timestamp: number;
  readonly description: string;
}

interface UndoResult {
  readonly success: boolean;
  readonly message: string;
}

// ── Storage (in-memory, per-user) ─────────────────────────────────

const userStacks = new Map<string, UndoableAction[]>();
const MAX_STACK_SIZE = 10;
const UNDO_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getStack(userId: string): UndoableAction[] {
  let stack = userStacks.get(userId);
  if (!stack) {
    stack = [];
    userStacks.set(userId, stack);
  }
  // Purge expired actions
  const now = Date.now();
  while (stack.length > 0 && now - stack[stack.length - 1].timestamp > UNDO_TTL_MS) {
    stack.pop();
  }
  return stack;
}

// ── Push Action ────────────────────────────────────────────────────

/**
 * Record an action that can be undone.
 */
export function pushUndoableAction(
  userId: string,
  action: Omit<UndoableAction, "timestamp">,
): void {
  const stack = getStack(userId);
  stack.unshift({ ...action, timestamp: Date.now() });
  // Trim to max size
  if (stack.length > MAX_STACK_SIZE) {
    stack.length = MAX_STACK_SIZE;
  }
}

// ── Undo Last Action ──────────────────────────────────────────────

/**
 * Undo the most recent action for a user.
 */
export async function undoLastAction(userId: string): Promise<UndoResult> {
  const stack = getStack(userId);

  if (stack.length === 0) {
    return { success: false, message: "Nothing to undo." };
  }

  const action = stack.shift()!;

  // Check if action is still within TTL
  if (Date.now() - action.timestamp > UNDO_TTL_MS) {
    return { success: false, message: "Undo expired (actions older than 5 minutes cannot be undone)." };
  }

  try {
    switch (action.type) {
      case "create_task": {
        // Undo create = delete
        for (const id of action.entityIds) {
          await db.delete(tasks).where(eq(tasks.id, id));
        }
        return {
          success: true,
          message: `**Undone:** Task "${action.description}" deleted.`,
        };
      }

      case "create_multiple": {
        // Undo batch create = delete all
        for (const id of action.entityIds) {
          await db.delete(tasks).where(eq(tasks.id, id));
        }
        return {
          success: true,
          message: `**Undone:** ${action.entityIds.length} tasks deleted.`,
        };
      }

      case "complete_task": {
        // Undo complete = set back to previous status
        const prevStatus = ((action.previousState.status as string) ?? "pending") as "pending" | "in_progress";
        for (const id of action.entityIds) {
          await db.update(tasks).set({
            status: prevStatus,
            completedAt: null,
            updatedAt: new Date(),
          }).where(eq(tasks.id, id));
        }
        return {
          success: true,
          message: `**Undone:** "${action.description}" reopened.`,
        };
      }

      case "start_task": {
        // Undo start = set back to pending
        for (const id of action.entityIds) {
          await db.update(tasks).set({
            status: "pending",
            updatedAt: new Date(),
          }).where(eq(tasks.id, id));
        }
        return {
          success: true,
          message: `**Undone:** "${action.description}" moved back to pending.`,
        };
      }

      case "batch_complete": {
        // Undo batch complete = reopen all
        for (const id of action.entityIds) {
          await db.update(tasks).set({
            status: "pending",
            completedAt: null,
            updatedAt: new Date(),
          }).where(eq(tasks.id, id));
        }
        return {
          success: true,
          message: `**Undone:** ${action.entityIds.length} tasks reopened.`,
        };
      }

      default:
        return { success: false, message: "Unknown action type." };
    }
  } catch {
    // Re-push the action if undo failed
    stack.unshift(action);
    return { success: false, message: "Undo failed. Please try again." };
  }
}

/**
 * Check if there's something to undo for a user.
 */
export function hasUndoableAction(userId: string): boolean {
  const stack = getStack(userId);
  return stack.length > 0 && Date.now() - stack[0].timestamp <= UNDO_TTL_MS;
}

/**
 * Get description of the last undoable action.
 */
export function getLastActionDescription(userId: string): string | null {
  const stack = getStack(userId);
  if (stack.length === 0 || Date.now() - stack[0].timestamp > UNDO_TTL_MS) return null;
  return stack[0].description;
}
