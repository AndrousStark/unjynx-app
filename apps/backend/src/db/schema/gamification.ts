import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { profiles } from "./profiles.js";
import { xpSourceEnum, challengeTypeEnum, challengeStatusEnum } from "./enums.js";

export const userXp = pgTable(
  "user_xp",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .unique()
      .notNull(),
    totalXp: integer("total_xp").default(0).notNull(),
    level: integer("level").default(1).notNull(),
    lastXpEarnedAt: timestamp("last_xp_earned_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("user_xp_user_id_idx").on(table.userId),
  ],
);

export const xpTransactions = pgTable(
  "xp_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    amount: integer("amount").notNull(),
    source: xpSourceEnum("source").notNull(),
    sourceId: uuid("source_id"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("xp_transactions_user_id_idx").on(table.userId),
    index("xp_transactions_created_idx").on(table.createdAt),
  ],
);

export const achievements = pgTable(
  "achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").unique().notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    xpReward: integer("xp_reward").default(0).notNull(),
    iconSvg: text("icon_svg"),
    requiredValue: integer("required_value").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export const userAchievements = pgTable(
  "user_achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    achievementId: uuid("achievement_id")
      .references(() => achievements.id, { onDelete: "cascade" })
      .notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    notified: boolean("notified").default(false).notNull(),
  },
  (table) => [
    index("user_achievements_user_id_idx").on(table.userId),
  ],
);

export const challenges = pgTable(
  "challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorId: uuid("creator_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    opponentId: uuid("opponent_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    type: challengeTypeEnum("type").notNull(),
    targetValue: integer("target_value").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    winnerId: uuid("winner_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    status: challengeStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("challenges_creator_id_idx").on(table.creatorId),
    index("challenges_opponent_id_idx").on(table.opponentId),
    index("challenges_status_idx").on(table.status),
  ],
);

// Legacy table kept for backward compatibility
export const gamificationXp = pgTable(
  "gamification_xp",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    amount: integer("amount").notNull(),
    source: xpSourceEnum("source").notNull(),
    reason: text("reason"),
    entityId: uuid("entity_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("gamification_xp_user_id_idx").on(table.userId),
    index("gamification_xp_created_idx").on(table.createdAt),
  ],
);

export type UserXp = typeof userXp.$inferSelect;
export type NewUserXp = typeof userXp.$inferInsert;
export type XpTransaction = typeof xpTransactions.$inferSelect;
export type NewXpTransaction = typeof xpTransactions.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;
export type Challenge = typeof challenges.$inferSelect;
export type NewChallenge = typeof challenges.$inferInsert;
export type GamificationXp = typeof gamificationXp.$inferSelect;
export type NewGamificationXp = typeof gamificationXp.$inferInsert;
