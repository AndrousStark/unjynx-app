// ── Messaging Service ────────────────────────────────────────────────
//
// Slack-like team communication:
//   - Channel CRUD (public, private, DM, group DM)
//   - Messages with threading, mentions, reactions
//   - Pinned messages
//   - Unread tracking
//   - Full-text search

import { eq, and, desc, gt, sql, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  msgChannels,
  msgChannelMembers,
  messages,
  messageReactions,
  pinnedMessages,
  profiles,
  type MsgChannel,
  type MsgChannelMember,
  type Message,
  type MessageReaction,
  type PinnedMessage,
} from "../../db/schema/index.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "messaging" });

// ── Channel CRUD ─────────────────────────────────────────────────────

export async function createChannel(
  orgId: string,
  createdBy: string,
  data: {
    name: string;
    description?: string;
    channelType?: string;
    topic?: string;
  },
): Promise<MsgChannel> {
  const [channel] = await db
    .insert(msgChannels)
    .values({
      orgId,
      name: data.name,
      description: data.description,
      channelType: data.channelType ?? "public",
      topic: data.topic,
      createdBy,
      memberCount: 1,
    })
    .returning();

  // Auto-add creator as admin member
  await db.insert(msgChannelMembers).values({
    orgId,
    channelId: channel.id,
    userId: createdBy,
    role: "admin",
  });

  log.info({ orgId, channelId: channel.id, name: data.name }, "Channel created");
  return channel;
}

export async function getChannels(
  orgId: string,
  userId: string,
): Promise<readonly (MsgChannel & { isJoined: boolean })[]> {
  // Get all public channels + channels user is a member of
  const allChannels = await db
    .select()
    .from(msgChannels)
    .where(and(eq(msgChannels.orgId, orgId), eq(msgChannels.isArchived, false)))
    .orderBy(msgChannels.name);

  const userMemberships = await db
    .select({ channelId: msgChannelMembers.channelId })
    .from(msgChannelMembers)
    .where(and(eq(msgChannelMembers.orgId, orgId), eq(msgChannelMembers.userId, userId)));

  const joinedIds = new Set(userMemberships.map((m) => m.channelId));

  return allChannels
    .filter((ch) => ch.channelType === "public" || joinedIds.has(ch.id))
    .map((ch) => ({ ...ch, isJoined: joinedIds.has(ch.id) }));
}

export async function getChannel(channelId: string): Promise<MsgChannel | null> {
  const [channel] = await db
    .select()
    .from(msgChannels)
    .where(eq(msgChannels.id, channelId))
    .limit(1);
  return channel ?? null;
}

export async function updateChannel(
  channelId: string,
  data: { name?: string; description?: string; topic?: string },
): Promise<MsgChannel> {
  const [updated] = await db
    .update(msgChannels)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(msgChannels.id, channelId))
    .returning();
  if (!updated) throw new Error("Channel not found");
  return updated;
}

export async function archiveChannel(channelId: string): Promise<MsgChannel> {
  const [archived] = await db
    .update(msgChannels)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(eq(msgChannels.id, channelId))
    .returning();
  if (!archived) throw new Error("Channel not found");
  return archived;
}

// ── DM Channels ──────────────────────────────────────────────────────

export async function getOrCreateDm(
  orgId: string,
  userIds: readonly string[],
): Promise<MsgChannel> {
  // Sort user IDs for consistent dedup
  const sorted = [...userIds].sort();
  const channelType = sorted.length === 2 ? "dm" : "group_dm";

  // Check if DM already exists
  const existing = await db
    .select()
    .from(msgChannels)
    .where(
      and(
        eq(msgChannels.orgId, orgId),
        eq(msgChannels.channelType, channelType),
        sql`${msgChannels.dmUserIds}::jsonb = ${JSON.stringify(sorted)}::jsonb`,
      ),
    )
    .limit(1);

  if (existing.length > 0) return existing[0];

  // Create new DM channel
  const [channel] = await db
    .insert(msgChannels)
    .values({
      orgId,
      channelType,
      createdBy: sorted[0],
      dmUserIds: sorted,
      memberCount: sorted.length,
    })
    .returning();

  // Add all participants as members
  await db.insert(msgChannelMembers).values(
    sorted.map((uid) => ({
      orgId,
      channelId: channel.id,
      userId: uid,
      role: "member" as const,
    })),
  );

  return channel;
}

