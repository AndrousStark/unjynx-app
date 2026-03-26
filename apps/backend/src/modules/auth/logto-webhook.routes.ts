// ── Logto Webhook Handler ───────────────────────────────────────────
// Receives Logto webhook events and processes them:
//
// Supported events:
//   PostSignIn                      → audit log + session update + suspicious login detection
//   PostRegister                    → audit log
//   PostResetPassword               → audit log
//   PostSignOut                     → audit log
//   User.Created                    → sync user to profiles table
//   User.Data.Updated               → update profile fields (email, name, avatar)
//   User.SuspensionStatus.Updated   → update accountStatus on our profile
//   User.Deleted                    → soft-delete our profile
//   Identifier.Lockout              → audit log
//
// Route:
//   POST /api/v1/webhooks/logto
//
// This endpoint is PUBLIC (no auth) but HMAC-verified via Logto's
// signing key. Logto sends a SHA-256 HMAC of the raw body in the
// `logto-signature-sha-256` header.
//
// IDEMPOTENCY: All handlers use upsert / conditional update patterns.
// Receiving the same event twice will not cause errors or data corruption.

import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { profiles, userSessions } from "../../db/schema/index.js";
import { logger } from "../../middleware/logger.js";
import * as loginAuditService from "./login-audit.service.js";
import * as authRepo from "./auth.repository.js";
import * as suspiciousLoginService from "./suspicious-login.service.js";

const log = logger.child({ module: "logto-webhook" });

export const logtoWebhookRoutes = new Hono();

// ── HMAC Signature Verification ────────────────────────────────────

const LOGTO_WEBHOOK_SECRET = process.env.LOGTO_WEBHOOK_SECRET ?? "";

/**
 * Verify the HMAC-SHA256 signature from Logto.
 * Logto sends the signature in the `logto-signature-sha-256` header.
 */
async function verifyLogtoSignature(
  rawBody: string,
  signatureHeader: string,
): Promise<boolean> {
  if (!LOGTO_WEBHOOK_SECRET) {
    log.warn("LOGTO_WEBHOOK_SECRET not configured; skipping HMAC verification");
    // In development, allow through. In production, this should be set.
    return process.env.NODE_ENV !== "production";
  }

  if (!signatureHeader) {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(LOGTO_WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(rawBody),
    );

    const expectedHex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time comparison
    if (expectedHex.length !== signatureHeader.length) {
      return false;
    }
    let mismatch = 0;
    for (let i = 0; i < expectedHex.length; i++) {
      mismatch |= expectedHex.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
    }
    return mismatch === 0;
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : "Unknown" },
      "HMAC verification failed",
    );
    return false;
  }
}

// ── Logto Event Type Mapping ───────────────────────────────────────

const LOGTO_EVENT_TO_TYPE: Record<string, string> = {
  "PostSignIn": "login_success",
  "PostRegister": "register",
  "PostResetPassword": "password_reset",
  "PostSignOut": "logout",
  "User.Created": "user_created",
  "User.Data.Updated": "user_data_updated",
  "User.SuspensionStatus.Updated": "account_suspended",
  "User.Deleted": "user_deleted",
  "Identifier.Lockout": "lockout",
};

function mapLogtoEventType(logtoEvent: string): string {
  return LOGTO_EVENT_TO_TYPE[logtoEvent] ?? `logto_${logtoEvent.toLowerCase()}`;
}

// ── Logto Webhook Payload Types ─────────────────────────────────────

interface LogtoWebhookPayload {
  readonly event: string;
  readonly createdAt?: string;
  readonly interactionEvent?: string;
  readonly sessionId?: string;
  readonly userAgent?: string;
  readonly ip?: string;
  readonly hookId?: string;
  readonly user?: {
    readonly id?: string;
    readonly primaryEmail?: string;
    readonly primaryPhone?: string;
    readonly username?: string;
    readonly name?: string;
    readonly avatar?: string;
    readonly isSuspended?: boolean;
    readonly customData?: Record<string, unknown>;
  };
  readonly body?: Record<string, unknown>;
}

// ── Event Handlers ──────────────────────────────────────────────────

/**
 * User.Created: Sync user to our profiles table.
 * Idempotent via upsert on logtoId unique constraint.
 */
async function handleUserCreated(payload: LogtoWebhookPayload): Promise<void> {
  const user = payload.user;
  if (!user?.id) {
    log.warn("User.Created event missing user.id — skipping");
    return;
  }

  await authRepo.upsertProfile({
    logtoId: user.id,
    email: user.primaryEmail ?? undefined,
    name: user.name ?? undefined,
    picture: user.avatar ?? undefined,
  });

  log.info(
    { logtoId: user.id, email: user.primaryEmail },
    "Profile synced from User.Created event",
  );
}

