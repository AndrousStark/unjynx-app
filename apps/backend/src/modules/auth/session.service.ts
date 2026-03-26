import { eq, and, lt, gte } from "drizzle-orm";
import { db } from "../../db/index.js";
import { userSessions, type UserSession } from "../../db/schema/index.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "session-service" });

// ── Types ───────────────────────────────────────────────────────────

interface SessionMetadata {
  readonly deviceType?: string;
  readonly browser?: string;
  readonly os?: string;
  readonly ipAddress?: string;
  readonly geoCountry?: string;
  readonly geoCity?: string;
  readonly expiresAt?: Date;
}

// Default session TTL: 30 days
const DEFAULT_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// ── Hash utility ────────────────────────────────────────────────────

/**
 * Create a SHA-256 hash of a token. Never store raw refresh tokens.
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Service Functions ───────────────────────────────────────────────

/**
 * Create a new session record after successful auth callback.
 */
export async function createSession(
  userId: string,
  tokenHash: string,
  metadata: SessionMetadata,
): Promise<UserSession> {
  const expiresAt =
    metadata.expiresAt ?? new Date(Date.now() + DEFAULT_SESSION_TTL_MS);

  const [session] = await db
    .insert(userSessions)
    .values({
      userId,
      tokenHash,
      deviceType: metadata.deviceType ?? null,
      browser: metadata.browser ?? null,
      os: metadata.os ?? null,
      ipAddress: metadata.ipAddress ?? null,
      geoCountry: metadata.geoCountry ?? null,
      geoCity: metadata.geoCity ?? null,
      expiresAt,
    })
    .returning();

  log.info({ userId, sessionId: session.id }, "Session created");

  return session;
}

/**
 * List all active (non-revoked, non-expired) sessions for a user.
 */
export async function listActiveSessions(
  userId: string,
): Promise<readonly UserSession[]> {
  const now = new Date();

  return db
    .select()
    .from(userSessions)
    .where(
      and(
        eq(userSessions.userId, userId),
        eq(userSessions.isRevoked, false),
        gte(userSessions.expiresAt, now),
      ),
    );
}

/**
 * Revoke a specific session by session ID.
 * Verifies that the session belongs to the given user.
 */
export async function revokeSession(
  userId: string,
  sessionId: string,
): Promise<boolean> {
  const [updated] = await db
    .update(userSessions)
    .set({ isRevoked: true })
    .where(
      and(
        eq(userSessions.id, sessionId),
        eq(userSessions.userId, userId),
      ),
    )
    .returning();

  if (updated) {
    log.info({ userId, sessionId }, "Session revoked");
  }

  return !!updated;
}

/**
 * Revoke all sessions for a user, optionally keeping one active
 * (the current session).
 */
export async function revokeAllSessions(
  userId: string,
  exceptSessionId?: string,
): Promise<number> {
  if (exceptSessionId) {
    // Revoke all sessions, then un-revoke the exception.
    // Two-step approach since Drizzle doesn't support != in all contexts.
    const results = await db
      .update(userSessions)
      .set({ isRevoked: true })
      .where(
        and(
          eq(userSessions.userId, userId),
          eq(userSessions.isRevoked, false),
        ),
      )
      .returning();

    // Restore the excepted session
    await db
      .update(userSessions)
      .set({ isRevoked: false })
      .where(
        and(
          eq(userSessions.id, exceptSessionId),
          eq(userSessions.userId, userId),
        ),
      );

    const revokedCount = results.filter(
      (r) => r.id !== exceptSessionId,
    ).length;

    log.info(
      { userId, revokedCount, exceptSessionId },
      "All sessions revoked (except current)",
    );

    return revokedCount;
  }

  // Revoke all sessions for the user
  const results = await db
    .update(userSessions)
    .set({ isRevoked: true })
    .where(
      and(
        eq(userSessions.userId, userId),
        eq(userSessions.isRevoked, false),
      ),
    )
    .returning();

  log.info(
    { userId, revokedCount: results.length },
    "All sessions revoked",
  );

  return results.length;
}

/**
 * Update the lastActiveAt timestamp for a session identified by
 * its token hash. Called during token refresh.
 */
export async function refreshSessionActivity(
  tokenHash: string,
): Promise<boolean> {
  const [updated] = await db
    .update(userSessions)
    .set({ lastActiveAt: new Date() })
    .where(
      and(
        eq(userSessions.tokenHash, tokenHash),
        eq(userSessions.isRevoked, false),
      ),
    )
    .returning();

  return !!updated;
}

/**
 * Delete sessions that have expired. Run as a daily cron job.
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const now = new Date();

  const deleted = await db
    .delete(userSessions)
    .where(lt(userSessions.expiresAt, now))
    .returning();

  if (deleted.length > 0) {
    log.info(
      { deletedCount: deleted.length },
      "Expired sessions cleaned up",
    );
  }

  return deleted.length;
}
