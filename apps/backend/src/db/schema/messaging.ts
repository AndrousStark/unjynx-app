// ── Messaging (Slack-like Channels) ──────────────────────────────────
//
// Team communication channels within an organization:
//   - Public channels: visible to all org members
//   - Private channels: invite-only
//   - DMs: 1-on-1 direct messages
//   - Group DMs: multi-person direct messages
//
// Messages support threading, reactions, mentions, and file attachments.

import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { organizations } from "./organizations.js";
import { profiles } from "./profiles.js";

// ── Channel Types Enum (inline — avoid enum migration issues) ────────
// Stored as text, validated at application level.
// Values: public, private, dm, group_dm

// ── Messaging Channels ──────────────────────────────────────────────

export const msgChannels = pgTable(
  "msg_channels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    /** Channel name (null for DMs — auto-generated from participants). */
    name: text("name"),
    description: text("description"),
    /** public, private, dm, group_dm */
    channelType: text("channel_type").notNull().default("public"),
    /** Current topic / purpose of the channel. */
    topic: text("topic"),
    isArchived: boolean("is_archived").default(false).notNull(),
    createdBy: uuid("created_by")
      .references(() => profiles.id)
      .notNull(),
    /** For DMs: sorted array of participant user IDs (for dedup lookups). */
    dmUserIds: jsonb("dm_user_ids").$type<string[]>(),
    memberCount: integer("member_count").default(0).notNull(),
    messageCount: integer("message_count").default(0).notNull(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("msg_channels_org_id_idx").on(table.orgId),
    index("msg_channels_type_idx").on(table.orgId, table.channelType),
    uniqueIndex("msg_channels_org_name_idx").on(table.orgId, table.name),
  ],
);

// ── Channel Members ──────────────────────────────────────────────────

export const msgChannelMembers = pgTable(
  "msg_channel_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    channelId: uuid("channel_id")
      .references(() => msgChannels.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    /** Channel-level role (admin can manage members, pin messages). */
    role: text("role").default("member").notNull(),
    isMuted: boolean("is_muted").default(false).notNull(),
    /** Last message the user has read (for unread calculation). */
    lastReadAt: timestamp("last_read_at", { withTimezone: true }).defaultNow(),
    lastReadMessageId: uuid("last_read_message_id"),
    /** all = every message, mentions = @user/@channel only, none = silent */
    notificationPref: text("notification_pref").default("all").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("msg_channel_members_channel_user_idx").on(table.channelId, table.userId),
    index("msg_channel_members_org_id_idx").on(table.orgId),
    index("msg_channel_members_user_id_idx").on(table.userId),
  ],
);

// ── Messages ─────────────────────────────────────────────────────────

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    channelId: uuid("channel_id")
      .references(() => msgChannels.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id)
      .notNull(),
    content: text("content").notNull(),
    // ── Threading ────────────────────────────────────────────────────
    /** Parent message (thread root). Null = top-level message. */
    threadId: uuid("thread_id"),
    isThreadRoot: boolean("is_thread_root").default(false).notNull(),
    replyCount: integer("reply_count").default(0).notNull(),
    // ── Mentions ─────────────────────────────────────────────────────
    /** User IDs mentioned with @user. */
    mentionedUserIds: jsonb("mentioned_user_ids").$type<string[]>().default([]),
    /** Team IDs mentioned with @team. */
    mentionedTeamIds: jsonb("mentioned_team_ids").$type<string[]>().default([]),
    /** True if @channel or @here was used. */
    isChannelMention: boolean("is_channel_mention").default(false).notNull(),
    // ── State ────────────────────────────────────────────────────────
    isEdited: boolean("is_edited").default(false).notNull(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    hasAttachments: boolean("has_attachments").default(false).notNull(),
    /** Extra metadata (link previews, bot data, etc.) */
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("messages_org_id_idx").on(table.orgId),
    index("messages_channel_created_idx").on(table.channelId, table.createdAt),
    index("messages_thread_id_idx").on(table.threadId),
    index("messages_user_id_idx").on(table.userId),
    index("messages_mentions_idx").using("gin", table.mentionedUserIds),
    index("messages_fts_idx").using(
      "gin",
      sql`to_tsvector('english', coalesce(${table.content}, ''))`,
    ),
  ],
);

// ── Message Reactions ────────────────────────────────────────────────

export const messageReactions = pgTable(
  "message_reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    messageId: uuid("message_id")
      .references(() => messages.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    emoji: text("emoji").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("message_reactions_unique_idx").on(table.messageId, table.userId, table.emoji),
    index("message_reactions_message_idx").on(table.messageId),
  ],
);

// ── Pinned Messages ──────────────────────────────────────────────────

export const pinnedMessages = pgTable(
  "pinned_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    channelId: uuid("channel_id")
      .references(() => msgChannels.id, { onDelete: "cascade" })
      .notNull(),
    messageId: uuid("message_id")
      .references(() => messages.id, { onDelete: "cascade" })
      .notNull(),
    pinnedBy: uuid("pinned_by")
      .references(() => profiles.id)
      .notNull(),
    pinnedAt: timestamp("pinned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("pinned_messages_unique_idx").on(table.channelId, table.messageId),
    index("pinned_messages_channel_idx").on(table.channelId),
  ],
);

// ── Type Exports ─────────────────────────────────────────────────────

export type MsgChannel = typeof msgChannels.$inferSelect;
export type NewMsgChannel = typeof msgChannels.$inferInsert;
export type MsgChannelMember = typeof msgChannelMembers.$inferSelect;
export type NewMsgChannelMember = typeof msgChannelMembers.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type PinnedMessage = typeof pinnedMessages.$inferSelect;
