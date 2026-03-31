// ── AI Operations & Suggestions ──────────────────────────────────────
//
// Tracks AI-powered team features:
//   - ai_operations: audit log of every AI invocation (decompose, standup, risk, etc.)
//   - ai_suggestions: pending AI recommendations (assignee, priority, labels)
//
// Used for:
//   - Cost tracking (tokens per org)
//   - Quality monitoring (accepted vs rejected suggestions)
//   - Debugging and compliance (full input/output audit trail)

import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations.js";
import { profiles } from "./profiles.js";

// ── AI Operations (Audit Log) ────────────────────────────────────────

export const aiOperations = pgTable(
  "ai_operations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    /**
     * Operation type:
     *   task_decomposition, sprint_planning, standup_summary,
     *   risk_detection, smart_assignment, report_generation,
     *   message_summary, duplicate_detection, project_health
     */
    operationType: text("operation_type").notNull(),
    /** Input context sent to the model (task data, sprint data, etc.) */
    inputContext: jsonb("input_context").$type<Record<string, unknown>>().notNull(),
    /** Model output (response text, structured data, etc.) */
    output: jsonb("output").$type<Record<string, unknown>>(),
    /** Which Claude model was used. */
    modelUsed: text("model_used"),
    /** Total tokens consumed (input + output). */
    tokensUsed: integer("tokens_used").default(0),
    /** Response latency in milliseconds. */
    latencyMs: integer("latency_ms"),
    /** pending → completed → failed */
    status: text("status").default("pending").notNull(),
    /** Error message if failed. */
    errorMessage: text("error_message"),
    /** Did the user accept/act on the AI output? */
    acceptedByUser: boolean("accepted_by_user"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ai_operations_org_id_idx").on(table.orgId),
    index("ai_operations_user_id_idx").on(table.userId),
    index("ai_operations_type_idx").on(table.operationType),
    index("ai_operations_created_at_idx").on(table.createdAt),
  ],
);

// ── AI Suggestions ───────────────────────────────────────────────────

export const aiSuggestions = pgTable(
  "ai_suggestions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    /** What entity this suggestion applies to (task, sprint, project). */
    entityType: text("entity_type").notNull(),
    /** ID of the entity. */
    entityId: uuid("entity_id").notNull(),
    /**
     * Suggestion type:
     *   assignee, priority, estimate, label, status,
     *   decomposition, schedule, risk_alert
     */
    suggestionType: text("suggestion_type").notNull(),
    /** The actual suggestion payload. */
    suggestion: jsonb("suggestion").$type<Record<string, unknown>>().notNull(),
    /** Confidence score 0.00 to 1.00. */
    confidence: numeric("confidence", { precision: 3, scale: 2 }),
    /** Was the suggestion accepted by the user? */
    accepted: boolean("accepted"),
    /** When this suggestion expires (stale suggestions are auto-dismissed). */
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ai_suggestions_org_id_idx").on(table.orgId),
    index("ai_suggestions_entity_idx").on(table.entityType, table.entityId),
    index("ai_suggestions_type_idx").on(table.suggestionType),
  ],
);

// ── Type Exports ─────────────────────────────────────────────────────

export type AiOperation = typeof aiOperations.$inferSelect;
export type NewAiOperation = typeof aiOperations.$inferInsert;
export type AiSuggestion = typeof aiSuggestions.$inferSelect;
export type NewAiSuggestion = typeof aiSuggestions.$inferInsert;
