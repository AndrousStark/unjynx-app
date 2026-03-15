import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { notifications } from "./notifications.js";
import { channelTypeEnum, notificationStatusEnum } from "./enums.js";

export const deliveryAttempts = pgTable(
  "delivery_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    notificationId: uuid("notification_id")
      .references(() => notifications.id, { onDelete: "cascade" })
      .notNull(),
    channel: channelTypeEnum("channel").notNull(),
    provider: text("provider").notNull(),
    status: notificationStatusEnum("status").default("pending").notNull(),
    queuedAt: timestamp("queued_at", { withTimezone: true }),
    processingAt: timestamp("processing_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    providerMessageId: text("provider_message_id"),
    deliveryLatencyMs: integer("delivery_latency_ms"),
    attemptNumber: integer("attempt_number").default(1).notNull(),
    maxAttempts: integer("max_attempts").default(3).notNull(),
    nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
    errorType: text("error_type"),
    errorMessage: text("error_message"),
    errorCode: text("error_code"),
    userAction: text("user_action"),
    userActionAt: timestamp("user_action_at", { withTimezone: true }),
    costAmount: text("cost_amount"),
    costCurrency: text("cost_currency").default("USD"),
    bullmqJobId: text("bullmq_job_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("delivery_attempts_notification_id_idx").on(table.notificationId),
    index("delivery_attempts_channel_idx").on(table.channel),
    index("delivery_attempts_status_idx").on(table.status),
    index("delivery_attempts_provider_msg_idx").on(table.providerMessageId),
    index("delivery_attempts_channel_status_idx").on(
      table.channel,
      table.status,
    ),
  ],
);

export type DeliveryAttempt = typeof deliveryAttempts.$inferSelect;
export type NewDeliveryAttempt = typeof deliveryAttempts.$inferInsert;
