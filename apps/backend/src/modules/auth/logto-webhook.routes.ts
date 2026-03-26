// ── Logto Webhook Handler ───────────────────────────────────────────
// Receives Logto webhook events (PostSignIn, PostRegister, etc.)
// and records them in the login_events table for audit trail.
//
// Route:
//   POST /api/v1/webhooks/logto
//
// This endpoint is PUBLIC (no auth) but HMAC-verified via Logto's
// signing key. Logto sends a SHA-256 HMAC of the raw body in the
// `logto-signature-sha-256` header.

import { Hono } from "hono";
import { logger } from "../../middleware/logger.js";
import * as loginAuditService from "./login-audit.service.js";

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
  "User.SuspensionStatus.Updated": "account_suspended",
  "Identifier.Lockout": "lockout",
};

function mapLogtoEventType(logtoEvent: string): string {
  return LOGTO_EVENT_TO_TYPE[logtoEvent] ?? `logto_${logtoEvent.toLowerCase()}`;
}

// ── Logto Webhook Payload Types ─────────────────────────────────────

interface LogtoWebhookPayload {
  readonly event: string;
  readonly createdAt?: string;
  readonly sessionId?: string;
  readonly userAgent?: string;
  readonly ip?: string;
  readonly user?: {
    readonly id?: string;
    readonly primaryEmail?: string;
    readonly primaryPhone?: string;
    readonly username?: string;
    readonly name?: string;
  };
  readonly body?: Record<string, unknown>;
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
      metadata: {
        sessionId: payload.sessionId,
        username: payload.user?.username,
        name: payload.user?.name,
        createdAt: payload.createdAt,
        ...(payload.body ?? {}),
      },
    });

    log.info(
      { event: logtoEvent, userId: payload.user?.id, eventType },
      "Login event recorded",
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
