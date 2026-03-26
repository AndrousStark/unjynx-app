import { eq, and, desc, gte, lte, count } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  loginEvents,
  type LoginEvent,
  type NewLoginEvent,
} from "../../db/schema/index.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface LogLoginEventInput {
  readonly userId?: string;
  readonly email?: string;
  readonly eventType: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly deviceType?: string;
  readonly browser?: string;
  readonly os?: string;
  readonly geoCountry?: string;
  readonly geoCity?: string;
  readonly logtoEvent?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface LoginHistoryOptions {
  readonly page: number;
  readonly limit: number;
  readonly eventType?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
}

// ── Service Functions ──────────────────────────────────────────────────

/**
 * Record a login-related event (success, failure, logout, MFA, lockout).
 */
export async function logLoginEvent(
  input: LogLoginEventInput,
): Promise<LoginEvent> {
  const data: NewLoginEvent = {
    userId: input.userId,
    email: input.email,
    eventType: input.eventType,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    deviceType: input.deviceType,
    browser: input.browser,
    os: input.os,
    geoCountry: input.geoCountry,
    geoCity: input.geoCity,
    logtoEvent: input.logtoEvent,
    metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
  };

  const [created] = await db
    .insert(loginEvents)
    .values(data)
    .returning();

  return created;
}

/**
 * Get paginated login history for a specific user.
 */
export async function getLoginHistory(
  userId: string,
  opts: LoginHistoryOptions,
): Promise<{ items: LoginEvent[]; total: number }> {
  const conditions = [eq(loginEvents.userId, userId)];

  if (opts.eventType) {
    conditions.push(eq(loginEvents.eventType, opts.eventType));
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

/**
 * Get recent login events from a specific IP address.
 * Useful for detecting brute-force attempts.
 */
export async function getRecentLoginsByIp(
  ip: string,
  minutesBack: number = 60,
): Promise<LoginEvent[]> {
  const since = new Date(Date.now() - minutesBack * 60_000);

  return db
    .select()
    .from(loginEvents)
    .where(
      and(
        eq(loginEvents.ipAddress, ip),
        gte(loginEvents.createdAt, since),
      ),
    )
    .orderBy(desc(loginEvents.createdAt))
    .limit(100);
}

/**
 * Get all login events (admin view), paginated and filterable.
 */
export async function getAllLoginEvents(opts: {
  readonly page: number;
  readonly limit: number;
  readonly userId?: string;
  readonly eventType?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
}): Promise<{ items: LoginEvent[]; total: number }> {
  const conditions = [];

  if (opts.userId) {
    conditions.push(eq(loginEvents.userId, opts.userId));
  }
  if (opts.eventType) {
    conditions.push(eq(loginEvents.eventType, opts.eventType));
  }
  if (opts.dateFrom) {
    conditions.push(gte(loginEvents.createdAt, new Date(opts.dateFrom)));
  }
  if (opts.dateTo) {
    conditions.push(lte(loginEvents.createdAt, new Date(opts.dateTo)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
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

// ── User-Agent Parsing Helpers ──────────────────────────────────────

/**
 * Parse a User-Agent string to extract device type, browser, and OS.
 * Uses simple regex heuristics (no heavy dependency).
 */
export function parseUserAgent(ua: string): {
  readonly deviceType: string;
  readonly browser: string;
  readonly os: string;
} {
  const deviceType = detectDeviceType(ua);
  const browser = detectBrowser(ua);
  const os = detectOs(ua);
  return { deviceType, browser, os };
}

function detectDeviceType(ua: string): string {
  const lower = ua.toLowerCase();
  if (/mobile|android.*mobile|iphone|ipod|blackberry|windows phone/i.test(lower)) {
    return "mobile";
  }
  if (/ipad|android(?!.*mobile)|tablet/i.test(lower)) {
    return "tablet";
  }
  return "desktop";
}

function detectBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\//i.test(ua) || /opera/i.test(ua)) return "Opera";
  if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) return "Chrome";
  if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) return "Safari";
  if (/firefox\//i.test(ua)) return "Firefox";
  return "Unknown";
}

function detectOs(ua: string): string {
  if (/windows nt/i.test(ua)) return "Windows";
  if (/macintosh|mac os x/i.test(ua)) return "macOS";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Unknown";
}
