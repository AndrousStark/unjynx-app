import { createHmac } from "node:crypto";
import { logger } from "../../middleware/logger.js";
import * as adminRepo from "./admin.repository.js";

const log = logger.child({ module: "siem-webhook" });

const SIEM_FLAG_URL_KEY = "siem_webhook_url";
const SIEM_FLAG_SECRET_KEY = "siem_webhook_secret";
const SIEM_FLAG_ENABLED_KEY = "siem_enabled";

const SIEM_TIMEOUT_MS = 5_000;

// ── Types ──────────────────────────────────────────────────────────────

export interface SiemConfig {
  readonly webhookUrl: string | null;
  readonly webhookSecret: string | null;
  readonly enabled: boolean;
}

export interface SiemAuditEvent {
  readonly timestamp: string;
  readonly actor: string;
  readonly action: string;
  readonly target: string;
  readonly targetId: string | undefined;
  readonly metadata: Record<string, unknown> | undefined;
  readonly ipAddress: string | undefined;
}

// ── Config Management ─────────────────────────────────────────────────

export async function getSiemConfig(): Promise<SiemConfig> {
  const [urlFlag, secretFlag, enabledFlag] = await Promise.all([
    adminRepo.findFeatureFlagByKey(SIEM_FLAG_URL_KEY),
    adminRepo.findFeatureFlagByKey(SIEM_FLAG_SECRET_KEY),
    adminRepo.findFeatureFlagByKey(SIEM_FLAG_ENABLED_KEY),
  ]);

  return {
    webhookUrl: urlFlag?.userList ?? null,
    webhookSecret: secretFlag?.userList ?? null,
    enabled: enabledFlag?.status === "enabled",
  };
}

export async function updateSiemConfig(
  webhookUrl: string | undefined,
  webhookSecret: string | undefined,
  enabled: boolean | undefined,
): Promise<SiemConfig> {
  const current = await getSiemConfig();

  const finalUrl = webhookUrl !== undefined ? webhookUrl : current.webhookUrl;
  const finalSecret = webhookSecret !== undefined ? webhookSecret : current.webhookSecret;
  const finalEnabled = enabled !== undefined ? enabled : current.enabled;

  await Promise.all([
    finalUrl !== null
      ? adminRepo.upsertFeatureFlagByKey(
          SIEM_FLAG_URL_KEY,
          "SIEM Webhook URL",
          "URL for SIEM event forwarding",
          finalUrl,
          "enabled",
        )
      : Promise.resolve(),
    finalSecret !== null
      ? adminRepo.upsertFeatureFlagByKey(
          SIEM_FLAG_SECRET_KEY,
          "SIEM Webhook Secret",
          "HMAC-SHA256 secret for SIEM payload signing",
          finalSecret,
          "enabled",
        )
      : Promise.resolve(),
    adminRepo.upsertFeatureFlagByKey(
      SIEM_FLAG_ENABLED_KEY,
      "SIEM Enabled",
      "Whether SIEM webhook forwarding is enabled",
      undefined,
      finalEnabled ? "enabled" : "disabled",
    ),
  ]);

  return {
    webhookUrl: finalUrl,
    webhookSecret: finalSecret !== null ? "***" : null,
    enabled: finalEnabled,
  };
}

// ── Payload Signing ───────────────────────────────────────────────────

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

// ── Forward to SIEM (fire-and-forget, single retry) ──────────────────

export function forwardToSiem(event: SiemAuditEvent): void {
  // Non-blocking: schedule on the microtask queue, don't await
  void forwardToSiemAsync(event);
}

async function forwardToSiemAsync(event: SiemAuditEvent): Promise<void> {
  try {
    const config = await getSiemConfig();

    if (!config.enabled) return;
    if (!config.webhookUrl) {
      log.warn("SIEM enabled but no webhook URL configured");
      return;
    }

    const payload = JSON.stringify(event);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-SIEM-Timestamp": event.timestamp,
    };

    if (config.webhookSecret) {
      headers["X-SIEM-Signature"] = signPayload(payload, config.webhookSecret);
    }

    await sendWithRetry(config.webhookUrl, payload, headers, 1);
  } catch (error) {
    log.error({ error, event: event.action }, "SIEM forward failed (dropped)");
  }
}

async function sendWithRetry(
  url: string,
  payload: string,
  headers: Record<string, string>,
  maxRetries: number,
): Promise<void> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), SIEM_TIMEOUT_MS);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: payload,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        log.debug("SIEM event forwarded successfully");
        return;
      }

      log.warn(
        { status: response.status, attempt },
        "SIEM webhook returned non-OK status",
      );
    } catch (error) {
      if (attempt === maxRetries) {
        log.error(
          { error, attempt },
          "SIEM webhook send failed after retries, dropping event",
        );
        return;
      }
      log.warn({ error, attempt }, "SIEM webhook send failed, retrying");
    }
  }
}

// ── Test Event ────────────────────────────────────────────────────────

export async function sendTestEvent(): Promise<{
  readonly success: boolean;
  readonly message: string;
}> {
  const config = await getSiemConfig();

  if (!config.enabled) {
    return { success: false, message: "SIEM forwarding is not enabled" };
  }

  if (!config.webhookUrl) {
    return { success: false, message: "No webhook URL configured" };
  }

  const testEvent: SiemAuditEvent = {
    timestamp: new Date().toISOString(),
    actor: "system",
    action: "siem.test",
    target: "siem_config",
    targetId: undefined,
    metadata: { message: "SIEM connectivity test from UNJYNX admin" },
    ipAddress: undefined,
  };

  const payload = JSON.stringify(testEvent);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-SIEM-Timestamp": testEvent.timestamp,
  };

  if (config.webhookSecret) {
    headers["X-SIEM-Signature"] = signPayload(payload, config.webhookSecret);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SIEM_TIMEOUT_MS);

    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers,
      body: payload,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      return { success: true, message: `Webhook responded with ${response.status}` };
    }

    return {
      success: false,
      message: `Webhook returned HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Connection failed: ${errMsg}` };
  }
}
