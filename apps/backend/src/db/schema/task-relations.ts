// ── Task Relations (Watchers, Links, Time Entries) ───────────────────
//
// Supporting tables for Jira-like task management:
//   - Watchers: users subscribed to task updates
//   - Links: inter-task relationships (blocks, relates-to, duplicates)
//   - Time entries: logged work hours per task

import {
  pgTable,
  uuid,
  text,
  numeric,
  date,
  timestamp,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { tasks } from "./tasks.js";
import { profiles } from "./profiles.js";
import { organizations } from "./organizations.js";
import { issueLinkTypeEnum } from "./enums.js";

// ── Task Watchers ────────────────────────────────────────────────────

export const taskWatchers = pgTable(
  "task_watchers",
  {
    taskId: uuid("task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.userId] }),
    index("task_watchers_org_id_idx").on(table.orgId),
  ],
);

// ── Task Links (Issue Linking) ───────────────────────────────────────

export const taskLinks = pgTable(
  "task_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    sourceTaskId: uuid("source_task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    targetTaskId: uuid("target_task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    linkType: issueLinkTypeEnum("link_type").notNull(),
    createdBy: uuid("created_by")
      .references(() => profiles.id)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("task_links_org_id_idx").on(table.orgId),
    index("task_links_source_idx").on(table.sourceTaskId),
    index("task_links_target_idx").on(table.targetTaskId),
    uniqueIndex("task_links_unique_idx").on(
      table.sourceTaskId,
      table.targetTaskId,
      table.linkType,
    ),
  ],
);

// ── Time Entries ─────────────────────────────────────────────────────

export const timeEntries = pgTable(
  "time_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    taskId: uuid("task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    hours: numeric("hours", { precision: 8, scale: 2 }).notNull(),
    description: text("description"),
    loggedDate: date("logged_date").defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("time_entries_org_id_idx").on(table.orgId),
    index("time_entries_task_id_idx").on(table.taskId),
    index("time_entries_user_id_idx").on(table.userId),
    index("time_entries_date_idx").on(table.loggedDate),
  ],
);

// ── Task Activity Log ────────────────────────────────────────────────

export const taskActivity = pgTable(
  "task_activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    taskId: uuid("task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    /** Action performed: created, updated, status_changed, assigned, commented, linked, etc. */
    action: text("action").notNull(),
    /** Which field changed (for update actions). */
    fieldName: text("field_name"),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("task_activity_org_id_idx").on(table.orgId),
    index("task_activity_task_id_idx").on(table.taskId),
    index("task_activity_created_at_idx").on(table.createdAt),
  ],
);

// ── Type Exports ─────────────────────────────────────────────────────

export type TaskWatcher = typeof taskWatchers.$inferSelect;
export type TaskLink = typeof taskLinks.$inferSelect;
export type NewTaskLink = typeof taskLinks.$inferInsert;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type NewTimeEntry = typeof timeEntries.$inferInsert;
export type TaskActivityEntry = typeof taskActivity.$inferSelect;
export type NewTaskActivityEntry = typeof taskActivity.$inferInsert;