/**
 * User.Data.Updated: Update profile fields (email, name, avatar).
 * Idempotent — sets fields to latest values.
 */
async function handleUserDataUpdated(payload: LogtoWebhookPayload): Promise<void> {
  const user = payload.user;
  if (!user?.id) {
    log.warn("User.Data.Updated event missing user.id — skipping");
    return;
  }

  // Build update set — only include fields that are present in the payload
  const updateSet: Record<string, unknown> = { updatedAt: new Date() };

  if (user.primaryEmail !== undefined) {
    updateSet.email = user.primaryEmail;
  }
  if (user.name !== undefined) {
    updateSet.name = user.name;
  }
  if (user.avatar !== undefined) {
    updateSet.avatarUrl = user.avatar;
  }

  const [updated] = await db
    .update(profiles)
    .set(updateSet)
    .where(eq(profiles.logtoId, user.id))
    .returning();

  if (updated) {
    log.info(
      { logtoId: user.id, fields: Object.keys(updateSet).filter((k) => k !== "updatedAt") },
      "Profile updated from User.Data.Updated event",
    );
  } else {
    // Profile doesn't exist yet — create it via upsert
    await authRepo.upsertProfile({
      logtoId: user.id,
      email: user.primaryEmail ?? undefined,
      name: user.name ?? undefined,
      picture: user.avatar ?? undefined,
    });
    log.info(
      { logtoId: user.id },
      "Profile created (was missing) from User.Data.Updated event",
    );
  }
}

/**
 * User.SuspensionStatus.Updated: Update our accountStatus.
 * Idempotent — sets status to match Logto's current state.
 */
async function handleSuspensionStatusUpdated(payload: LogtoWebhookPayload): Promise<void> {
  const user = payload.user;
  if (!user?.id) {
    log.warn("User.SuspensionStatus.Updated event missing user.id — skipping");
    return;
  }

  const isSuspended = user.isSuspended ?? false;
  const newStatus = isSuspended ? "suspended" : "active";

  await db
    .update(profiles)
    .set({
      accountStatus: newStatus,
      isBanned: isSuspended,
      suspendedReason: isSuspended ? "Suspended via Logto" : null,
      updatedAt: new Date(),
    })
    .where(eq(profiles.logtoId, user.id));

  log.info(
    { logtoId: user.id, accountStatus: newStatus, isSuspended },
    "Account status updated from User.SuspensionStatus.Updated event",
  );
}

/**
 * User.Deleted: Soft-delete our profile.
 * Idempotent — setting deletedAt is safe to repeat.
 */
