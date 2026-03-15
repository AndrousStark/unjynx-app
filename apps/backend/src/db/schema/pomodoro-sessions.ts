import {
  pgTable,
  uuid,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";
import { tasks } from "./tasks.js";

export const pomodoroSessions = pgTable(
  "pomodoro_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    taskId: uuid("task_id").references(() => tasks.id, {
      onDelete: "set null",
    }),
    durationMinutes: integer("duration_minutes").default(25).notNull(),
    focusRating: integer("focus_rating"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("pomodoro_sessions_user_id_idx").on(table.userId),
    index("pomodoro_sessions_task_id_idx").on(table.taskId),
    index("pomodoro_sessions_started_idx").on(table.startedAt),
  ],
);

export type PomodoroSession = typeof pomodoroSessions.$inferSelect;
export type NewPomodoroSession = typeof pomodoroSessions.$inferInsert;
