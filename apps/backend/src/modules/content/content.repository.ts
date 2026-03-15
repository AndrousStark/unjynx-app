import {
  eq,
  and,
  desc,
  gte,
  lte,
  count,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  dailyContent,
  userContentPrefs,
  contentDeliveryLog,
  rituals,
  streaks,
  type DailyContentItem,
  type UserContentPref,
  type ContentDeliveryLogEntry,
  type Ritual,
  type Streak,
  type NewRitual,
} from "../../db/schema/index.js";

// ── Daily Content ────────────────────────────────────────────────────

export async function findTodayContent(
  category?: string,
): Promise<DailyContentItem | undefined> {
  const conditions: SQL[] = [eq(dailyContent.isActive, true)];

  if (category) {
    conditions.push(
      eq(
        dailyContent.category,
        category as (typeof dailyContent.category.enumValues)[number],
      ),
    );
  }

  const [item] = await db
    .select()
    .from(dailyContent)
    .where(and(...conditions))
    .orderBy(sql`random() * ${dailyContent.sortWeight}`)
    .limit(1);

  return item;
}

export async function findContentCategories(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ category: dailyContent.category })
    .from(dailyContent)
    .where(eq(dailyContent.isActive, true));

  return rows.map((r) => r.category);
}

export async function findContentById(
  contentId: string,
): Promise<DailyContentItem | undefined> {
  const [item] = await db
    .select()
    .from(dailyContent)
    .where(eq(dailyContent.id, contentId));

  return item;
}

// ── User Content Preferences ─────────────────────────────────────────

export async function findUserContentPrefs(
  userId: string,
): Promise<UserContentPref[]> {
  return db
    .select()
    .from(userContentPrefs)
    .where(eq(userContentPrefs.userId, userId));
}

export async function upsertUserContentPrefs(
  userId: string,
  categories: readonly string[],
  deliveryTime: string,
): Promise<UserContentPref[]> {
  // Delete existing prefs for this user, then insert fresh
  await db
    .delete(userContentPrefs)
    .where(eq(userContentPrefs.userId, userId));

  const rows = categories.map((category) => ({
    userId,
    category: category as (typeof userContentPrefs.category.enumValues)[number],
    deliveryTime,
  }));

  return db.insert(userContentPrefs).values(rows).returning();
}

// ── Content Delivery Log ─────────────────────────────────────────────

export async function logContentDelivery(
  userId: string,
  contentId: string,
  channelType: string,
): Promise<ContentDeliveryLogEntry> {
  const [entry] = await db
    .insert(contentDeliveryLog)
    .values({
      userId,
      contentId,
      channelType:
        channelType as (typeof contentDeliveryLog.channelType.enumValues)[number],
    })
    .returning();

  return entry;
}

export async function findDeliveredToday(
  userId: string,
): Promise<ContentDeliveryLogEntry[]> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  return db
    .select()
    .from(contentDeliveryLog)
    .where(
      and(
        eq(contentDeliveryLog.userId, userId),
        gte(contentDeliveryLog.deliveredAt, todayStart),
        lte(contentDeliveryLog.deliveredAt, todayEnd),
      ),
    );
}

// ── Rituals ──────────────────────────────────────────────────────────

export async function insertRitual(data: NewRitual): Promise<Ritual> {
  const [created] = await db.insert(rituals).values(data).returning();
  return created;
}

export async function findRitualHistory(
  userId: string,
  limit: number,
  offset: number,
): Promise<{ items: Ritual[]; total: number }> {
  const where = eq(rituals.userId, userId);

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(rituals)
      .where(where)
      .orderBy(desc(rituals.completedAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(rituals).where(where),
  ]);

  return { items, total };
}

export async function findRitualByDate(
  userId: string,
  date: Date,
  ritualType: string,
): Promise<Ritual | undefined> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const [ritual] = await db
    .select()
    .from(rituals)
    .where(
      and(
        eq(rituals.userId, userId),
        eq(
          rituals.type,
          ritualType as (typeof rituals.type.enumValues)[number],
        ),
        gte(rituals.completedAt, dayStart),
        lte(rituals.completedAt, dayEnd),
      ),
    );

  return ritual;
}

// ── Streaks (shared with progress) ───────────────────────────────────

export async function findStreakByUserId(
  userId: string,
): Promise<Streak | undefined> {
  const [streak] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, userId));

  return streak;
}

export async function upsertStreak(
  userId: string,
  data: Partial<{
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: Date;
    isFrozen: boolean;
  }>,
): Promise<Streak> {
  const existing = await findStreakByUserId(userId);

  if (existing) {
    const [updated] = await db
      .update(streaks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(streaks.userId, userId))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(streaks)
    .values({
      userId,
      currentStreak: data.currentStreak ?? 1,
      longestStreak: data.longestStreak ?? 1,
      lastActiveDate: data.lastActiveDate ?? new Date(),
      isFrozen: data.isFrozen ?? false,
    })
    .returning();

  return created;
}
