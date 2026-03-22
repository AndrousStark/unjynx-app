import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tasks } from "./tasks.js";
import { profiles } from "./profiles.js";

export const calendarEventMapping = pgTable(
  "calendar_event_mapping",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .references(() => tasks.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    provider: text("provider").default("google").notNull(),
    externalEventId: text("external_event_id").notNull(),
    calendarId: text("calendar_id").default("primary"),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("calendar_event_mapping_task_provider_idx").on(
      table.taskId,
      table.provider,
    ),
    index("calendar_event_mapping_task_id_idx").on(table.taskId),
    index("calendar_event_mapping_user_provider_idx").on(
      table.userId,
      table.provider,
    ),
  ],
);

export type CalendarEventMapping = typeof calendarEventMapping.$inferSelect;
export type NewCalendarEventMapping = typeof calendarEventMapping.$inferInsert;
