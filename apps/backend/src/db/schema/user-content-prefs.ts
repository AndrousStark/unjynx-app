import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";
import { contentCategoryEnum } from "./enums.js";

export const userContentPrefs = pgTable(
  "user_content_prefs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    category: contentCategoryEnum("category").notNull(),
    deliveryTime: text("delivery_time").default("08:00"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("user_content_prefs_user_category_idx").on(
      table.userId,
      table.category,
    ),
  ],
);

export type UserContentPref = typeof userContentPrefs.$inferSelect;
export type NewUserContentPref = typeof userContentPrefs.$inferInsert;
