import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";

export const impersonationSessions = pgTable(
  "impersonation_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    targetUserId: uuid("target_user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    isRevoked: boolean("is_revoked").default(false).notNull(),
  },
  (table) => [
    index("impersonation_sessions_admin_id_idx").on(table.adminId),
    index("impersonation_sessions_target_user_id_idx").on(table.targetUserId),
    index("impersonation_sessions_token_hash_idx").on(table.tokenHash),
    index("impersonation_sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export type ImpersonationSession = typeof impersonationSessions.$inferSelect;
export type NewImpersonationSession = typeof impersonationSessions.$inferInsert;