// ── Channel Members ──────────────────────────────────────────────────

export async function joinChannel(
  orgId: string,
  channelId: string,
  userId: string,
): Promise<MsgChannelMember> {
  const [member] = await db
    .insert(msgChannelMembers)
    .values({ orgId, channelId, userId })
    .onConflictDoNothing()
    .returning();

  if (member) {
    await db
      .update(msgChannels)
      .set({ memberCount: sql`${msgChannels.memberCount} + 1` })
      .where(eq(msgChannels.id, channelId));
  }

  return member ?? (await getChannelMember(channelId, userId))!;
}

export async function leaveChannel(
  channelId: string,
  userId: string,
): Promise<void> {
  const [deleted] = await db
    .delete(msgChannelMembers)
    .where(
      and(
        eq(msgChannelMembers.channelId, channelId),
        eq(msgChannelMembers.userId, userId),
      ),
    )
    .returning({ id: msgChannelMembers.id });

  if (deleted) {
    await db
      .update(msgChannels)
      .set({ memberCount: sql`GREATEST(${msgChannels.memberCount} - 1, 0)` })
      .where(eq(msgChannels.id, channelId));
  }
}

export async function getChannelMembers(
  channelId: string,
): Promise<readonly MsgChannelMember[]> {
  return db
    .select()
    .from(msgChannelMembers)
    .where(eq(msgChannelMembers.channelId, channelId))
    .orderBy(msgChannelMembers.joinedAt);
}

async function getChannelMember(
  channelId: string,
  userId: string,
): Promise<MsgChannelMember | null> {
  const [member] = await db
    .select()
    .from(msgChannelMembers)
    .where(
      and(
        eq(msgChannelMembers.channelId, channelId),
        eq(msgChannelMembers.userId, userId),
      ),
    )
    .limit(1);
  return member ?? null;
}

// ── Messages ─────────────────────────────────────────────────────────

export async function sendMessage(
  orgId: string,
  channelId: string,
  userId: string,
  data: {
    content: string;
    threadId?: string;
    mentionedUserIds?: string[];
    mentionedTeamIds?: string[];
    isChannelMention?: boolean;
  },
): Promise<Message> {
  const isReply = !!data.threadId;

  const [message] = await db
    .insert(messages)
    .values({
      orgId,
      channelId,
      userId,
      content: data.content,
      threadId: data.threadId,
      mentionedUserIds: data.mentionedUserIds ?? [],
      mentionedTeamIds: data.mentionedTeamIds ?? [],
      isChannelMention: data.isChannelMention ?? false,
    })
    .returning();

  // Update channel stats
  await db
    .update(msgChannels)
    .set({
      messageCount: sql`${msgChannels.messageCount} + 1`,
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(msgChannels.id, channelId));

  // If reply, increment parent's reply count + mark as thread root
  if (isReply && data.threadId) {
    await db
      .update(messages)
      .set({
        replyCount: sql`${messages.replyCount} + 1`,
        isThreadRoot: true,
      })
      .where(eq(messages.id, data.threadId));
  }

  return message;
}

export async function getMessages(
  channelId: string,
  options?: { limit?: number; before?: string; threadId?: string },
): Promise<readonly Message[]> {
  const limit = options?.limit ?? 50;
  const conditions = [eq(messages.channelId, channelId), eq(messages.isDeleted, false)];

  if (options?.threadId) {
    // Get thread replies
    conditions.push(eq(messages.threadId, options.threadId));
  } else {
    // Get top-level messages only (not thread replies)
    conditions.push(isNull(messages.threadId));
  }

  if (options?.before) {
    const [beforeMsg] = await db
      .select({ createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.id, options.before))
      .limit(1);

    if (beforeMsg) {
      conditions.push(sql`${messages.createdAt} < ${beforeMsg.createdAt}`);
    }
  }

  return db
    .select()
    .from(messages)
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}

export async function editMessage(
  messageId: string,
  userId: string,
  content: string,
): Promise<Message> {
  const [updated] = await db
    .update(messages)
    .set({
      content,
      isEdited: true,
      editedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(messages.id, messageId), eq(messages.userId, userId)))
    .returning();

  if (!updated) throw new Error("Message not found or not authorized");
  return updated;
}

export async function deleteMessage(
  messageId: string,
  userId: string,
): Promise<void> {
  const [deleted] = await db
    .update(messages)
    .set({ isDeleted: true, deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(messages.id, messageId), eq(messages.userId, userId)))
    .returning({ id: messages.id });

  if (!deleted) throw new Error("Message not found or not authorized");
}

// ── Reactions ────────────────────────────────────────────────────────

export async function addReaction(
  orgId: string,
  messageId: string,
  userId: string,
  emoji: string,
): Promise<MessageReaction> {
  const [reaction] = await db
    .insert(messageReactions)
    .values({ orgId, messageId, userId, emoji })
    .onConflictDoNothing()
    .returning();

  return reaction ?? { id: "", orgId, messageId, userId, emoji, createdAt: new Date() };
}

export async function removeReaction(
  messageId: string,
  userId: string,
  emoji: string,
): Promise<void> {
  await db
    .delete(messageReactions)
    .where(
      and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.emoji, emoji),
      ),
    );
}

