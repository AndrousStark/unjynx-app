import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { profiles } from "./profiles.js";
import { projects } from "./projects.js";
import { organizations } from "./organizations.js";
import { taskStatusEnum, taskPriorityEnum } from "./enums.js";

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Organization this task belongs to (null = legacy/unassigned). */
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    /** Parent task for hierarchy (Epic → Story → Task → Subtask). */
    parentId: uuid("parent_id"),
    title: text("title").notNull(),
    description: text("description"),
    status: taskStatusEnum("status").default("pending").notNull(),
    priority: taskPriorityEnum("priority").default("none").notNull(),
    /** Assignee — the person doing the work. */
    assigneeId: uuid("assignee_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    rrule: text("rrule"),
    sortOrder: integer("sort_order").default(0).notNull(),
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
    index("tasks_parent_id_idx").on(table.parentId),
    index("tasks_status_idx").on(table.status),
    index("tasks_user_status_idx").on(table.userId, table.status),
    index("tasks_org_status_idx").on(table.orgId, table.status),
    index("tasks_org_assignee_idx").on(table.orgId, table.assigneeId),
    index("tasks_user_status_due_idx").on(table.userId, table.status, table.dueDate),
    index("tasks_fts_idx").using(
      "gin",
      sql`to_tsvector('english', coalesce(${table.title}, '') || ' ' || coalesce(${table.description}, ''))`,
    ),
  ],
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
