import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// ── Mock the auth middleware ──────────────────────────────────────────
vi.mock("../../../middleware/auth.js", () => ({
  authMiddleware: vi.fn(async (c: any, next: any) => {
    c.set("auth", { sub: "logto-1", profileId: "user-1" });
    await next();
  }),
}));

// ── Mock the service layer ───────────────────────────────────────────
const mockSendTestNotification = vi.fn();
const mockGetDeliveryStatus = vi.fn();
const mockGetQuotaUsage = vi.fn();
const mockGetPreferences = vi.fn();
const mockUpdatePreferences = vi.fn();

vi.mock("../notifications.service.js", () => ({
  sendTestNotification: (...args: unknown[]) =>
    mockSendTestNotification(...args),
  getDeliveryStatus: (...args: unknown[]) =>
    mockGetDeliveryStatus(...args),
  getQuotaUsage: (...args: unknown[]) =>
    mockGetQuotaUsage(...args),
  getPreferences: (...args: unknown[]) =>
    mockGetPreferences(...args),
  updatePreferences: (...args: unknown[]) =>
    mockUpdatePreferences(...args),
}));

import { notificationRoutes } from "../notifications.routes.js";

const fakePreferences = {
  userId: "user-1",
  primaryChannel: "push",
  fallbackChannel: null,
  fallbackChain: null,
  quietStart: null,
  quietEnd: null,
  timezone: "UTC",
  maxRemindersPerDay: 20,
  digestMode: "off",
  advanceReminderMinutes: 15,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const fakeDeliveryAttempt = {
  id: "attempt-1",
  notificationId: "notif-1",
  channel: "push",
  provider: "fcm",
  status: "sent",
  queuedAt: new Date().toISOString(),
  sentAt: new Date().toISOString(),
  deliveredAt: null,
  readAt: null,
  failedAt: null,
  processingAt: null,
  providerMessageId: null,
  deliveryLatencyMs: null,
  attemptNumber: 1,
  maxAttempts: 3,
  nextRetryAt: null,
  errorType: null,
  errorMessage: null,
  errorCode: null,
  userAction: null,
  userActionAt: null,
  costAmount: null,
  costCurrency: "USD",
  bullmqJobId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const fakeQuotaUsage = {
  push: { used: 5, limit: 999 },
  telegram: { used: 0, limit: 999 },
  email: { used: 2, limit: 5 },
  whatsapp: { used: 0, limit: 0 },
  sms: { used: 0, limit: 0 },
  instagram: { used: 0, limit: 0 },
  slack: { used: 0, limit: 0 },
  discord: { used: 0, limit: 0 },
};

describe("Notification Routes", () => {
  const app = new Hono().route("/api/v1/notifications", notificationRoutes);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── POST /send-test ────────────────────────────────────────────────

  describe("POST /api/v1/notifications/send-test", () => {
    it("sends a test notification and returns 201", async () => {
      mockSendTestNotification.mockResolvedValueOnce(undefined);

      const res = await app.request("/api/v1/notifications/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "push" }),
      });
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.sent).toBe(true);
      expect(body.data.channel).toBe("push");
      expect(mockSendTestNotification).toHaveBeenCalledWith("user-1", "push");
    });

    it("returns 422 for invalid channel", async () => {
      const res = await app.request("/api/v1/notifications/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "fax" }),
      });

      expect(res.status).toBe(400);
    });

    it("returns 500 when service throws", async () => {
      mockSendTestNotification.mockRejectedValueOnce(
        new Error("Channel not configured"),
      );

      const res = await app.request("/api/v1/notifications/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "whatsapp" }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe("Channel not configured");
    });
  });

  // ── GET /status ────────────────────────────────────────────────────

  describe("GET /api/v1/notifications/status", () => {
    it("returns delivery status with default limit", async () => {
      mockGetDeliveryStatus.mockResolvedValueOnce([fakeDeliveryAttempt]);

      const res = await app.request("/api/v1/notifications/status");
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual([fakeDeliveryAttempt]);
      expect(mockGetDeliveryStatus).toHaveBeenCalledWith("user-1", 20);
    });

    it("accepts custom limit via query parameter", async () => {
      mockGetDeliveryStatus.mockResolvedValueOnce([]);

      const res = await app.request("/api/v1/notifications/status?limit=5");
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(mockGetDeliveryStatus).toHaveBeenCalledWith("user-1", 5);
    });
  });

  // ── GET /quota ─────────────────────────────────────────────────────

  describe("GET /api/v1/notifications/quota", () => {
    it("returns quota usage per channel", async () => {
      mockGetQuotaUsage.mockResolvedValueOnce(fakeQuotaUsage);

      const res = await app.request("/api/v1/notifications/quota");
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(fakeQuotaUsage);
      expect(mockGetQuotaUsage).toHaveBeenCalledWith("user-1");
    });
  });

  // ── GET /preferences ───────────────────────────────────────────────

  describe("GET /api/v1/notifications/preferences", () => {
    it("returns user notification preferences", async () => {
      mockGetPreferences.mockResolvedValueOnce(fakePreferences);

      const res = await app.request("/api/v1/notifications/preferences");
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.primaryChannel).toBe("push");
      expect(body.data.timezone).toBe("UTC");
      expect(mockGetPreferences).toHaveBeenCalledWith("user-1");
    });
  });

  // ── PUT /preferences ───────────────────────────────────────────────

  describe("PUT /api/v1/notifications/preferences", () => {
    it("updates and returns preferences", async () => {
      const updatedPrefs = {
        ...fakePreferences,
        primaryChannel: "telegram",
        quietStart: "22:00",
        quietEnd: "07:00",
      };
      mockUpdatePreferences.mockResolvedValueOnce(updatedPrefs);

      const res = await app.request("/api/v1/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryChannel: "telegram",
          quietStart: "22:00",
          quietEnd: "07:00",
        }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.primaryChannel).toBe("telegram");
      expect(mockUpdatePreferences).toHaveBeenCalledWith("user-1", {
        primaryChannel: "telegram",
        quietStart: "22:00",
        quietEnd: "07:00",
      });
    });

    it("returns 400 for invalid quiet hours format", async () => {
      const res = await app.request("/api/v1/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quietStart: "10pm" }),
      });

      expect(res.status).toBe(400);
    });

    it("accepts empty object (no changes)", async () => {
      mockUpdatePreferences.mockResolvedValueOnce(fakePreferences);

      const res = await app.request("/api/v1/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("returns 500 when service throws", async () => {
      mockUpdatePreferences.mockRejectedValueOnce(
        new Error("Database error"),
      );

      const res = await app.request("/api/v1/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryChannel: "email" }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe("Database error");
    });
  });
});
