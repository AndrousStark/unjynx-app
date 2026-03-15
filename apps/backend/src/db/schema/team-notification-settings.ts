import {
  pgTable,
  uuid,
  boolean,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";
import { teams } from "./teams.js";

export const teamNotificationSettings = pgTable(
  "team_notification_settings",
  {
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    teamId: uuid("team_id")
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    taskAssigned: boolean("task_assigned").default(true).notNull(),
    taskCompleted: boolean("task_completed").default(true).notNull(),
    commentOnTask: boolean("comment_on_task").default(true).notNull(),
    projectUpdate: boolean("project_update").default(true).notNull(),
    dailyStandup: boolean("daily_standup").default(true).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.teamId] }),
  ],
);

export type TeamNotificationSetting =
  typeof teamNotificationSettings.$inferSelect;
export type NewTeamNotificationSetting =
  typeof teamNotificationSettings.$inferInsert;
