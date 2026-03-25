import { eq, and, or, desc, lte, like } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  tasks,
  profiles,
  projects,
  subtasks,
  sections,
  tags,
  taskTags,
  comments,
  attachments,
  recurringRules,
  notificationPreferences,
  notificationChannels,
  userContentPrefs,
  contentDeliveryLog,
  rituals,
  streaks,
  progressSnapshots,
  pomodoroSessions,
  userXp,
  xpTransactions,
  userAchievements,
  achievements,
  challenges,
  teamMembers,
  standups,
  accountabilityPartners,
  sharedGoalProgress,
  subscriptions,
  invoices,
  couponRedemptions,
  auditLog,
  syncMetadata,
  userSettings,
  reminders,
  notifications,
  notificationLog,
  calendarTokens,
  type Task,
  type NewTask,
} from "../../db/schema/index.js";

// ── Import/Export Queries ─────────────────────────────────────────────

export async function findAllUserTasks(
  userId: string,
  filters?: { status?: string; projectId?: string },
): Promise<Task[]> {
  const conditions = [eq(tasks.userId, userId)];

  if (filters?.status) {
    conditions.push(
      eq(
        tasks.status,
        filters.status as (typeof tasks.status.enumValues)[number],
      ),
    );
  }
  if (filters?.projectId) {
    conditions.push(eq(tasks.projectId, filters.projectId));
  }

  return db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt));
}

export async function findUserTasksByTitleAndDate(
  userId: string,
): Promise<{ title: string; dueDate: Date | null }[]> {
  return db
    .select({ title: tasks.title, dueDate: tasks.dueDate })
    .from(tasks)
    .where(eq(tasks.userId, userId));
}

export async function bulkInsertTasks(data: NewTask[]): Promise<Task[]> {
  if (data.length === 0) return [];
  return db.insert(tasks).values(data).returning();
}

// ── Soft Delete ──────────────────────────────────────────────────────

export async function softDeleteUser(userId: string): Promise<boolean> {
  const now = new Date();

  // Mark profile as deleted — anonymize PII, preserve ID for grace period
  const [updated] = await db
    .update(profiles)
    .set({
      name: `[DELETED_${now.toISOString()}]`,
      email: null,
      avatarUrl: null,
      updatedAt: now,
    })
    .where(eq(profiles.id, userId))
    .returning();

  if (!updated) return false;

  // Cancel active subscriptions
  await db
    .update(subscriptions)
    .set({ status: "cancelled", cancelledAt: now, updatedAt: now })
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active"),
      ),
    );

  // Disable all notification channels (remove connections, NOT delete yet)
  await db
    .update(notificationChannels)
    .set({ isEnabled: false, updatedAt: now })
    .where(eq(notificationChannels.userId, userId));

  // Delete calendar tokens (contains OAuth tokens — remove immediately)
  await db
    .delete(calendarTokens)
    .where(eq(calendarTokens.userId, userId));

  return true;
}

// ── Profile Query ────────────────────────────────────────────────────

export async function findUserProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return profile;
}

// ── GDPR Full Data Export ────────────────────────────────────────────
// Fetches ALL user data across every table for GDPR/DPDP compliance.
// Sensitive tokens/secrets are excluded. Metadata is included.

export interface GdprFullData {
  readonly profile: Record<string, unknown>;
  readonly settings: Record<string, unknown> | null;
  readonly tasks: readonly Record<string, unknown>[];
  readonly projects: readonly Record<string, unknown>[];
  readonly sections: readonly Record<string, unknown>[];
  readonly subtasks: readonly Record<string, unknown>[];
  readonly comments: readonly Record<string, unknown>[];
  readonly attachments: readonly Record<string, unknown>[];
  readonly tags: readonly Record<string, unknown>[];
  readonly taskTags: readonly Record<string, unknown>[];
  readonly recurringRules: readonly Record<string, unknown>[];
  readonly reminders: readonly Record<string, unknown>[];
  readonly notificationPreferences: Record<string, unknown> | null;
  readonly notificationChannels: readonly Record<string, unknown>[];
  readonly notifications: readonly Record<string, unknown>[];
  readonly notificationLog: readonly Record<string, unknown>[];
  readonly contentPreferences: readonly Record<string, unknown>[];
  readonly contentDeliveryLog: readonly Record<string, unknown>[];
  readonly rituals: readonly Record<string, unknown>[];
  readonly streaks: readonly Record<string, unknown>[];
  readonly progressSnapshots: readonly Record<string, unknown>[];
  readonly pomodoroSessions: readonly Record<string, unknown>[];
  readonly gamification: {
    readonly xpSummary: Record<string, unknown> | null;
    readonly xpTransactions: readonly Record<string, unknown>[];
    readonly achievements: readonly Record<string, unknown>[];
    readonly challenges: readonly Record<string, unknown>[];
  };
  readonly teams: {
    readonly memberships: readonly Record<string, unknown>[];
    readonly standups: readonly Record<string, unknown>[];
  };
  readonly accountability: {
    readonly partners: readonly Record<string, unknown>[];
    readonly sharedGoalProgress: readonly Record<string, unknown>[];
  };
  readonly billing: {
    readonly subscriptions: readonly Record<string, unknown>[];
    readonly invoices: readonly Record<string, unknown>[];
    readonly couponRedemptions: readonly Record<string, unknown>[];
  };
  readonly auditLog: readonly Record<string, unknown>[];
  readonly syncMetadata: readonly Record<string, unknown>[];
}