export async function getReactions(
  messageId: string,
): Promise<readonly MessageReaction[]> {
  return db
    .select()
    .from(messageReactions)
    .where(eq(messageReactions.messageId, messageId));
}

// ── Pinned Messages ──────────────────────────────────────────────────

export async function pinMessage(
  orgId: string,
  channelId: string,
  messageId: string,
  pinnedBy: string,
): Promise<PinnedMessage> {
  const [pin] = await db
    .insert(pinnedMessages)
    .values({ orgId, channelId, messageId, pinnedBy })
    .onConflictDoNothing()
    .returning();

  return pin ?? { id: "", orgId, channelId, messageId, pinnedBy, pinnedAt: new Date() };
}

export async function unpinMessage(
  channelId: string,
  messageId: string,
): Promise<void> {
  await db
    .delete(pinnedMessages)
    .where(
      and(
        eq(pinnedMessages.channelId, channelId),
        eq(pinnedMessages.messageId, messageId),
      ),
    );
}

export async function getPinnedMessages(
  channelId: string,
): Promise<readonly PinnedMessage[]> {
  return db
    .select()
    .from(pinnedMessages)
    .where(eq(pinnedMessages.channelId, channelId))
    .orderBy(desc(pinnedMessages.pinnedAt));
}

// ── Unread Tracking ──────────────────────────────────────────────────

export async function markAsRead(
  channelId: string,
  userId: string,
  messageId: string,
): Promise<void> {
  await db
    .update(msgChannelMembers)
    .set({ lastReadAt: new Date(), lastReadMessageId: messageId })
    .where(
      and(
        eq(msgChannelMembers.channelId, channelId),
        eq(msgChannelMembers.userId, userId),
      ),
    );
}

export async function getUnreadCounts(
  orgId: string,
  userId: string,
): Promise<readonly { channelId: string; unreadCount: number }[]> {
  const memberships = await db
    .select({
      channelId: msgChannelMembers.channelId,
      lastReadAt: msgChannelMembers.lastReadAt,
    })
    .from(msgChannelMembers)
    .where(
      and(
        eq(msgChannelMembers.orgId, orgId),
        eq(msgChannelMembers.userId, userId),
      ),
    );

  const counts = await Promise.all(
    memberships.map(async (m) => {
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(
          and(
            eq(messages.channelId, m.channelId),
            eq(messages.isDeleted, false),
            m.lastReadAt ? gt(messages.createdAt, m.lastReadAt) : sql`true`,
          ),
        );

      return {
        channelId: m.channelId,
        unreadCount: Number(result?.count ?? 0),
      };
    }),
  );

  return counts.filter((c) => c.unreadCount > 0);
}

// ── Search ───────────────────────────────────────────────────────────

export async function searchMessages(
  orgId: string,
  query: string,
  options?: { channelId?: string; userId?: string; limit?: number },
): Promise<readonly Message[]> {
  const conditions = [
    eq(messages.orgId, orgId),
    eq(messages.isDeleted, false),
    sql`to_tsvector('english', ${messages.content}) @@ plainto_tsquery('english', ${query})`,
  ];

  if (options?.channelId) {
    conditions.push(eq(messages.channelId, options.channelId));
  }
  if (options?.userId) {
    conditions.push(eq(messages.userId, options.userId));
  }

  return db
    .select()
    .from(messages)
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt))
    .limit(options?.limit ?? 20);
}
