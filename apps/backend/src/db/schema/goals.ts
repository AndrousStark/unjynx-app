// ── Goals / OKRs ─────────────────────────────────────────────────────
//
// Hierarchical goal tracking:
//   Company goals → Team goals → Individual goals
//
// Goals can be linked to tasks — progress auto-calculates from
// linked task completion percentage.
//
// Supports OKR pattern:
//   Objective (parent goal) → Key Results (child goals with targets)

import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations.js";
import { profiles } from "./profiles.js";
import { tasks } from "./tasks.js";

// ── Goals ────────────────────────────────────────────────────────────

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    /** Goal title (Objective in OKR terms). */
    title: text("title").notNull(),
    description: text("description"),
    /** Parent goal for hierarchy (Company → Team → Individual). */
    parentId: uuid("parent_id"),
    /** Goal owner (person accountable). */
    ownerId: uuid("owner_id")
      .references(() => profiles.id, { onDelete: "set null" }),
    /** Target numeric value (e.g., 100 for "Complete 100 tasks"). */
    targetValue: numeric("target_value", { precision: 10, scale: 2 }),
    /** Current progress value (auto-calculated from linked tasks or manual). */
    currentValue: numeric("current_value", { precision: 10, scale: 2 }).default("0").notNull(),
    /** Unit of measurement (%, tasks, hours, revenue, etc.). */
    unit: text("unit").default("%").notNull(),
    /** Goal level for hierarchy filtering. */
    level: text("level").default("individual").notNull(),
    // Values: company, team, individual
    /** on_track, at_risk, behind, completed, cancelled */
    status: text("status").default("on_track").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    sortOrder: integer("sort_order").default(0).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("goals_org_id_idx").on(table.orgId),
    index("goals_owner_id_idx").on(table.ownerId),
    index("goals_parent_id_idx").on(table.parentId),
    index("goals_level_idx").on(table.orgId, table.level),
    index("goals_status_idx").on(table.orgId, table.status),
  ],
);

// ── Goal ↔ Task Links ────────────────────────────────────────────────
// When linked tasks are completed, goal progress auto-updates.

export const goalTaskLinks = pgTable(
  "goal_task_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    goalId: uuid("goal_id")
      .references(() => goals.id, { onDelete: "cascade" })
      .notNull(),
    taskId: uuid("task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("goal_task_links_goal_id_idx").on(table.goalId),
    index("goal_task_links_task_id_idx").on(table.taskId),
    index("goal_task_links_org_id_idx").on(table.orgId),
  ],
);

// ── Type Exports ─────────────────────────────────────────────────────

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type GoalTaskLink = typeof goalTaskLinks.$inferSelect;
export type NewGoalTaskLink = typeof goalTaskLinks.$inferInsert;
