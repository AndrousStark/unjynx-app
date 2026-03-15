import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { contentCategoryEnum } from "./enums.js";

export const dailyContent = pgTable(
  "daily_content",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    category: contentCategoryEnum("category").notNull(),
    content: text("content").notNull(),
    author: text("author"),
    source: text("source"),
    sortWeight: integer("sort_weight").default(1).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("daily_content_category_idx").on(table.category),
    index("daily_content_active_idx").on(table.isActive),
  ],
);

export type DailyContentItem = typeof dailyContent.$inferSelect;
export type NewDailyContentItem = typeof dailyContent.$inferInsert;
