import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";
import { channelTypeEnum } from "./enums.js";

export const notificationPreferences = pgTable("notification_preferences", {
  userId: uuid("user_id")
    .references(() => profiles.id, { onDelete: "cascade" })
    .primaryKey(),
  primaryChannel: channelTypeEnum("primary_channel").default("push").notNull(),
  fallbackChannel: channelTypeEnum("fallback_channel"),
  fallbackChain: text("fallback_chain"),
  quietStart: text("quiet_start"),
  quietEnd: text("quiet_end"),
  timezone: text("timezone").default("UTC").notNull(),
  maxRemindersPerDay: integer("max_reminders_per_day").default(20).notNull(),
  digestMode: text("digest_mode").default("off").notNull(),
  advanceReminderMinutes: integer("advance_reminder_minutes")
    .default(15)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type NotificationPreference =
  typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference =
  typeof notificationPreferences.$inferInsert;
