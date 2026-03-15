import type {
  ContentTodayQuery,
  UpdatePrefsInput,
  LogRitualInput,
  RitualHistoryQuery,
} from "./content.schema.js";
import type {
  DailyContentItem,
  UserContentPref,
  Ritual,
  Streak,
} from "../../db/schema/index.js";
import * as contentRepo from "./content.repository.js";

// ── Daily Content ────────────────────────────────────────────────────

export async function getTodayContent(
  userId: string,
  query: ContentTodayQuery,
): Promise<DailyContentItem | null> {
  // Check what was already delivered today to avoid repeats
  const delivered = await contentRepo.findDeliveredToday(userId);
  const deliveredIds = new Set(delivered.map((d) => d.contentId));

  // Try up to 5 times to find non-repeated content
  const maxAttempts = 5;
  for (let i = 0; i < maxAttempts; i++) {
    const content = await contentRepo.findTodayContent(query.category);

    if (!content) {
      return null;
    }

    if (!deliveredIds.has(content.id)) {
      // Log this delivery so it won't repeat today
      await contentRepo.logContentDelivery(userId, content.id, "push");
      return content;
    }
  }

  // If all attempts returned already-delivered content, return the last one anyway
  return (await contentRepo.findTodayContent(query.category)) ?? null;
}

export async function getCategories(): Promise<string[]> {
  return contentRepo.findContentCategories();
}

// ── Preferences ──────────────────────────────────────────────────────

export async function getPreferences(
  userId: string,
): Promise<UserContentPref[]> {
  return contentRepo.findUserContentPrefs(userId);
}

export async function updatePreferences(
  userId: string,
  input: UpdatePrefsInput,
): Promise<UserContentPref[]> {
  const deliveryTime = input.deliveryTime ?? "07:00";
  return contentRepo.upsertUserContentPrefs(
    userId,
    input.categories,
    deliveryTime,
  );
}

// ── Save / Favorite ──────────────────────────────────────────────────

export async function saveContent(
  userId: string,
  contentId: string,
): Promise<{ saved: boolean }> {
  const content = await contentRepo.findContentById(contentId);

  if (!content) {
    return { saved: false };
  }

  // Use a special "push" channel to mark as saved/favorited in the delivery log
  await contentRepo.logContentDelivery(userId, contentId, "push");
  return { saved: true };
}

// ── Rituals ──────────────────────────────────────────────────────────

export async function logRitual(
  userId: string,
  input: LogRitualInput,
): Promise<{ ritual: Ritual; streak: Streak }> {
  // Check if this ritual type was already done today
  const existing = await contentRepo.findRitualByDate(
    userId,
    new Date(),
    input.ritualType,
  );

  if (existing) {
    const streak = await getOrCreateStreak(userId);
    return { ritual: existing, streak };
  }

  // Insert ritual
  const ritual = await contentRepo.insertRitual({
    userId,
    type: input.ritualType as "morning" | "evening",
    mood: input.mood,
    gratitude: input.gratitude,
    intention: input.intention,
    reflection: input.reflection,
  });

  // Update streak
  const streak = await updateStreakOnActivity(userId);

  return { ritual, streak };
}

export async function getRitualHistory(
  userId: string,
  query: RitualHistoryQuery,
): Promise<{ items: Ritual[]; total: number }> {
  const offset = (query.page - 1) * query.limit;
  return contentRepo.findRitualHistory(userId, query.limit, offset);
}

// ── Streak Helpers ───────────────────────────────────────────────────

async function getOrCreateStreak(userId: string): Promise<Streak> {
  const existing = await contentRepo.findStreakByUserId(userId);

  if (existing) {
    return existing;
  }

  return contentRepo.upsertStreak(userId, {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: new Date(),
  });
}

async function updateStreakOnActivity(userId: string): Promise<Streak> {
  const existing = await contentRepo.findStreakByUserId(userId);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!existing) {
    return contentRepo.upsertStreak(userId, {
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: now,
    });
  }

  // Calculate days since last activity
  const lastActive = existing.lastActiveDate
    ? new Date(
        existing.lastActiveDate.getFullYear(),
        existing.lastActiveDate.getMonth(),
        existing.lastActiveDate.getDate(),
      )
    : null;

  const diffMs = lastActive ? today.getTime() - lastActive.getTime() : null;
  const diffDays = diffMs !== null ? Math.floor(diffMs / 86_400_000) : null;

  if (diffDays === 0) {
    // Already counted today, no streak change
    return existing;
  }

  if (diffDays === 1) {
    // Consecutive day - increment streak
    const newCurrent = existing.currentStreak + 1;
    const newLongest = Math.max(newCurrent, existing.longestStreak);

    return contentRepo.upsertStreak(userId, {
      currentStreak: newCurrent,
      longestStreak: newLongest,
      lastActiveDate: now,
    });
  }

  // Streak broken (or frozen) - reset to 1
  if (existing.isFrozen) {
    // Frozen streak: keep current but update date
    return contentRepo.upsertStreak(userId, {
      lastActiveDate: now,
      isFrozen: false,
    });
  }

  return contentRepo.upsertStreak(userId, {
    currentStreak: 1,
    longestStreak: existing.longestStreak,
    lastActiveDate: now,
  });
}
