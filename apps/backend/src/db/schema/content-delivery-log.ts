import {
  pgTable,
  uuid,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";
import { dailyContent } from "./daily-content.js";
import { channelTypeEnum } from "./enums.js";

export const contentDeliveryLog = pgTable(
  "content_delivery_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    contentId: uuid("content_id")
      .references(() => dailyContent.id, { onDelete: "cascade" })
      .notNull(),
    channelType: channelTypeEnum("channel_type").notNull(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("content_delivery_user_idx").on(table.userId),
    index("content_delivery_content_idx").on(table.contentId),
    index("content_delivery_date_idx").on(table.deliveredAt),
  ],
);

export type ContentDeliveryLogEntry = typeof contentDeliveryLog.$inferSelect;
export type NewContentDeliveryLogEntry = typeof contentDeliveryLog.$inferInsert;
