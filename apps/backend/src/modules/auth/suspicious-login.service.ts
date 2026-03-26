// ── Suspicious Login Detection Service ─────────────────────────────────
// Analyzes login events to detect suspicious activity based on device
// fingerprints, geolocation changes, impossible travel, and brute force.
//
// Called from the Logto webhook handler on PostSignIn events.
// Risk scores drive alert escalation:
//   < 30  → log only
//   30-60 → log + email alert to user
//   > 60  → log + email alert + flag in admin panel

import { eq, and, desc, gte, lte, count } from "drizzle-orm";
import { db } from "../../db/index.js";
import { loginEvents, type LoginEvent } from "../../db/schema/index.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "suspicious-login" });

// ── Signal Types ──────────────────────────────────────────────────────

export type RiskSignal =
  | "NEW_DEVICE"
  | "NEW_COUNTRY"
  | "IMPOSSIBLE_TRAVEL"
  | "BRUTE_FORCE";

// ── Signal Score Map ──────────────────────────────────────────────────

const SIGNAL_SCORES: Readonly<Record<RiskSignal, number>> = {
  NEW_DEVICE: 20,
  NEW_COUNTRY: 40,
  IMPOSSIBLE_TRAVEL: 80,
  BRUTE_FORCE: 90,
};

// ── Time Constants ────────────────────────────────────────────────────

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60_000;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60_000;
const TWO_HOURS_MS = 2 * 60 * 60_000;
const FIFTEEN_MINUTES_MS = 15 * 60_000;
const BRUTE_FORCE_THRESHOLD = 5;

// ── Current Login Event Shape ─────────────────────────────────────────

export interface CurrentLoginEvent {
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly deviceType?: string;
  readonly browser?: string;
  readonly os?: string;
  readonly geoCountry?: string;
  readonly geoCity?: string;
  readonly createdAt: Date;
}

// ── Risk Assessment Result ────────────────────────────────────────────

export interface RiskAssessment {
  readonly score: number;
  readonly signals: readonly RiskSignal[];
  readonly details: Record<string, unknown>;
}

// ── Device Fingerprint ────────────────────────────────────────────────

function buildDeviceFingerprint(event: {
  readonly deviceType?: string | null;
  readonly browser?: string | null;
  readonly os?: string | null;
}): string {
  return [
    event.deviceType ?? "unknown",
    event.browser ?? "unknown",
    event.os ?? "unknown",
  ].join("|");
}

// ── Core Detection ────────────────────────────────────────────────────

/**
 * Detect suspicious signals by comparing the current login event
 * against the user's recent login history.
 *
 * Signals checked:
 *   - NEW_DEVICE:        device fingerprint not seen in last 30 days
 *   - NEW_COUNTRY:       country not seen in last 90 days
 *   - IMPOSSIBLE_TRAVEL: different country within 2 hours of last login
 *   - BRUTE_FORCE:       5+ failed attempts from same IP in 15 minutes
 */
