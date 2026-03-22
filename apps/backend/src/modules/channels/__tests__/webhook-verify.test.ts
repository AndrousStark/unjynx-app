import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "node:crypto";

vi.mock("../../../middleware/logger.js", () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

import {
  verifyTelegramWebhook,
  verifyWhatsAppSignature,
  verifySmsWebhook,
} from "../webhook-verify.js";

// ── Helpers ─────────────────────────────────────────────────────────

function mockContext(options: {
  headers?: Record<string, string>;
  query?: Record<string, string>;
}) {
  return {
    req: {
      header: (name: string) =>
        options.headers?.[name] ??
        options.headers?.[name.toLowerCase()] ??
        undefined,
      query: (name: string) => options.query?.[name] ?? undefined,
    },
  } as any;
}

// ── Telegram Verification ───────────────────────────────────────────

describe("verifyTelegramWebhook", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("allows all requests when TELEGRAM_BOT_TOKEN is not set", () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_WEBHOOK_SECRET;

    const c = mockContext({});
    expect(verifyTelegramWebhook(c)).toBe(true);
  });

  it("verifies via X-Telegram-Bot-Api-Secret-Token header", () => {
    process.env.TELEGRAM_BOT_TOKEN = "bot123";
    process.env.TELEGRAM_WEBHOOK_SECRET = "my-secret";

    const valid = mockContext({
      headers: { "X-Telegram-Bot-Api-Secret-Token": "my-secret" },
    });
    expect(verifyTelegramWebhook(valid)).toBe(true);

    const invalid = mockContext({
      headers: { "X-Telegram-Bot-Api-Secret-Token": "wrong" },
    });
    expect(verifyTelegramWebhook(invalid)).toBe(false);
  });

  it("verifies via ?token= query parameter", () => {
    process.env.TELEGRAM_BOT_TOKEN = "bot123";
    delete process.env.TELEGRAM_WEBHOOK_SECRET;

    const valid = mockContext({ query: { token: "bot123" } });
    expect(verifyTelegramWebhook(valid)).toBe(true);
  });

  it("rejects when TELEGRAM_WEBHOOK_SECRET is set but no valid header/query", () => {
    process.env.TELEGRAM_BOT_TOKEN = "bot123";
    process.env.TELEGRAM_WEBHOOK_SECRET = "my-secret";

    const noHeaders = mockContext({});
    expect(verifyTelegramWebhook(noHeaders)).toBe(false);
  });

  it("allows when only bot token set (backward compatibility)", () => {
    process.env.TELEGRAM_BOT_TOKEN = "bot123";
    delete process.env.TELEGRAM_WEBHOOK_SECRET;

    // No header, no query — backward compatibility allows it
    const c = mockContext({});
    expect(verifyTelegramWebhook(c)).toBe(true);
  });
});

// ── WhatsApp (Gupshup) Verification ────────────────────────────────

describe("verifyWhatsAppSignature", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("allows all requests when GUPSHUP_WEBHOOK_SECRET is not set", () => {
    delete process.env.GUPSHUP_WEBHOOK_SECRET;

    const c = mockContext({});
    expect(verifyWhatsAppSignature(c, "body")).toBe(true);
  });

  it("rejects when signature header is missing", () => {
    process.env.GUPSHUP_WEBHOOK_SECRET = "secret123";

    const c = mockContext({});
    expect(verifyWhatsAppSignature(c, "body")).toBe(false);
  });

  it("accepts valid HMAC-SHA256 signature", () => {
    const secret = "secret123";
    const rawBody = '{"type":"message","payload":{"text":"DONE"}}';
    process.env.GUPSHUP_WEBHOOK_SECRET = secret;

    const expectedSig = createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const c = mockContext({
      headers: { "gupshup-signature": expectedSig },
    });
    expect(verifyWhatsAppSignature(c, rawBody)).toBe(true);
  });

  it("rejects invalid HMAC-SHA256 signature", () => {
    process.env.GUPSHUP_WEBHOOK_SECRET = "secret123";

    const c = mockContext({
      headers: { "gupshup-signature": "0000000000000000000000000000000000000000000000000000000000000000" },
    });
    expect(verifyWhatsAppSignature(c, "body")).toBe(false);
  });

  it("rejects signature with wrong length", () => {
    process.env.GUPSHUP_WEBHOOK_SECRET = "secret123";

    const c = mockContext({
      headers: { "gupshup-signature": "abc" },
    });
    // This may throw or return false — either way, should not return true
    expect(verifyWhatsAppSignature(c, "body")).toBe(false);
  });
});

// ── SMS (MSG91) Verification ───────────────────────────────────────

describe("verifySmsWebhook", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("allows all requests when MSG91_WEBHOOK_TOKEN is not set", () => {
    delete process.env.MSG91_WEBHOOK_TOKEN;

    const c = mockContext({});
    expect(verifySmsWebhook(c)).toBe(true);
  });

  it("rejects when Authorization header is missing", () => {
    process.env.MSG91_WEBHOOK_TOKEN = "token123";

    const c = mockContext({});
    expect(verifySmsWebhook(c)).toBe(false);
  });

  it("accepts valid bearer token", () => {
    process.env.MSG91_WEBHOOK_TOKEN = "token123";

    const c = mockContext({
      headers: { Authorization: "Bearer token123" },
    });
    expect(verifySmsWebhook(c)).toBe(true);
  });

  it("rejects invalid bearer token", () => {
    process.env.MSG91_WEBHOOK_TOKEN = "token123";

    const c = mockContext({
      headers: { Authorization: "Bearer wrong-token" },
    });
    expect(verifySmsWebhook(c)).toBe(false);
  });

  it("rejects token with wrong length", () => {
    process.env.MSG91_WEBHOOK_TOKEN = "token123";

    const c = mockContext({
      headers: { Authorization: "Bearer short" },
    });
    expect(verifySmsWebhook(c)).toBe(false);
  });
});
