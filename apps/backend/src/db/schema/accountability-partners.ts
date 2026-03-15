import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";
import { partnerStatusEnum, goalMetricEnum } from "./enums.js";

export const accountabilityPartners = pgTable(
  "accountability_partners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    partnerId: uuid("partner_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    status: partnerStatusEnum("status").default("pending").notNull(),
    inviteCode: text("invite_code").unique(),
    sharedGoalId: uuid("shared_goal_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("accountability_user_partner_idx").on(
      table.userId,
      table.partnerId,
    ),
    index("accountability_user_id_idx").on(table.userId),
    index("accountability_partner_id_idx").on(table.partnerId),
  ],
);

export const nudges = pgTable(
  "nudges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: uuid("sender_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    receiverId: uuid("receiver_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    partnershipId: uuid("partnership_id")
      .references(() => accountabilityPartners.id, { onDelete: "cascade" })
      .notNull(),
    message: text("message").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("nudges_sender_id_idx").on(table.senderId),
    index("nudges_receiver_id_idx").on(table.receiverId),
    index("nudges_partnership_id_idx").on(table.partnershipId),
  ],
);

export const sharedGoals = pgTable(
  "shared_goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    targetValue: integer("target_value").notNull(),
    metric: goalMetricEnum("metric").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export const sharedGoalProgress = pgTable(
  "shared_goal_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    goalId: uuid("goal_id")
      .references(() => sharedGoals.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    currentValue: integer("current_value").default(0).notNull(),
    lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("shared_goal_progress_goal_id_idx").on(table.goalId),
    index("shared_goal_progress_user_id_idx").on(table.userId),
  ],
);

export type AccountabilityPartner = typeof accountabilityPartners.$inferSelect;
export type NewAccountabilityPartner = typeof accountabilityPartners.$inferInsert;
export type Nudge = typeof nudges.$inferSelect;
export type NewNudge = typeof nudges.$inferInsert;
export type SharedGoal = typeof sharedGoals.$inferSelect;
export type NewSharedGoal = typeof sharedGoals.$inferInsert;
export type SharedGoalProgress = typeof sharedGoalProgress.$inferSelect;
export type NewSharedGoalProgress = typeof sharedGoalProgress.$inferInsert;
