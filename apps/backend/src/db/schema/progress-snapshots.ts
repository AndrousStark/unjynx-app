import {
  pgTable,
  uuid,
  timestamp,
  integer,
  real,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";

export const progressSnapshots = pgTable(
  "progress_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    snapshotDate: timestamp("snapshot_date", { withTimezone: true }).notNull(),
    tasksCompleted: integer("tasks_completed").default(0).notNull(),
    tasksCreated: integer("tasks_created").default(0).notNull(),
    focusMinutes: integer("focus_minutes").default(0).notNull(),
    completionRate: real("completion_rate").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("progress_snapshots_user_id_idx").on(table.userId),
    index("progress_snapshots_date_idx").on(table.snapshotDate),
  ],
);

export type ProgressSnapshot = typeof progressSnapshots.$inferSelect;
export type NewProgressSnapshot = typeof progressSnapshots.$inferInsert;
