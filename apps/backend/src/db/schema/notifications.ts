import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";
import { tasks } from "./tasks.js";
import { notificationCategoryEnum } from "./enums.js";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    taskId: uuid("task_id").references(() => tasks.id, {
      onDelete: "set null",
    }),
    type: notificationCategoryEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    actionUrl: text("action_url"),
    contentId: uuid("content_id"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    priority: integer("priority").default(5).notNull(),
    cascadeId: uuid("cascade_id"),
    cascadeOrder: integer("cascade_order").default(0).notNull(),
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_task_id_idx").on(table.taskId),
    index("notifications_scheduled_at_idx").on(table.scheduledAt),
    index("notifications_cascade_id_idx").on(table.cascadeId),
    index("notifications_type_scheduled_idx").on(
      table.type,
      table.scheduledAt,
    ),
  ],
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
