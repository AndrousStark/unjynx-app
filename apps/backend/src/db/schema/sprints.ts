// ── Sprints / Cycles ─────────────────────────────────────────────────
//
// Sprint management for Scrum projects:
//   - Sprint CRUD with goal, dates, status
//   - Sprint ↔ Task membership (many-to-many)
//   - Daily burndown snapshots for charts
//
// Sprint lifecycle: planning → active → completed/cancelled

import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  date,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations.js";
import { projects } from "./projects.js";
import { tasks } from "./tasks.js";
import { sprintStatusEnum } from "./enums.js";

// ── Sprints ──────────────────────────────────────────────────────────

export const sprints = pgTable(
  "sprints",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    goal: text("goal"),
    status: sprintStatusEnum("status").default("planning").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    /** Total points committed at sprint start. */
    committedPoints: integer("committed_points").default(0).notNull(),
    /** Points completed during the sprint. */
    completedPoints: integer("completed_points").default(0).notNull(),
    /** Retrospective: what went well. */
    retroWentWell: text("retro_went_well"),
    /** Retrospective: what to improve. */
    retroToImprove: text("retro_to_improve"),
    /** Retrospective: action items. */
    retroActionItems: jsonb("retro_action_items")
      .$type<string[]>()
      .default([]),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("sprints_org_id_idx").on(table.orgId),
    index("sprints_project_id_idx").on(table.projectId),
    index("sprints_status_idx").on(table.status),
    index("sprints_org_project_status_idx").on(table.orgId, table.projectId, table.status),
  ],
);

// ── Sprint Tasks (many-to-many) ──────────────────────────────────────

export const sprintTasks = pgTable(
  "sprint_tasks",
  {
    sprintId: uuid("sprint_id")
      .references(() => sprints.id, { onDelete: "cascade" })
      .notNull(),
    taskId: uuid("task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    addedAt: timestamp("added_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    /** Set when task is removed from sprint (soft removal for history). */
    removedAt: timestamp("removed_at", { withTimezone: true }),
  },
  (table) => [
    primaryKey({ columns: [table.sprintId, table.taskId] }),
    index("sprint_tasks_org_id_idx").on(table.orgId),
    index("sprint_tasks_task_id_idx").on(table.taskId),
  ],
);

// ── Sprint Burndown Snapshots ────────────────────────────────────────

export const sprintBurndown = pgTable(
  "sprint_burndown",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    sprintId: uuid("sprint_id")
      .references(() => sprints.id, { onDelete: "cascade" })
      .notNull(),
    /** Date of the snapshot (one per day). */
    capturedAt: date("captured_at").notNull(),
    /** Total story points in the sprint on this day. */
    totalPoints: integer("total_points").default(0).notNull(),
    /** Story points completed by this day. */
    completedPoints: integer("completed_points").default(0).notNull(),
    /** Story points remaining on this day. */
    remainingPoints: integer("remaining_points").default(0).notNull(),
    /** Points added mid-sprint (scope creep). */
    addedPoints: integer("added_points").default(0).notNull(),
    /** Points removed mid-sprint. */
    removedPoints: integer("removed_points").default(0).notNull(),
  },
  (table) => [
    index("sprint_burndown_org_id_idx").on(table.orgId),
    index("sprint_burndown_sprint_id_idx").on(table.sprintId),
    uniqueIndex("sprint_burndown_sprint_date_idx").on(table.sprintId, table.capturedAt),
  ],
);

// ── Type Exports ─────────────────────────────────────────────────────

export type Sprint = typeof sprints.$inferSelect;
export type NewSprint = typeof sprints.$inferInsert;
export type SprintTask = typeof sprintTasks.$inferSelect;
export type NewSprintTask = typeof sprintTasks.$inferInsert;
export type SprintBurndownEntry = typeof sprintBurndown.$inferSelect;
export type NewSprintBurndownEntry = typeof sprintBurndown.$inferInsert;
