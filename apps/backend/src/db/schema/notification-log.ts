import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";
import { tasks } from "./tasks.js";
import {
  channelTypeEnum,
  notificationStatusEnum,
  notificationCategoryEnum,
} from "./enums.js";

export const notificationLog = pgTable(
  "notification_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    taskId: uuid("task_id").references(() => tasks.id, {
      onDelete: "set null",
    }),
    channelType: channelTypeEnum("channel_type").notNull(),
    category: notificationCategoryEnum("category").notNull(),
    status: notificationStatusEnum("status").default("pending").notNull(),
    messageContent: text("message_content"),
    externalId: text("external_id"),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("notification_log_user_id_idx").on(table.userId),
    index("notification_log_task_id_idx").on(table.taskId),
    index("notification_log_status_idx").on(table.status),
    index("notification_log_created_idx").on(table.createdAt),
  ],
);

export type NotificationLogEntry = typeof notificationLog.$inferSelect;
export type NewNotificationLogEntry = typeof notificationLog.$inferInsert;
