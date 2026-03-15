import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";
import { ritualTypeEnum } from "./enums.js";

export const rituals = pgTable(
  "rituals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    type: ritualTypeEnum("type").notNull(),
    mood: integer("mood"),
    gratitude: text("gratitude"),
    intention: text("intention"),
    reflection: text("reflection"),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("rituals_user_id_idx").on(table.userId),
    index("rituals_type_idx").on(table.type),
    index("rituals_completed_idx").on(table.completedAt),
  ],
);

export type Ritual = typeof rituals.$inferSelect;
export type NewRitual = typeof rituals.$inferInsert;
