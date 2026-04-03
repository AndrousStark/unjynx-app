import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { adminRoleEnum } from "./enums.js";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  logtoId: text("logto_id").unique(),
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  timezone: text("timezone").default("Asia/Kolkata"),
  adminRole: adminRoleEnum("admin_role"),
  isBanned: boolean("is_banned").default(false).notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  accountStatus: text("account_status").notNull().default("active"),
  gracePeriodEndsAt: timestamp("grace_period_ends_at", {
    withTimezone: true,
  }),
  suspendedReason: text("suspended_reason"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
