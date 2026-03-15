// ── Content Scheduler ───────────────────────────────────────────────
// Daily content delivery system. For each user with content preferences
// enabled, selects undelivered content from their preferred categories,
// renders it via the template engine, and dispatches to their primary
// channel. Uses a circular buffer pattern to avoid repeats until all
// content in a category has been shown.

import { eq, and, notInArray, sql, count } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  dailyContent,
  userContentPrefs,
  contentDeliveryLog,
  notificationChannels,
  notificationPreferences,
  profiles,
  type DailyContentItem,
} from "../../db/schema/index.js";
import { renderTemplate } from "../../services/templates/template-engine.js";
import { dispatchJob } from "./notification-dispatcher.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "content-scheduler" });

// ── Types ───────────────────────────────────────────────────────────

interface ContentDeliveryResult {
  readonly userId: string;
  readonly contentId: string;
  readonly channel: string;
  readonly success: boolean;
  readonly reason?: string;
}

interface ContentSchedulerStats {
  readonly usersProcessed: number;
  readonly delivered: number;
  readonly failed: number;
  readonly skipped: number;
}

// ── Content Selection (Circular Buffer Pattern) ─────────────────────
// Selects content that hasn't been delivered to this user yet.
// When all content in a category has been shown, resets by excluding
// none (full cycle complete), effectively starting over.

async function selectContentForUser(
  userId: string,
  category: string,
): Promise<DailyContentItem | null> {
  // Get IDs of content already delivered to this user in this category
  const deliveredIds = await db
    .select({ contentId: contentDeliveryLog.contentId })
    .from(contentDeliveryLog)
    .innerJoin(dailyContent, eq(contentDeliveryLog.contentId, dailyContent.id))
    .where(
      and(
        eq(contentDeliveryLog.userId, userId),
        eq(dailyContent.category, category as typeof dailyContent.category.enumValues[number]),
      ),
    );

  const deliveredIdList = deliveredIds.map((d) => d.contentId);

  // Count total available content in this category
  const [{ total }] = await db
    .select({ total: count() })
    .from(dailyContent)
    .where(
      and(
        eq(dailyContent.category, category as typeof dailyContent.category.enumValues[number]),
        eq(dailyContent.isActive, true),
      ),
    );

  // If user has seen everything, reset the cycle (select from all content)
  const shouldResetCycle = deliveredIdList.length >= total && total > 0;

  // Build query conditions
  const conditions = [
    eq(dailyContent.category, category as typeof dailyContent.category.enumValues[number]),
    eq(dailyContent.isActive, true),
  ];

  // Only exclude delivered content if we haven't completed a full cycle
  if (!shouldResetCycle && deliveredIdList.length > 0) {
    conditions.push(notInArray(dailyContent.id, deliveredIdList));
  }

  // Select random content using PostgreSQL RANDOM() with sort weight bias
  // Higher sortWeight = higher probability of being selected
  const [selected] = await db
    .select()
    .from(dailyContent)
    .where(and(...conditions))
    .orderBy(sql`RANDOM() * ${dailyContent.sortWeight}`)
    .limit(1);

  if (!selected) {
    log.debug(
      { userId, category, deliveredCount: deliveredIdList.length, total },
      "No content available for category",
    );
    return null;
  }

  if (shouldResetCycle) {
    log.info(
      { userId, category, cycleLength: total },
      "Content cycle reset: all items shown, starting new cycle",
    );
  }

  return selected;
}

// ── Record Delivery ─────────────────────────────────────────────────

async function recordDelivery(
  userId: string,
  contentId: string,
  channelType: string,
): Promise<void> {
  await db.insert(contentDeliveryLog).values({
    userId,
    contentId,
    channelType: channelType as "push" | "telegram" | "email" | "whatsapp" | "sms" | "instagram" | "slack" | "discord",
    deliveredAt: new Date(),
  });
}

// ── Get User's Primary Channel Identifier ───────────────────────────

async function getUserChannelIdentifier(
  userId: string,
  channelType: string,
): Promise<string | null> {
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
        eq(notificationChannels.isEnabled, true),
      ),
    );

  return channel?.channelIdentifier ?? null;
}

// ── Deliver Content to a Single User ────────────────────────────────

