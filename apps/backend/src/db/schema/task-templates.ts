import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";
import { taskPriorityEnum } from "./enums.js";

export const taskTemplates = pgTable(
  "task_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    priority: taskPriorityEnum("priority").default("none"),
    isGlobal: boolean("is_global").default(false).notNull(),
    category: text("category"),
    subtasks: text("subtasks"),
    usageCount: integer("usage_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("task_templates_user_id_idx").on(table.userId),
    index("task_templates_global_idx").on(table.isGlobal),
    index("task_templates_category_idx").on(table.category),
  ],
);

export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type NewTaskTemplate = typeof taskTemplates.$inferInsert;
