import { eq, and } from "drizzle-orm";
import { contentDb as db } from "../../db/index.js";
import {
  notificationChannels,
  type NotificationChannel,
  type NewNotificationChannel,
} from "../../db/schema/index.js";

// ── Queries ──────────────────────────────────────────────────────────

export async function findChannelsByUser(
  userId: string,
): Promise<NotificationChannel[]> {
  return db
    .select()
    .from(notificationChannels)
    .where(eq(notificationChannels.userId, userId));
}

export async function findChannel(
  userId: string,
  channelType: string,
): Promise<NotificationChannel | undefined> {
  const [channel] = await db
    .select()
    .from(notificationChannels)
    .where(
      and(
        eq(notificationChannels.userId, userId),
        eq(
          notificationChannels.channelType,
          channelType as typeof notificationChannels.channelType.enumValues[number],
        ),
      ),
    );

  return channel;
}

// ── Mutations ────────────────────────────────────────────────────────

export async function createChannel(
  data: NewNotificationChannel,
): Promise<NotificationChannel> {
  const [created] = await db
    .insert(notificationChannels)
    .values(data)
    .returning();

  return created;
}

export async function updateChannel(
  userId: string,
  channelType: string,
  updates: Partial<Pick<NotificationChannel, "channelIdentifier" | "isEnabled" | "isVerified" | "metadata" | "verifiedAt">>,
): Promise<NotificationChannel | undefined> {
  const [updated] = await db
    .update(notificationChannels)
    .set({ ...updates, updatedAt: new Date() })
    .where(
      and(
        eq(notificationChannels.userId, userId),
        eq(
          notificationChannels.channelType,
          channelType as typeof notificationChannels.channelType.enumValues[number],
        ),
      ),
    )
    .returning();

  return updated;
}

export async function deleteChannel(
  userId: string,
  channelType: string,
): Promise<boolean> {
  const result = await db
    .delete(notificationChannels)
    .where(
      and(
        eq(notificationChannels.userId, userId),
        eq(
          notificationChannels.channelType,
          channelType as typeof notificationChannels.channelType.enumValues[number],
        ),
      ),
    )
    .returning({ id: notificationChannels.id });

  return result.length > 0;
}

export async function verifyChannel(
  userId: string,
  channelType: string,
): Promise<NotificationChannel | undefined> {
  return updateChannel(userId, channelType, {
    isVerified: true,
    verifiedAt: new Date(),
  });
}
