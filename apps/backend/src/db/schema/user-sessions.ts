import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";

export const userSessions = pgTable(
  "user_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    deviceType: text("device_type"),
    browser: text("browser"),
    os: text("os"),
    ipAddress: text("ip_address"),
    geoCountry: text("geo_country"),
    geoCity: text("geo_city"),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    isRevoked: boolean("is_revoked").default(false).notNull(),
  },
  (table) => [
    index("user_sessions_user_id_idx").on(table.userId),
    index("user_sessions_token_hash_idx").on(table.tokenHash),
    index("user_sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
