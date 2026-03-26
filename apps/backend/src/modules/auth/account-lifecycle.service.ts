import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { profiles, auditLog } from "../../db/schema/index.js";
import { logger } from "../../middleware/logger.js";
import { getManagementToken } from "../../utils/logto-m2m.js";
import { env } from "../../env.js";
import { revokeAllSessions } from "./session.service.js";

const log = logger.child({ module: "account-lifecycle" });

// ── Account Status Values ───────────────────────────────────────────

export type AccountStatus =
  | "pending_verification"
  | "active"
  | "delinquent"
  | "suspended"
  | "grace_period"
  | "soft_deleted";

// ── Valid State Transitions ─────────────────────────────────────────

const VALID_TRANSITIONS: Record<AccountStatus, readonly AccountStatus[]> = {
  pending_verification: ["active", "suspended"],
  active: ["suspended", "delinquent", "grace_period", "soft_deleted"],
  delinquent: ["active", "suspended", "grace_period"],
  suspended: ["active"],
  grace_period: ["active", "suspended", "soft_deleted"],
  soft_deleted: ["active"],
};

function isValidTransition(
  from: AccountStatus,
  to: AccountStatus,
): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return allowed !== undefined && allowed.includes(to);
}

// ── Status Metadata Response ────────────────────────────────────────

interface AccountStatusInfo {
  readonly userId: string;
  readonly accountStatus: AccountStatus;
  readonly gracePeriodEndsAt: Date | null;
  readonly suspendedReason: string | null;
  readonly isBanned: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ── Audit Logging ───────────────────────────────────────────────────

async function writeAuditLog(
  userId: string,
  action: string,
  performedBy: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(auditLog).values({
      userId: performedBy,
      action,
      entityType: "profile",
      entityId: userId,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });
  } catch (error) {
    log.warn({ error, userId, action }, "Failed to write audit log");
  }
}

// ── Logto Suspend / Unsuspend ───────────────────────────────────────

async function setLogtoSuspendState(
  logtoId: string,
  isSuspended: boolean,
): Promise<boolean> {
  const m2mToken = await getManagementToken();
  if (!m2mToken) {
    log.warn("M2M token unavailable — skipping Logto suspend state update");
    return false;
  }

  try {
    const url = `${env.LOGTO_ENDPOINT}/api/users/${logtoId}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${m2mToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isSuspended }),
    });

    if (!response.ok) {
      log.error(
        { logtoId, status: response.status },
        "Logto suspend state update failed",
      );
      return false;
    }

    return true;
  } catch (error) {
    log.error({ error, logtoId }, "Logto suspend state update error");
    return false;
  }
}

// ── Service Functions ───────────────────────────────────────────────

/**
 * Get the full account status for a user.
 */
export async function getAccountStatus(
  userId: string,
): Promise<AccountStatusInfo | null> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile) {
    return null;
  }

  return {
    userId: profile.id,
    accountStatus: profile.accountStatus as AccountStatus,
    gracePeriodEndsAt: profile.gracePeriodEndsAt,
    suspendedReason: profile.suspendedReason,
    isBanned: profile.isBanned,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

/**
 * Suspend a user account.
 * - Sets status to "suspended"
 * - Calls Logto suspend API
 * - Revokes all active sessions
 * - Writes audit log
 */
export async function suspendAccount(
  userId: string,
  reason: string,
  suspendedBy: string,
): Promise<AccountStatusInfo> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile) {
    throw new Error("User not found");
  }

  const currentStatus = profile.accountStatus as AccountStatus;

  if (!isValidTransition(currentStatus, "suspended")) {
    throw new Error(
      `Invalid state transition: cannot move from "${currentStatus}" to "suspended"`,
    );
  }

  // Update profile status
  const [updated] = await db
    .update(profiles)
    .set({
      accountStatus: "suspended",
      suspendedReason: reason,
      isBanned: true,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId))
    .returning();

  // Suspend in Logto (fire-and-forget — DB state is authoritative)
  await setLogtoSuspendState(profile.logtoId, true);

  // Revoke all sessions
  await revokeAllSessions(userId);

  // Audit log
  await writeAuditLog(userId, "account.suspended", suspendedBy, {
    reason,
    previousStatus: currentStatus,
  });

  log.info({ userId, reason, suspendedBy }, "Account suspended");

  return {
    userId: updated.id,
    accountStatus: updated.accountStatus as AccountStatus,
    gracePeriodEndsAt: updated.gracePeriodEndsAt,
    suspendedReason: updated.suspendedReason,
    isBanned: updated.isBanned,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

/**
 * Reactivate a suspended user account.
 * - Sets status to "active"
 * - Calls Logto unsuspend API
 * - Writes audit log
 */
export async function reactivateAccount(
  userId: string,
  reactivatedBy: string,
): Promise<AccountStatusInfo> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile) {
    throw new Error("User not found");
  }

  const currentStatus = profile.accountStatus as AccountStatus;

  if (!isValidTransition(currentStatus, "active")) {
    throw new Error(
      `Invalid state transition: cannot move from "${currentStatus}" to "active"`,
    );
  }

  // Update profile status
  const [updated] = await db
    .update(profiles)
    .set({
      accountStatus: "active",
      suspendedReason: null,
      gracePeriodEndsAt: null,
      isBanned: false,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId))
    .returning();

  // Unsuspend in Logto
  await setLogtoSuspendState(profile.logtoId, false);

  // Audit log
  await writeAuditLog(userId, "account.reactivated", reactivatedBy, {
    previousStatus: currentStatus,
  });

  log.info({ userId, reactivatedBy }, "Account reactivated");

  return {
    userId: updated.id,
    accountStatus: updated.accountStatus as AccountStatus,
    gracePeriodEndsAt: updated.gracePeriodEndsAt,
    suspendedReason: updated.suspendedReason,
    isBanned: updated.isBanned,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

/**
 * Initiate a 30-day grace period for a user.
 * Typically triggered by payment failure or account deletion request.
 */
export async function initiateGracePeriod(
  userId: string,
  reason: string,
): Promise<AccountStatusInfo> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile) {
    throw new Error("User not found");
  }

  const currentStatus = profile.accountStatus as AccountStatus;

  if (!isValidTransition(currentStatus, "grace_period")) {
    throw new Error(
      `Invalid state transition: cannot move from "${currentStatus}" to "grace_period"`,
    );
  }

  const gracePeriodEndsAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  );

  const [updated] = await db
    .update(profiles)
    .set({
      accountStatus: "grace_period",
      gracePeriodEndsAt,
      suspendedReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId))
    .returning();

  // Audit log
  await writeAuditLog(userId, "account.grace_period_initiated", userId, {
    reason,
    previousStatus: currentStatus,
    gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
  });

  log.info(
    { userId, reason, gracePeriodEndsAt },
    "Grace period initiated",
  );

  return {
    userId: updated.id,
    accountStatus: updated.accountStatus as AccountStatus,
    gracePeriodEndsAt: updated.gracePeriodEndsAt,
    suspendedReason: updated.suspendedReason,
    isBanned: updated.isBanned,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}
