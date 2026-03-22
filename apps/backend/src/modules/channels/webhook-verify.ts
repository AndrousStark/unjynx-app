// ── Webhook Verification ────────────────────────────────────────────
// Security verification for inbound webhook requests from channel
// providers. Each provider has its own verification strategy:
//
//   Telegram  — secret_token header or URL query param
//   WhatsApp  — Gupshup HMAC-SHA256 signature on raw body
//   SMS       — MSG91 Authorization bearer token header
//
// When the corresponding env var is not set (dev/mock mode), all
// requests are allowed through.

import type { Context } from "hono";
import { createHmac, timingSafeEqual } from "node:crypto";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "webhook-verify" });

// ── Telegram Verification ───────────────────────────────────────────
// Telegram webhook can be verified via:
//   1. X-Telegram-Bot-Api-Secret-Token header (set via setWebhook API)
//   2. ?token= query parameter matching the bot token
//
// When TELEGRAM_WEBHOOK_SECRET is set, we require the header match.
// When only TELEGRAM_BOT_TOKEN is set, we check the query param.
// When neither is set, all requests pass (mock/dev mode).

export function verifyTelegramWebhook(c: Context): boolean {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  // Mock mode — no token configured, allow all
  if (!botToken) {
    return true;
  }

  // Strategy 1: Check X-Telegram-Bot-Api-Secret-Token header
  const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secretToken) {
    const headerToken = c.req.header("X-Telegram-Bot-Api-Secret-Token");
    if (headerToken && headerToken === secretToken) {
      return true;
    }
  }

  // Strategy 2: Check ?token= query parameter
  const queryToken = c.req.query("token");
  if (queryToken && queryToken === botToken) {
    return true;
  }

  // If TELEGRAM_WEBHOOK_SECRET is set, we require valid verification
  if (secretToken) {
    log.warn(
      { ip: c.req.header("x-forwarded-for") ?? "unknown" },
      "Telegram webhook verification failed",
    );
    return false;
  }

  // Backward compatibility: when only bot token is set but no
  // explicit webhook secret, allow requests through
  return true;
}

// ── WhatsApp (Gupshup) Verification ────────────────────────────────
// Gupshup supports HMAC-SHA256 signature verification.
// The signature is sent in the "gupshup-signature" header.
// Computed as HMAC-SHA256(rawBody, GUPSHUP_WEBHOOK_SECRET).
//
// The raw body is passed as a parameter because Hono only allows
// reading the request body once — the caller reads it and passes
// both the raw string and the parsed JSON.

export function verifyWhatsAppSignature(
  c: Context,
  rawBody: string,
): boolean {
  const webhookSecret = process.env.GUPSHUP_WEBHOOK_SECRET;

  // Mock mode — no secret configured, allow all
  if (!webhookSecret) {
    return true;
  }

  const signature = c.req.header("gupshup-signature");
  if (!signature) {
    log.warn(
      { ip: c.req.header("x-forwarded-for") ?? "unknown" },
      "WhatsApp webhook missing signature header",
    );
    return false;
  }

  try {
    const expected = createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    if (sigBuffer.length !== expectedBuffer.length) {
      log.warn("WhatsApp webhook signature length mismatch");
      return false;
    }

    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : "Unknown" },
      "WhatsApp webhook verification error",
    );
    return false;
  }
}

// ── SMS (MSG91) Verification ───────────────────────────────────────
// MSG91 webhook verification via Authorization header bearer token.
// We use constant-time comparison to prevent timing attacks.

export function verifySmsWebhook(c: Context): boolean {
  const webhookToken = process.env.MSG91_WEBHOOK_TOKEN;

  // Mock mode — no token configured, allow all
  if (!webhookToken) {
    return true;
  }

  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    log.warn(
      { ip: c.req.header("x-forwarded-for") ?? "unknown" },
      "SMS webhook missing Authorization header",
    );
    return false;
  }

  const expectedHeader = `Bearer ${webhookToken}`;

  // Constant-time comparison to prevent timing attacks
  const authBuffer = Buffer.from(authHeader);
  const expectedBuffer = Buffer.from(expectedHeader);

  if (authBuffer.length !== expectedBuffer.length) {
    log.warn("SMS webhook Authorization header length mismatch");
    return false;
  }

  if (!timingSafeEqual(authBuffer, expectedBuffer)) {
    log.warn("SMS webhook Authorization token mismatch");
    return false;
  }

  return true;
}
