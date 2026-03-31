import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { profiles } from "./profiles.js";
import { projects } from "./projects.js";
import { organizations } from "./organizations.js";
import { taskStatusEnum, taskPriorityEnum, taskTypeEnum } from "./enums.js";

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    /** Jira-style issue key: UNJX-42, PROJ-123. Unique within org. */
    issueKey: text("issue_key"),
    title: text("title").notNull(),
    description: text("description"),
    /** Issue type for Jira-like hierarchy. */
    taskType: taskTypeEnum("task_type").default("task").notNull(),
    /** Legacy status (kept for backwards compat). Use statusId for workflow-based status. */
    status: taskStatusEnum("status").default("pending").notNull(),
    /** Workflow-based status ID. Null = use legacy status enum. */
    statusId: uuid("status_id"),
    priority: taskPriorityEnum("priority").default("none").notNull(),
    // ── Hierarchy ────────────────────────────────────────────────────
    /** Parent task (Epic → Story → Task → Subtask). */
    parentId: uuid("parent_id"),
    /** Epic this task belongs to (shortcut — avoids tree traversal). */
    epicId: uuid("epic_id"),
    // ── Assignment ───────────────────────────────────────────────────
    /** Person doing the work. */
    assigneeId: uuid("assignee_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    /** Person who created / reported the issue. */
    reporterId: uuid("reporter_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    /** Code reviewer or approver. */
    reviewerId: uuid("reviewer_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    // ── Sprint ───────────────────────────────────────────────────────
    sprintId: uuid("sprint_id"),
    // ── Time Tracking ────────────────────────────────────────────────
    /** Story points estimate. */
    estimatePoints: integer("estimate_points"),
    /** Hours estimate. */
    estimateHours: numeric("estimate_hours", { precision: 8, scale: 2 }),
    /** Hours already logged. */
    loggedHours: numeric("logged_hours", { precision: 8, scale: 2 }).default("0").notNull(),
    /** Hours remaining. */
    remainingHours: numeric("remaining_hours", { precision: 8, scale: 2 }),
    // ── Dates ────────────────────────────────────────────────────────
    startDate: timestamp("start_date", { withTimezone: true }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    /** Resolution reason when completed (done, wontfix, duplicate, cannot_reproduce). */
    resolution: text("resolution"),
    // ── Custom Fields ────────────────────────────────────────────────
    /** JSONB bag for mode-specific or org-specific custom field values. */
    customFields: jsonb("custom_fields")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    // ── Metadata ─────────────────────────────────────────────────────
    rrule: text("rrule"),
    sortOrder: integer("sort_order").default(0).notNull(),
    voteCount: integer("vote_count").default(0).notNull(),
    watcherCount: integer("watcher_count").default(0).notNull(),
    commentCount: integer("comment_count").default(0).notNull(),
    attachmentCount: integer("attachment_count").default(0).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("tasks_org_id_idx").on(table.orgId),
    index("tasks_user_id_idx").on(table.userId),
    index("tasks_project_id_idx").on(table.projectId),
    index("tasks_assignee_id_idx").on(table.assigneeId),
    index("tasks_reporter_id_idx").on(table.reporterId),
    index("tasks_parent_id_idx").on(table.parentId),
    index("tasks_epic_id_idx").on(table.epicId),
    index("tasks_sprint_id_idx").on(table.sprintId),
    index("tasks_status_idx").on(table.status),
    index("tasks_status_id_idx").on(table.statusId),
    index("tasks_task_type_idx").on(table.taskType),
    index("tasks_user_status_idx").on(table.userId, table.status),
    index("tasks_org_status_idx").on(table.orgId, table.status),
    index("tasks_org_assignee_idx").on(table.orgId, table.assigneeId),
    index("tasks_org_sprint_idx").on(table.orgId, table.sprintId),
    index("tasks_org_type_idx").on(table.orgId, table.taskType),
    index("tasks_user_status_due_idx").on(table.userId, table.status, table.dueDate),
    index("tasks_org_due_idx").on(table.orgId, table.dueDate),
    uniqueIndex("tasks_org_issue_key_idx").on(table.orgId, table.issueKey),
    index("tasks_fts_idx").using(
      "gin",
      sql`to_tsvector('english', coalesce(${table.title}, '') || ' ' || coalesce(${table.description}, ''))`,
    ),
  ],
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
