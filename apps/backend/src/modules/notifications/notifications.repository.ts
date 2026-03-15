import { eq, and, count, desc, gte, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  notifications,
  type Notification,
  type NewNotification,
  deliveryAttempts,
  type DeliveryAttempt,
  type NewDeliveryAttempt,
  notificationPreferences,
  type NotificationPreference,
  type NewNotificationPreference,
} from "../../db/schema/index.js";

// ── Notifications ─────────────────────────────────────────────────────

export async function insertNotification(
  data: NewNotification,
): Promise<Notification> {
  const [created] = await db
    .insert(notifications)
    .values(data)
    .returning();
  return created;
}

export async function findNotificationById(
  id: string,
): Promise<Notification | undefined> {
  const [found] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, id));
  return found;
}

export async function findPendingNotifications(
  userId: string,
  limit: number,
): Promise<Notification[]> {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.scheduledAt))
    .limit(limit);
}

// ── Delivery Attempts ─────────────────────────────────────────────────

export async function insertDeliveryAttempt(
  data: NewDeliveryAttempt,
): Promise<DeliveryAttempt> {
  const [created] = await db
    .insert(deliveryAttempts)
    .values(data)
    .returning();
  return created;
}

export async function updateDeliveryAttempt(
  id: string,
  data: Partial<NewDeliveryAttempt>,
): Promise<DeliveryAttempt> {
  const [updated] = await db
    .update(deliveryAttempts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(deliveryAttempts.id, id))
    .returning();
  return updated;
}

export async function findDeliveryAttempts(
  notificationId: string,
): Promise<DeliveryAttempt[]> {
  return db
    .select()
    .from(deliveryAttempts)
    .where(eq(deliveryAttempts.notificationId, notificationId))
    .orderBy(desc(deliveryAttempts.createdAt));
}

export async function findRecentDeliveryAttemptsByUser(
  userId: string,
  limit: number,
): Promise<DeliveryAttempt[]> {
  return db
    .select({ deliveryAttempts })
    .from(deliveryAttempts)
    .innerJoin(
      notifications,
      eq(deliveryAttempts.notificationId, notifications.id),
    )
    .where(eq(notifications.userId, userId))
    .orderBy(desc(deliveryAttempts.createdAt))
    .limit(limit)
    .then((rows) => rows.map((r) => r.deliveryAttempts));
}

export async function getDailyUsageCount(
  userId: string,
  channel: string,
): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [{ total }] = await db
    .select({ total: count() })
    .from(deliveryAttempts)
    .innerJoin(
      notifications,
      eq(deliveryAttempts.notificationId, notifications.id),
    )
    .where(
      and(
        eq(notifications.userId, userId),
        eq(
          deliveryAttempts.channel,
          channel as (typeof deliveryAttempts.channel.enumValues)[number],
        ),
        gte(deliveryAttempts.createdAt, startOfDay),
      ),
    );

  return total;
}

// ── Notification Preferences ──────────────────────────────────────────

export async function getPreferences(
  userId: string,
): Promise<NotificationPreference | undefined> {
  const [found] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));
  return found;
}

export async function upsertPreferences(
  userId: string,
  data: Partial<NewNotificationPreference>,
): Promise<NotificationPreference> {
  const [result] = await db
    .insert(notificationPreferences)
    .values({ userId, ...data })
    .onConflictDoUpdate({
      target: notificationPreferences.userId,
      set: { ...data, updatedAt: new Date() },
    })
    .returning();
  return result;
}
