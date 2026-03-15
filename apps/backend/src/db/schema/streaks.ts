import {
  pgTable,
  uuid,
  timestamp,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";

export const streaks = pgTable(
  "streaks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    currentStreak: integer("current_streak").default(0).notNull(),
    longestStreak: integer("longest_streak").default(0).notNull(),
    lastActiveDate: timestamp("last_active_date", { withTimezone: true }),
    frozenUntil: timestamp("frozen_until", { withTimezone: true }),
    isFrozen: boolean("is_frozen").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("streaks_user_id_idx").on(table.userId),
  ],
);

export type Streak = typeof streaks.$inferSelect;
export type NewStreak = typeof streaks.$inferInsert;