async function handleUserDeleted(payload: LogtoWebhookPayload): Promise<void> {
  const user = payload.user;
  if (!user?.id) {
    log.warn("User.Deleted event missing user.id — skipping");
    return;
  }

  await db
    .update(profiles)
    .set({
      accountStatus: "deleted",
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(profiles.logtoId, user.id));

  log.info(
    { logtoId: user.id },
    "Profile soft-deleted from User.Deleted event",
  );
}

/**
 * PostSignIn: Update session lastActiveAt + run suspicious login detection.
 * Idempotent — updates are safe to repeat with same or newer timestamp.
 */
async function handlePostSignIn(
  payload: LogtoWebhookPayload,
  eventData: {
    readonly ipAddress?: string;
    readonly userAgent?: string;
    readonly deviceType?: string;
    readonly browser?: string;
    readonly os?: string;
    readonly geoCountry?: string;
    readonly geoCity?: string;
  },
): Promise<{ riskScore: number; riskSignals: readonly string[] }> {
  const userId = payload.user?.id;
  if (!userId) {
    return { riskScore: 0, riskSignals: [] };
  }

  // ── Update session lastActiveAt ────────────────────────────────
  // Find the most recent active session for this user and update it.
  try {
    const profile = await authRepo.findProfileByLogtoId(userId);
    if (profile) {
      const [latestSession] = await db
        .select()
        .from(userSessions)
        .where(
          and(
            eq(userSessions.userId, profile.id),
            eq(userSessions.isRevoked, false),
          ),
        )
        .orderBy(desc(userSessions.lastActiveAt))
        .limit(1);

      if (latestSession) {
        await db
          .update(userSessions)
          .set({ lastActiveAt: new Date() })
          .where(eq(userSessions.id, latestSession.id));
      }
    }
  } catch (error) {
    log.warn(
      { error: error instanceof Error ? error.message : "Unknown", userId },
      "Failed to update session lastActiveAt — non-critical",
    );
  }

  // ── Suspicious login detection ─────────────────────────────────
  try {
    const assessment = await suspiciousLoginService.detectSuspiciousLogin(
      userId,
      {
        ipAddress: eventData.ipAddress,
        userAgent: eventData.userAgent,
        deviceType: eventData.deviceType,
        browser: eventData.browser,
        os: eventData.os,
        geoCountry: eventData.geoCountry,
        geoCity: eventData.geoCity,
        createdAt: new Date(),
      },
    );

    // Handle alerts (email, admin flag) based on score
    if (assessment.score > 0) {
      await suspiciousLoginService.handleRiskAlerts(
        userId,
        payload.user?.primaryEmail ?? undefined,
        assessment,
      );
    }

    return {
      riskScore: assessment.score,
      riskSignals: assessment.signals,
    };
  } catch (error) {
    log.warn(
      { error: error instanceof Error ? error.message : "Unknown", userId },
      "Suspicious login detection failed — non-critical",
    );
    return { riskScore: 0, riskSignals: [] };
  }
}

// ── POST /api/v1/webhooks/logto ─────────────────────────────────────

logtoWebhookRoutes.post("/logto", async (c) => {
  const rawBody = await c.req.text();
  const signatureHeader = c.req.header("logto-signature-sha-256") ?? "";

  const isValid = await verifyLogtoSignature(rawBody, signatureHeader);
  if (!isValid) {
    log.warn("Logto webhook rejected: HMAC verification failed");
    return c.json({ error: "Invalid signature" }, 401);
  }

  let payload: LogtoWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LogtoWebhookPayload;
  } catch {
    log.warn("Logto webhook rejected: invalid JSON body");
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const logtoEvent = payload.event;
  if (!logtoEvent) {
    return c.json({ ok: true, skipped: true });
  }

  const eventType = mapLogtoEventType(logtoEvent);
  const userAgent = payload.userAgent ?? "";
  const ipAddress = payload.ip ?? c.req.header("x-forwarded-for") ?? undefined;

  // Parse user-agent for device/browser/os details
  const parsed = userAgent
    ? loginAuditService.parseUserAgent(userAgent)
    : { deviceType: undefined, browser: undefined, os: undefined };

  // ── Dispatch event-specific handlers ────────────────────────────
  // These run before the audit log insert so we can enrich the log entry.

  let riskScore: number | undefined;
  let riskSignals: readonly string[] | undefined;

  try {
    switch (logtoEvent) {
      case "User.Created":
        await handleUserCreated(payload);
        break;

      case "User.Data.Updated":
        await handleUserDataUpdated(payload);
        break;

      case "User.SuspensionStatus.Updated":
        await handleSuspensionStatusUpdated(payload);
        break;

      case "User.Deleted":
        await handleUserDeleted(payload);
        break;

      case "PostSignIn": {
        const result = await handlePostSignIn(payload, {
          ipAddress,
          userAgent: userAgent || undefined,
          deviceType: parsed.deviceType,
          browser: parsed.browser,
          os: parsed.os,
        });
        riskScore = result.riskScore;
        riskSignals = result.riskSignals;
        break;
      }

      default:
        // No special handler — just log the event below
        break;
    }
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : "Unknown", event: logtoEvent },
      "Event handler failed — continuing with audit log",
    );
  }

  // ── Record audit trail ──────────────────────────────────────────
  try {
    await loginAuditService.logLoginEvent({
      userId: payload.user?.id,
      email: payload.user?.primaryEmail ?? undefined,
      eventType,
      ipAddress,
      userAgent: userAgent || undefined,
      deviceType: parsed.deviceType,
      browser: parsed.browser,
      os: parsed.os,
      logtoEvent,
      riskScore: riskScore ?? undefined,
      riskSignals: riskSignals?.length ? riskSignals : undefined,
      metadata: {
        sessionId: payload.sessionId,
        username: payload.user?.username,
        name: payload.user?.name,
        createdAt: payload.createdAt,
        hookId: payload.hookId,
        ...(payload.body ?? {}),
      },
    });

    log.info(
      { event: logtoEvent, userId: payload.user?.id, eventType, riskScore },
      "Webhook event processed",
    );
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : "Unknown", event: logtoEvent },
      "Failed to record login event",
    );
    // Return 200 to prevent Logto from retrying on transient DB errors
  }

  return c.json({ ok: true });
});