export async function detectSuspiciousLogin(
  userId: string,
  currentEvent: CurrentLoginEvent,
): Promise<RiskAssessment> {
  const signals: RiskSignal[] = [];
  const details: Record<string, unknown> = {};

  try {
    // Fetch recent successful login events for this user (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - NINETY_DAYS_MS);
    const recentEvents = await db
      .select()
      .from(loginEvents)
      .where(
        and(
          eq(loginEvents.userId, userId),
          eq(loginEvents.eventType, "login_success"),
          gte(loginEvents.createdAt, ninetyDaysAgo),
        ),
      )
      .orderBy(desc(loginEvents.createdAt))
      .limit(200);

    // If no history, first-time login is not suspicious
    if (recentEvents.length === 0) {
      return { score: 0, signals: [], details: { reason: "first_login" } };
    }

    // ── NEW_DEVICE detection ──────────────────────────────────────
    const currentFingerprint = buildDeviceFingerprint(currentEvent);
    const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS);
    const recentDeviceFingerprints = new Set(
      recentEvents
        .filter((e) => e.createdAt >= thirtyDaysAgo)
        .map((e) => buildDeviceFingerprint(e)),
    );

    if (recentDeviceFingerprints.size > 0 && !recentDeviceFingerprints.has(currentFingerprint)) {
      signals.push("NEW_DEVICE");
      details.newDevice = currentFingerprint;
      details.knownDevices = [...recentDeviceFingerprints];
    }

    // ── NEW_COUNTRY detection ─────────────────────────────────────
    if (currentEvent.geoCountry) {
      const recentCountries = new Set(
        recentEvents
          .filter((e) => e.geoCountry !== null && e.geoCountry !== undefined)
          .map((e) => e.geoCountry!),
      );

      if (recentCountries.size > 0 && !recentCountries.has(currentEvent.geoCountry)) {
        signals.push("NEW_COUNTRY");
        details.newCountry = currentEvent.geoCountry;
        details.knownCountries = [...recentCountries];
      }
    }

    // ── IMPOSSIBLE_TRAVEL detection ───────────────────────────────
    if (currentEvent.geoCountry) {
      const lastLogin = recentEvents[0];
      if (lastLogin && lastLogin.geoCountry) {
        const timeSinceLastLogin =
          currentEvent.createdAt.getTime() - lastLogin.createdAt.getTime();

        if (
          timeSinceLastLogin < TWO_HOURS_MS &&
          timeSinceLastLogin > 0 &&
          lastLogin.geoCountry !== currentEvent.geoCountry
        ) {
          signals.push("IMPOSSIBLE_TRAVEL");
          details.impossibleTravel = {
            previousCountry: lastLogin.geoCountry,
            currentCountry: currentEvent.geoCountry,
            timeBetweenMs: timeSinceLastLogin,
            timeBetweenMinutes: Math.round(timeSinceLastLogin / 60_000),
          };
        }
      }
    }

    // ── BRUTE_FORCE detection ─────────────────────────────────────
    if (currentEvent.ipAddress) {
      const fifteenMinutesAgo = new Date(Date.now() - FIFTEEN_MINUTES_MS);
      const failedFromIp = await db
        .select()
        .from(loginEvents)
        .where(
          and(
            eq(loginEvents.ipAddress, currentEvent.ipAddress),
            eq(loginEvents.eventType, "login_failed"),
            gte(loginEvents.createdAt, fifteenMinutesAgo),
          ),
        )
        .limit(BRUTE_FORCE_THRESHOLD + 1);

      if (failedFromIp.length >= BRUTE_FORCE_THRESHOLD) {
        signals.push("BRUTE_FORCE");
        details.bruteForce = {
          failedAttempts: failedFromIp.length,
          ip: currentEvent.ipAddress,
          windowMinutes: 15,
        };
      }
    }
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : "Unknown", userId },
      "Suspicious login detection failed — defaulting to safe",
    );
    // On error, return zero risk to avoid blocking legitimate logins
    return { score: 0, signals: [], details: { error: "detection_failed" } };
  }

  const score = getRiskScore(signals);

  return { score, signals, details };
}

// ── Risk Score Calculation ────────────────────────────────────────────

/**
 * Calculate a 0-100 risk score from the detected signals.
 * Scores are capped at 100.
 */
export function getRiskScore(signals: readonly RiskSignal[]): number {
  if (signals.length === 0) return 0;

  const total = signals.reduce(
    (sum, signal) => sum + SIGNAL_SCORES[signal],
    0,
  );

  return Math.min(total, 100);
}

// ── Alert Handling ────────────────────────────────────────────────────

/**
 * Handle alerts based on risk score:
 *   < 30  → log only
 *   30-60 → log + email alert
 *   > 60  → log + email alert + flag in admin panel
 */
export async function handleRiskAlerts(
  userId: string,
  email: string | undefined,
  assessment: RiskAssessment,
): Promise<void> {
  if (assessment.score < 30) {
    log.info(
      { userId, score: assessment.score, signals: assessment.signals },
      "Low-risk login — logged only",
    );
    return;
  }

  if (assessment.score <= 60) {
    log.warn(
      { userId, score: assessment.score, signals: assessment.signals, details: assessment.details },
      "Medium-risk login — sending alert email",
    );
    if (email) {
      await sendSuspiciousLoginAlert(email, assessment);
    }
    return;
  }

  // score > 60
  log.error(
    { userId, score: assessment.score, signals: assessment.signals, details: assessment.details },
    "High-risk login — sending alert + flagging in admin",
  );
  if (email) {
    await sendSuspiciousLoginAlert(email, assessment);
  }
  // The flagging in admin is handled by the risk_score column in login_events.
  // Admin endpoint GET /api/v1/admin/suspicious-logins queries events with risk_score > 30.
}

// ── Email Alert ───────────────────────────────────────────────────────

