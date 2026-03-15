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
import { taskPriorityEnum, userPlanEnum, channelTypeEnum } from "./enums.js";

export const userSettings = pgTable(
  "user_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    plan: userPlanEnum("plan").default("free").notNull(),
    defaultPriority: taskPriorityEnum("default_priority").default("none"),
    defaultProjectId: uuid("default_project_id"),
    startOfWeek: integer("start_of_week").default(1).notNull(),
    notificationsEnabled: boolean("notifications_enabled")
      .default(true)
      .notNull(),
    primaryChannel: channelTypeEnum("primary_channel").default("push"),
    quietHoursStart: text("quiet_hours_start"),
    quietHoursEnd: text("quiet_hours_end"),
    maxRemindersPerDay: integer("max_reminders_per_day").default(10).notNull(),
    digestMode: text("digest_mode").default("off"),
    defaultReminderMinutes: integer("default_reminder_minutes")
      .default(30)
      .notNull(),
    autoArchiveDays: integer("auto_archive_days").default(30).notNull(),
    theme: text("theme").default("dark"),
    gamificationEnabled: boolean("gamification_enabled")
      .default(false)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("user_settings_user_id_idx").on(table.userId),
  ],
);

export type UserSettingsRow = typeof userSettings.$inferSelect;
export type NewUserSettingsRow = typeof userSettings.$inferInsert;