async function deliverContentToUser(
  userId: string,
  category: string,
  primaryChannel: string,
  userName: string,
): Promise<ContentDeliveryResult> {
  // Select undelivered content
  const content = await selectContentForUser(userId, category);

  if (!content) {
    return {
      userId,
      contentId: "",
      channel: primaryChannel,
      success: false,
      reason: "no_content_available",
    };
  }

  // Get recipient identifier for the channel
  const recipient = await getUserChannelIdentifier(userId, primaryChannel);

  if (!recipient) {
    // Fall back to push if primary channel not connected
    const pushRecipient = await getUserChannelIdentifier(userId, "push");
    if (!pushRecipient) {
      return {
        userId,
        contentId: content.id,
        channel: primaryChannel,
        success: false,
        reason: "no_channel_connected",
      };
    }
  }

  // Dispatch notification
  const result = await dispatchJob({
    userId,
    notificationId: crypto.randomUUID(),
    channel: primaryChannel,
    messageType: "daily_content",
    templateVars: {
      content_quote: content.content,
      content_author: content.author ?? "Unknown",
      user_name: userName,
      _recipient: recipient ?? "",
    },
    priority: 9, // Low priority (content is non-urgent)
    attemptNumber: 1,
  });

  if (result.success) {
    // Record the delivery so we don't repeat this content
    await recordDelivery(userId, content.id, primaryChannel);
  }

  return {
    userId,
    contentId: content.id,
    channel: primaryChannel,
    success: result.success,
    reason: result.reason,
  };
}

// ── Run Full Content Delivery Cycle ─────────────────────────────────
// Called by the cron scheduler. Processes all users with content
// preferences enabled, delivering one piece of content per category.

export async function runContentDelivery(): Promise<ContentSchedulerStats> {
  let usersProcessed = 0;
  let delivered = 0;
  let failed = 0;
  let skipped = 0;

  try {
    // Fetch all users with content preferences, along with their
    // notification preferences and profile info
    const usersWithPrefs = await db
      .select({
        contentPref: userContentPrefs,
        notifPref: notificationPreferences,
        profile: profiles,
      })
      .from(userContentPrefs)
      .innerJoin(profiles, eq(userContentPrefs.userId, profiles.id))
      .leftJoin(
        notificationPreferences,
        eq(userContentPrefs.userId, notificationPreferences.userId),
      );

    if (usersWithPrefs.length === 0) {
      log.info("No users with content preferences found");
      return { usersProcessed: 0, delivered: 0, failed: 0, skipped: 0 };
    }

    // Group by user to handle multiple category preferences
    const userMap = new Map<
      string,
      {
        categories: string[];
        primaryChannel: string;
        userName: string;
        deliveryTime: string;
      }
    >();

    for (const { contentPref, notifPref, profile } of usersWithPrefs) {
      const existing = userMap.get(contentPref.userId);
      const category = contentPref.category;
      const deliveryTime = contentPref.deliveryTime ?? "08:00";

      if (existing) {
        existing.categories.push(category);
      } else {
        userMap.set(contentPref.userId, {
          categories: [category],
          primaryChannel: notifPref?.primaryChannel ?? "push",
          userName: profile.name ?? "there",
          deliveryTime,
        });
      }
    }

    // Check if current time matches delivery time for each user
    // (Simplified: in production, this would use per-user timezone)
    const currentHourMinute = new Date()
      .toISOString()
      .slice(11, 16); // "HH:MM"

    for (const [userId, { categories, primaryChannel, userName, deliveryTime }] of userMap) {
      usersProcessed += 1;

      // Only deliver if within delivery time window (+/- 30 min)
      if (!isWithinDeliveryWindow(currentHourMinute, deliveryTime)) {
        skipped += 1;
        continue;
      }

      // Pick one random category from the user's preferences
      const category = categories[Math.floor(Math.random() * categories.length)];

      const result = await deliverContentToUser(
        userId,
        category,
        primaryChannel,
        userName,
      );

      if (result.success) {
        delivered += 1;
      } else {
        failed += 1;
        log.debug(
          { userId, category, reason: result.reason },
          "Content delivery failed for user",
        );
      }
    }

    log.info(
      { usersProcessed, delivered, failed, skipped },
      "Content delivery cycle complete",
    );
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "Content delivery cycle failed",
    );
  }

  return { usersProcessed, delivered, failed, skipped };
}

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Checks if the current time is within +/- 30 minutes of the
 * delivery time. Both times are in "HH:MM" format.
 */
function isWithinDeliveryWindow(
  currentTime: string,
  deliveryTime: string,
): boolean {
  const toMinutes = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };

  const current = toMinutes(currentTime);
  const target = toMinutes(deliveryTime);
  const WINDOW_MINUTES = 30;

  const diff = Math.abs(current - target);
  // Handle midnight wraparound
  const wrappedDiff = Math.min(diff, 1440 - diff);

  return wrappedDiff <= WINDOW_MINUTES;
}

// ── Exports for Testing ─────────────────────────────────────────────

export {
  selectContentForUser,
  isWithinDeliveryWindow,
  deliverContentToUser,
};
