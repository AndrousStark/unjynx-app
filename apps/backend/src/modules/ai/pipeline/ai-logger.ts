// ── Layer 7: AI Interaction Logger ──────────────────────────────────
//
// Logs every AI interaction for analytics, debugging, and cost tracking.
// Fire-and-forget — never blocks the response.

import { db } from "../../../db/index.js";
import { auditLog } from "../../../db/schema/index.js";

export interface AiLogEntry {
  readonly userId: string;
  readonly query: string;
  readonly intent: string | null;
  readonly model: string | null;
  readonly tier: number;
  readonly tokensInput: number;
  readonly tokensOutput: number;
  readonly cacheHit: "layer1_intent" | "layer2_exact" | "llm" | null;
  readonly latencyMs: number;
  readonly response: string;
}

/**
 * Log an AI interaction. Fire-and-forget — does not throw.
 */
export function logAiInteraction(entry: AiLogEntry): void {
  db.insert(auditLog)
    .values({
      userId: entry.userId,
      action: "ai.query",
      entityType: "ai_interaction",
      entityId: entry.intent ?? "chat",
      metadata: JSON.stringify({
        query: entry.query.slice(0, 200), // truncate for storage
        intent: entry.intent,
        model: entry.model,
        tier: entry.tier,
        tokensInput: entry.tokensInput,
        tokensOutput: entry.tokensOutput,
        cacheHit: entry.cacheHit,
        latencyMs: entry.latencyMs,
      }),
    })
    .catch(() => {
      // Non-critical — swallow errors
    });
}
