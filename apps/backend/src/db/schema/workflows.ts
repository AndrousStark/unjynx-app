// ── Workflows (Configurable Status Pipelines) ───────────────────────
//
// Each project has a workflow defining allowed statuses and transitions.
// Default workflows are seeded; orgs can create custom ones.
//
// Workflow → Statuses (ordered) → Transitions (from → to with conditions)

import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations.js";
import { statusCategoryEnum } from "./enums.js";

// ── Workflows ────────────────────────────────────────────────────────

export const workflows = pgTable(
  "workflows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    description: text("description"),
    /** Default workflow for new projects in this org. */
    isDefault: boolean("is_default").default(false).notNull(),
    /** System workflows cannot be deleted by users. */
    isSystem: boolean("is_system").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("workflows_org_id_idx").on(table.orgId),
  ],
);

// ── Workflow Statuses ────────────────────────────────────────────────

export const workflowStatuses = pgTable(
  "workflow_statuses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id"),
    workflowId: uuid("workflow_id")
      .references(() => workflows.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    /** Category determines behavior: todo (backlog), in_progress (active), done (resolved). */
    category: statusCategoryEnum("category").default("todo").notNull(),
    color: text("color").default("#6C5CE7"),
    icon: text("icon"),
    sortOrder: integer("sort_order").default(0).notNull(),
    /** First status in the workflow (new issues start here). */
    isInitial: boolean("is_initial").default(false).notNull(),
    /** Final status (marks issue as resolved/closed). */
    isFinal: boolean("is_final").default(false).notNull(),
  },
  (table) => [
    index("workflow_statuses_workflow_id_idx").on(table.workflowId),
    uniqueIndex("workflow_statuses_workflow_name_idx").on(table.workflowId, table.name),
  ],
);

// ── Workflow Transitions ─────────────────────────────────────────────

export const workflowTransitions = pgTable(
  "workflow_transitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id"),
    workflowId: uuid("workflow_id")
      .references(() => workflows.id, { onDelete: "cascade" })
      .notNull(),
    fromStatusId: uuid("from_status_id")
      .references(() => workflowStatuses.id, { onDelete: "cascade" })
      .notNull(),
    toStatusId: uuid("to_status_id")
      .references(() => workflowStatuses.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name"),
    /** Roles allowed to make this transition (empty = anyone). */
    allowedRoles: jsonb("allowed_roles")
      .$type<string[]>()
      .default(["owner", "admin", "manager", "member"]),
    /** Conditions that must be met (e.g., require_assignee, require_estimate). */
    conditions: jsonb("conditions")
      .$type<{
        requireAssignee?: boolean;
        requireEstimate?: boolean;
        requireDescription?: boolean;
      }>()
      .default({}),
    /** Actions to take on transition (e.g., notify watchers, set fields). */
    onTransition: jsonb("on_transition")
      .$type<{
        notify?: string[];
        setAssignee?: string;
        setResolution?: string;
      }>()
      .default({}),
  },
  (table) => [
    index("workflow_transitions_workflow_id_idx").on(table.workflowId),
    uniqueIndex("workflow_transitions_unique_idx").on(
      table.workflowId,
      table.fromStatusId,
      table.toStatusId,
    ),
  ],
);

// ── Type Exports ─────────────────────────────────────────────────────

export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
export type WorkflowStatus = typeof workflowStatuses.$inferSelect;
export type NewWorkflowStatus = typeof workflowStatuses.$inferInsert;
export type WorkflowTransition = typeof workflowTransitions.$inferSelect;
export type NewWorkflowTransition = typeof workflowTransitions.$inferInsert;
