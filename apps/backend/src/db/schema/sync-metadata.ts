import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";
import { syncOperationEnum } from "./enums.js";

export const syncMetadata = pgTable(
  "sync_metadata",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    operation: syncOperationEnum("operation").notNull(),
    clientTimestamp: timestamp("client_timestamp", { withTimezone: true })
      .notNull(),
    serverTimestamp: timestamp("server_timestamp", { withTimezone: true })
      .defaultNow()
      .notNull(),
    deviceId: text("device_id"),
  },
  (table) => [
    index("sync_metadata_user_id_idx").on(table.userId),
    index("sync_metadata_entity_idx").on(table.entityType, table.entityId),
    uniqueIndex("sync_metadata_user_entity_idx").on(
      table.userId,
      table.entityType,
      table.entityId,
    ),
  ],
);

export type SyncMetadataEntry = typeof syncMetadata.$inferSelect;
export type NewSyncMetadataEntry = typeof syncMetadata.$inferInsert;