async function sendSuspiciousLoginAlert(
  email: string,
  assessment: RiskAssessment,
): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    log.info(
      { email },
      "SendGrid not configured — skipping suspicious login alert email",
    );
    return;
  }

  const fromEmail = process.env.SENDGRID_FROM_EMAIL ?? "noreply@unjynx.me";
  const fromName = process.env.SENDGRID_FROM_NAME ?? "UNJYNX Security";

  const country =
    (assessment.details.newCountry as string) ??
    (assessment.details.impossibleTravel as Record<string, unknown>)?.currentCountry ??
    "an unknown location";

  const signalList = assessment.signals.map((s) => {
    switch (s) {
      case "NEW_DEVICE":
        return "New device detected";
      case "NEW_COUNTRY":
        return `Login from new country: ${country}`;
      case "IMPOSSIBLE_TRAVEL":
        return "Impossible travel detected (login from a different country within 2 hours)";
      case "BRUTE_FORCE":
        return "Multiple failed login attempts detected from your IP";
    }
  });

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: fromEmail, name: fromName },
        subject: "UNJYNX — Suspicious Login Alert",
        content: [
          {
            type: "text/plain",
            value: [
              "Hi,",
              "",
              "We detected a suspicious login to your UNJYNX account.",
              "",
              "Details:",
              ...signalList.map((s) => `  - ${s}`),
              "",
              `Risk Score: ${assessment.score}/100`,
              "",
              "If this was you, you can safely ignore this email.",
              "If this was NOT you, please change your password immediately and enable MFA.",
              "",
              "Stay safe,",
              "The UNJYNX Security Team",
            ].join("\n"),
          },
          {
            type: "text/html",
            value: `
              <div style="font-family: 'Outfit', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0F0A1A; color: #F0EBF7; border-radius: 16px;">
                <h1 style="color: #FF4444; font-size: 24px; margin-bottom: 8px;">Suspicious Login Alert</h1>
                <p style="color: #9B8BB8; margin-bottom: 24px;">UNJYNX Security</p>
                <p>We detected unusual activity on your account:</p>
                <ul style="color: #FFD700; margin: 16px 0;">
                  ${signalList.map((s) => `<li style="margin-bottom: 8px;">${s}</li>`).join("")}
                </ul>
                <div style="background: #1E1333; border: 1px solid ${assessment.score > 60 ? "#FF4444" : "#FFD700"}; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
                  <span style="font-size: 14px; color: #9B8BB8;">Risk Score</span><br/>
                  <code style="font-size: 28px; color: ${assessment.score > 60 ? "#FF4444" : "#FFD700"};">${assessment.score}/100</code>
                </div>
                <p>If this was <strong>not you</strong>, please change your password immediately and enable MFA.</p>
                <p style="color: #6B5B8A; font-size: 12px; margin-top: 24px;">If this was you, you can safely ignore this email.</p>
              </div>
            `,
          },
        ],
      }),
    });

    if (!response.ok) {
      log.warn(
        { status: response.status, email },
        "Suspicious login alert email send failed",
      );
    }
  } catch (error) {
    log.warn({ error, email }, "Suspicious login alert email error");
  }
}

// ── Admin Query: Suspicious Logins ────────────────────────────────────

export interface SuspiciousLoginQuery {
  readonly page: number;
  readonly limit: number;
  readonly minScore?: number;
  readonly userId?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
}

/**
 * List login events with risk_score above a threshold.
 * Used by the admin suspicious-logins endpoint.
 */
export async function getSuspiciousLogins(
  opts: SuspiciousLoginQuery,
): Promise<{ items: LoginEvent[]; total: number }> {
  const conditions = [
    gte(loginEvents.riskScore, opts.minScore ?? 30),
  ];

  if (opts.userId) {
    conditions.push(eq(loginEvents.userId, opts.userId));
  }
  if (opts.dateFrom) {
    conditions.push(gte(loginEvents.createdAt, new Date(opts.dateFrom)));
  }
  if (opts.dateTo) {
    conditions.push(lte(loginEvents.createdAt, new Date(opts.dateTo)));
  }

  const where = and(...conditions);
  const offset = (opts.page - 1) * opts.limit;

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(loginEvents)
      .where(where)
      .orderBy(desc(loginEvents.createdAt))
      .limit(opts.limit)
      .offset(offset),
    db.select({ total: count() }).from(loginEvents).where(where),
  ]);

  return { items, total };
}