export async function findAllUserDataForGdpr(
  userId: string,
): Promise<GdprFullData> {
  // Run all queries in parallel for performance
  const [
    profileResult,
    settingsResult,
    allTasks,
    allProjects,
    allSections,
    allSubtasks,
    allComments,
    allAttachments,
    allTags,
    allTaskTags,
    allRecurringRules,
    allReminders,
    notifPrefsResult,
    allNotifChannels,
    allNotifications,
    allNotifLog,
    allContentPrefs,
    allContentDelivery,
    allRituals,
    allStreaks,
    allProgressSnapshots,
    allPomodoro,
    xpSummaryResult,
    allXpTransactions,
    allUserAchievements,
    allChallenges,
    allTeamMemberships,
    allStandups,
    allPartners,
    allGoalProgress,
    allSubscriptions,
    allInvoices,
    allCouponRedemptions,
    allAuditLog,
    allSyncMetadata,
  ] = await Promise.all([
    // Profile
    db.select().from(profiles).where(eq(profiles.id, userId)).limit(1),

    // Settings
    db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1),

    // Tasks (all statuses, including completed/cancelled)
    db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt)),

    // Projects
    db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt)),

    // Sections
    db.select().from(sections).where(eq(sections.userId, userId)),

    // Subtasks
    db.select().from(subtasks).where(eq(subtasks.userId, userId)),

    // Comments
    db.select().from(comments).where(eq(comments.userId, userId)).orderBy(desc(comments.createdAt)),

    // Attachments (metadata only — excludes storageKey for security)
    db
      .select({
        id: attachments.id,
        taskId: attachments.taskId,
        fileName: attachments.fileName,
        fileType: attachments.fileType,
        fileSizeBytes: attachments.fileSizeBytes,
        createdAt: attachments.createdAt,
      })
      .from(attachments)
      .where(eq(attachments.userId, userId)),

    // Tags
    db.select().from(tags).where(eq(tags.userId, userId)),

    // Task-tag associations (via tasks owned by user)
    db
      .select({ taskId: taskTags.taskId, tagId: taskTags.tagId })
      .from(taskTags)
      .innerJoin(tasks, eq(taskTags.taskId, tasks.id))
      .where(eq(tasks.userId, userId)),

    // Recurring rules
    db.select().from(recurringRules).where(eq(recurringRules.userId, userId)),

    // Reminders
    db.select().from(reminders).where(eq(reminders.userId, userId)).orderBy(desc(reminders.createdAt)),

    // Notification preferences
    db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1),

    // Notification channels (exclude sensitive metadata like tokens)
    db
      .select({
        id: notificationChannels.id,
        channelType: notificationChannels.channelType,
        channelIdentifier: notificationChannels.channelIdentifier,
        isVerified: notificationChannels.isVerified,
        isEnabled: notificationChannels.isEnabled,
        verifiedAt: notificationChannels.verifiedAt,
        createdAt: notificationChannels.createdAt,
        updatedAt: notificationChannels.updatedAt,
      })
      .from(notificationChannels)
      .where(eq(notificationChannels.userId, userId)),

    // Notifications
    db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)),

    // Notification log
    db.select().from(notificationLog).where(eq(notificationLog.userId, userId)).orderBy(desc(notificationLog.createdAt)),

    // Content preferences
    db.select().from(userContentPrefs).where(eq(userContentPrefs.userId, userId)),

    // Content delivery log
    db.select().from(contentDeliveryLog).where(eq(contentDeliveryLog.userId, userId)),

    // Rituals (morning + evening)
    db.select().from(rituals).where(eq(rituals.userId, userId)).orderBy(desc(rituals.completedAt)),

    // Streaks
    db.select().from(streaks).where(eq(streaks.userId, userId)),

    // Progress snapshots
    db.select().from(progressSnapshots).where(eq(progressSnapshots.userId, userId)).orderBy(desc(progressSnapshots.snapshotDate)),

    // Pomodoro sessions
    db.select().from(pomodoroSessions).where(eq(pomodoroSessions.userId, userId)).orderBy(desc(pomodoroSessions.startedAt)),

    // Gamification — XP summary
    db.select().from(userXp).where(eq(userXp.userId, userId)).limit(1),

    // Gamification — XP transactions
    db.select().from(xpTransactions).where(eq(xpTransactions.userId, userId)).orderBy(desc(xpTransactions.createdAt)),

    // Gamification — User achievements (joined with achievement names)
    db
      .select({
        id: userAchievements.id,
        achievementKey: achievements.key,
        achievementName: achievements.name,
        category: achievements.category,
        xpReward: achievements.xpReward,
        unlockedAt: userAchievements.unlockedAt,
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId)),

    // Gamification — Challenges (created or received)
    db
      .select()
      .from(challenges)
      .where(or(eq(challenges.creatorId, userId), eq(challenges.opponentId, userId))),

    // Teams — memberships
    db.select().from(teamMembers).where(eq(teamMembers.userId, userId)),

    // Teams — standups
    db.select().from(standups).where(eq(standups.userId, userId)).orderBy(desc(standups.submittedAt)),

    // Accountability — partners
    db
      .select()
      .from(accountabilityPartners)
      .where(
        or(
          eq(accountabilityPartners.userId, userId),
          eq(accountabilityPartners.partnerId, userId),
        ),
      ),

    // Accountability — shared goal progress
    db.select().from(sharedGoalProgress).where(eq(sharedGoalProgress.userId, userId)),

    // Billing — subscriptions (exclude revenueCat internal IDs)
    db
      .select({
        id: subscriptions.id,
        plan: subscriptions.plan,
        status: subscriptions.status,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        cancelledAt: subscriptions.cancelledAt,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt,
      })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId)),

    // Billing — invoices (exclude revenueCat transaction IDs)
    db
      .select({
        id: invoices.id,
        amount: invoices.amount,
        currency: invoices.currency,
        status: invoices.status,
        issuedAt: invoices.issuedAt,
        paidAt: invoices.paidAt,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .where(eq(invoices.userId, userId)),

    // Billing — coupon redemptions
    db.select().from(couponRedemptions).where(eq(couponRedemptions.userId, userId)),

    // Audit log
    db.select().from(auditLog).where(eq(auditLog.userId, userId)).orderBy(desc(auditLog.createdAt)),

    // Sync metadata
    db.select().from(syncMetadata).where(eq(syncMetadata.userId, userId)),
  ]);

  return {
    profile: profileResult[0] ?? {},
    settings: settingsResult[0] ?? null,
    tasks: allTasks,
    projects: allProjects,
    sections: allSections,
    subtasks: allSubtasks,
    comments: allComments,
    attachments: allAttachments,
    tags: allTags,
    taskTags: allTaskTags,
    recurringRules: allRecurringRules,
    reminders: allReminders,
    notificationPreferences: notifPrefsResult[0] ?? null,
    notificationChannels: allNotifChannels,
    notifications: allNotifications,
    notificationLog: allNotifLog,
    contentPreferences: allContentPrefs,
    contentDeliveryLog: allContentDelivery,
    rituals: allRituals,
    streaks: allStreaks,
    progressSnapshots: allProgressSnapshots,
    pomodoroSessions: allPomodoro,
    gamification: {
      xpSummary: xpSummaryResult[0] ?? null,
      xpTransactions: allXpTransactions,
      achievements: allUserAchievements,
      challenges: allChallenges,
    },
    teams: {
      memberships: allTeamMemberships,
      standups: allStandups,
    },
    accountability: {
      partners: allPartners,
      sharedGoalProgress: allGoalProgress,
    },
    billing: {
      subscriptions: allSubscriptions,
      invoices: allInvoices,
      couponRedemptions: allCouponRedemptions,
    },
    auditLog: allAuditLog,
    syncMetadata: allSyncMetadata,
  };
}

// ── Hard Delete (GDPR grace period expired) ─────────────────────────

/**
 * Finds profiles that were soft-deleted more than 30 days ago.
 * Soft-deleted profiles have name starting with '[DELETED_'.
 */
export async function findExpiredDeletedProfiles(
  gracePeriodDays: number = 30,
): Promise<{ id: string; name: string | null }[]> {
  const cutoff = new Date(
    Date.now() - gracePeriodDays * 24 * 60 * 60 * 1000,
  );

  return db
    .select({ id: profiles.id, name: profiles.name })
    .from(profiles)
    .where(
      and(
        like(profiles.name, "[DELETED_%"),
        lte(profiles.updatedAt, cutoff),
      ),
    );
}

/**
 * Permanently deletes a user profile row. All child records are
 * removed via PostgreSQL ON DELETE CASCADE foreign keys. The audit_log
 * userId column is set to NULL (ON DELETE SET NULL) preserving the
 * anonymised audit trail.
 */
export async function hardDeleteUser(userId: string): Promise<boolean> {
  const [deleted] = await db
    .delete(profiles)
    .where(eq(profiles.id, userId))
    .returning({ id: profiles.id });

  return !!deleted;
}
