import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";
import { channelTypeEnum } from "./enums.js";

export const notificationChannels = pgTable(
  "notification_channels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    channelType: channelTypeEnum("channel_type").notNull(),
    channelIdentifier: text("channel_identifier").notNull(),
    isVerified: boolean("is_verified").default(false).notNull(),
    isEnabled: boolean("is_enabled").default(true).notNull(),
    metadata: text("metadata"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("notification_channels_user_type_idx").on(
      table.userId,
      table.channelType,
    ),
    index("notification_channels_user_id_idx").on(table.userId),
  ],
);

export type NotificationChannel = typeof notificationChannels.$inferSelect;
export type NewNotificationChannel = typeof notificationChannels.$inferInsert;
