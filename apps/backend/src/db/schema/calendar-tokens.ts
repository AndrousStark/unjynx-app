import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";

export const calendarTokens = pgTable(
  "calendar_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    provider: text("provider").default("google").notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    calendarId: text("calendar_id").default("primary"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("calendar_tokens_user_provider_idx").on(
      table.userId,
      table.provider,
    ),
  ],
);

export type CalendarToken = typeof calendarTokens.$inferSelect;
export type NewCalendarToken = typeof calendarTokens.$inferInsert;
