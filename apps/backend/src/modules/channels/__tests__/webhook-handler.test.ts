import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";

// ── Mock dependencies ───────────────────────────────────────────────

const mockDbSelectResult: unknown[] = [];

vi.mock("../../../db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => Promise.resolve(mockDbSelectResult)),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}));

vi.mock("../../../db/schema/index.js", () => ({
  notificationChannels: {
    channelType: "channelType",
    channelIdentifier: "channelIdentifier",
    isEnabled: "isEnabled",
    userId: "userId",
  },
  deliveryAttempts: {
    providerMessageId: "providerMessageId",
  },
}));

const mockAdapterSend = vi.fn().mockResolvedValue({ success: true });
vi.mock("../../../services/channels/adapter-registry.js", () => ({
  getAdapter: vi.fn().mockReturnValue({ send: (...args: unknown[]) => mockAdapterSend(...args) }),
}));

const mockCompleteTask = vi.fn();
const mockSnoozeTask = vi.fn();
vi.mock("../../tasks/tasks.service.js", () => ({
  completeTask: (...args: unknown[]) => mockCompleteTask(...args),
  snoozeTask: (...args: unknown[]) => mockSnoozeTask(...args),
}));

const mockFindPendingNotifications = vi.fn();
const mockUpdateDeliveryAttempt = vi.fn();
vi.mock("../../notifications/notifications.repository.js", () => ({
  findPendingNotifications: (...args: unknown[]) => mockFindPendingNotifications(...args),
  updateDeliveryAttempt: (...args: unknown[]) => mockUpdateDeliveryAttempt(...args),
}));

// Mock inbound-handler — we test its integration, but also test it in isolation
const mockHandleInboundMessage = vi.fn().mockResolvedValue({
  action: "done",
  success: true,
  replyText: "Done!",
});
vi.mock("../inbound-handler.js", () => ({
  handleInboundMessage: (...args: unknown[]) => mockHandleInboundMessage(...args),
}));

// Mock webhook-verify — verify separately, here we test routing
const mockVerifyTelegram = vi.fn().mockReturnValue(true);
const mockVerifyWhatsApp = vi.fn().mockReturnValue(true);
const mockVerifySms = vi.fn().mockReturnValue(true);
vi.mock("../webhook-verify.js", () => ({
  verifyTelegramWebhook: (...args: unknown[]) => mockVerifyTelegram(...args),
  verifyWhatsAppSignature: (...args: unknown[]) => mockVerifyWhatsApp(...args),
  verifySmsWebhook: (...args: unknown[]) => mockVerifySms(...args),
}));

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

import { webhookRoutes } from "../webhook-handler.js";
import { db } from "../../../db/index.js";

// ── Setup Hono App ──────────────────────────────────────────────────

const app = new Hono();
app.route("/", webhookRoutes);

// ── Helpers ─────────────────────────────────────────────────────────

function postJson(path: string, body: unknown) {
  return app.request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function setupUserLookup(userId: string | null) {
  const selectMock = vi.mocked(db.select);
  if (userId) {
    selectMock.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ userId, channelType: "telegram", channelIdentifier: "123", isEnabled: true }]),
      }),
    } as any);
  } else {
    selectMock.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    } as any);
  }
}

// ── Tests ───────────────────────────────────────────────────────────

describe("Webhook Handler Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no user found
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    } as any);
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    } as any);
    // Default: all verification passes
    mockVerifyTelegram.mockReturnValue(true);
    mockVerifyWhatsApp.mockReturnValue(true);
    mockVerifySms.mockReturnValue(true);
  });

  // ── Telegram Webhook ─────────────────────────────────────────────

  describe("POST /telegram", () => {
    it("handles DONE callback query and completes task", async () => {
      setupUserLookup("user-1");
      mockCompleteTask.mockResolvedValue({ id: "task-1", title: "Buy groceries" });

      const res = await postJson("/telegram", {
        update_id: 1,
        callback_query: {
          id: "cb-1",
          from: { id: 12345 },
          data: "DONE:task-1",
        },
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.result.action).toBe("DONE");
      expect(body.result.success).toBe(true);
      expect(mockCompleteTask).toHaveBeenCalledWith("user-1", "task-1");
    });

    it("handles SNOOZE callback query and snoozes task", async () => {
      setupUserLookup("user-1");
      mockSnoozeTask.mockResolvedValue({ id: "task-1", title: "Meeting prep" });

      const res = await postJson("/telegram", {
        update_id: 2,
        callback_query: {
          id: "cb-2",
          from: { id: 12345 },
          data: "SNOOZE:task-1:30",
        },
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.result.action).toBe("SNOOZE");
      expect(body.result.success).toBe(true);
      expect(mockSnoozeTask).toHaveBeenCalledWith("user-1", "task-1", 30);
    });

    it("handles SNOOZE with default minutes when not specified", async () => {
      setupUserLookup("user-1");
      mockSnoozeTask.mockResolvedValue({ id: "task-1", title: "Task" });

      const res = await postJson("/telegram", {
        update_id: 3,
        callback_query: {
          id: "cb-3",
          from: { id: 12345 },
          data: "SNOOZE:task-1",
        },
      });
      const body = await res.json();

      expect(body.result.action).toBe("SNOOZE");
      expect(body.result.success).toBe(true);
      expect(mockSnoozeTask).toHaveBeenCalledWith("user-1", "task-1", 15);
    });

    it("returns unknown action for unrecognized callback data", async () => {
      setupUserLookup("user-1");

      const res = await postJson("/telegram", {
        update_id: 4,
        callback_query: {
          id: "cb-4",
          from: { id: 12345 },
          data: "UNKNOWN:task-1",
        },
      });
      const body = await res.json();

      expect(body.result.action).toBe("UNKNOWN");
      expect(body.result.success).toBe(false);
    });

    it("returns success false when callback_query has no data", async () => {
      setupUserLookup("user-1");

      const res = await postJson("/telegram", {
        update_id: 5,
        callback_query: {
          id: "cb-5",
          from: { id: 12345 },
        },
      });
      const body = await res.json();

      expect(body.result.action).toBe("unknown");
      expect(body.result.success).toBe(false);
    });

    it("returns success false when user not found for Telegram chat ID", async () => {
      const res = await postJson("/telegram", {
        update_id: 6,
        callback_query: {
          id: "cb-6",
          from: { id: 99999 },
          data: "DONE:task-1",
        },
      });
      const body = await res.json();

      expect(body.result.success).toBe(false);
      expect(mockCompleteTask).not.toHaveBeenCalled();
    });

    it("delegates plain text messages to inbound handler", async () => {
      mockHandleInboundMessage.mockResolvedValue({
        action: "done",
        success: true,
        replyText: "Done! 'Task' marked as complete.",
      });

      const res = await postJson("/telegram", {
        update_id: 7,
        message: {
          message_id: 1,
          from: { id: 12345 },
          chat: { id: 12345 },
          text: "DONE",
        },
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(mockHandleInboundMessage).toHaveBeenCalledWith(
        "telegram",
        "12345",
        "DONE",
      );
    });

    it("uses chat.id over from.id for text messages", async () => {
      await postJson("/telegram", {
        update_id: 8,
        message: {
          message_id: 2,
          from: { id: 111 },
          chat: { id: 222 },
          text: "HELP",
        },
      });

      expect(mockHandleInboundMessage).toHaveBeenCalledWith(
        "telegram",
        "222",
        "HELP",
      );
    });

    it("falls back to from.id when chat is not present", async () => {
      await postJson("/telegram", {
        update_id: 9,
        message: {
          message_id: 3,
          from: { id: 333 },
          text: "STOP",
        },
      });

      expect(mockHandleInboundMessage).toHaveBeenCalledWith(
        "telegram",
        "333",
        "STOP",
      );
    });

    it("acknowledges non-callback, non-text updates with ok: true", async () => {
      const res = await postJson("/telegram", {
        update_id: 10,
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(mockHandleInboundMessage).not.toHaveBeenCalled();
    });

    it("returns ok when verification fails (no retries)", async () => {
      mockVerifyTelegram.mockReturnValue(false);

      const res = await postJson("/telegram", {
        update_id: 11,
        message: { message_id: 1, from: { id: 123 }, text: "DONE" },
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(mockHandleInboundMessage).not.toHaveBeenCalled();
    });
  });

  // ── WhatsApp Webhook ─────────────────────────────────────────────

  describe("POST /whatsapp", () => {
    it("handles DELIVERED delivery receipt", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{
            id: "attempt-1",
            providerMessageId: "gs-msg-1",
            sentAt: new Date(),
          }]),
        }),
      } as any);
      mockUpdateDeliveryAttempt.mockResolvedValue(undefined);

      const res = await postJson("/whatsapp", {
        type: "message-event",
        payload: { gsId: "gs-msg-1", eventType: "DELIVERED" },
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(mockUpdateDeliveryAttempt).toHaveBeenCalledWith(
        "attempt-1",
        expect.objectContaining({ status: "delivered" }),
      );
    });

    it("handles FAILED delivery receipt", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{
            id: "attempt-2",
            providerMessageId: "gs-msg-2",
            sentAt: new Date(),
          }]),
        }),
      } as any);
      mockUpdateDeliveryAttempt.mockResolvedValue(undefined);

      const res = await postJson("/whatsapp", {
        type: "message-event",
        payload: { gsId: "gs-msg-2", eventType: "FAILED" },
      });

      expect(mockUpdateDeliveryAttempt).toHaveBeenCalledWith(
        "attempt-2",
        expect.objectContaining({ status: "failed" }),
      );
    });

    it("delegates user reply to inbound handler", async () => {
      const res = await postJson("/whatsapp", {
        type: "message",
        payload: { sender: "+919876543210", text: "DONE" },
      });

      expect(res.status).toBe(200);
      expect(mockHandleInboundMessage).toHaveBeenCalledWith(
        "whatsapp",
        "+919876543210",
        "DONE",
      );
    });

    it("delegates SNOOZE with duration to inbound handler", async () => {
      await postJson("/whatsapp", {
        type: "message",
        payload: { sender: "+919876543210", text: "SNOOZE 1h" },
      });

      expect(mockHandleInboundMessage).toHaveBeenCalledWith(
        "whatsapp",
        "+919876543210",
        "SNOOZE 1h",
      );
    });

    it("delegates STOP to inbound handler", async () => {
      await postJson("/whatsapp", {
        type: "message",
        payload: { sender: "+919876543210", text: "STOP" },
      });

      expect(mockHandleInboundMessage).toHaveBeenCalledWith(
        "whatsapp",
        "+919876543210",
        "STOP",
      );
    });

    it("delegates HELP to inbound handler", async () => {
      await postJson("/whatsapp", {
        type: "message",
        payload: { sender: "+919876543210", text: "HELP" },
      });

      expect(mockHandleInboundMessage).toHaveBeenCalledWith(
        "whatsapp",
        "+919876543210",
        "HELP",
      );
    });

    it("skips empty sender in user reply", async () => {
      await postJson("/whatsapp", {
        type: "message",
        payload: { sender: "", text: "DONE" },
      });

      expect(mockHandleInboundMessage).not.toHaveBeenCalled();
    });

    it("skips empty text in user reply", async () => {
      await postJson("/whatsapp", {
        type: "message",
        payload: { sender: "+919876543210", text: "" },
      });

      expect(mockHandleInboundMessage).not.toHaveBeenCalled();
    });

    it("returns ok when body has no type", async () => {
      const res = await postJson("/whatsapp", { payload: {} });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
    });

    it("returns ok when verification fails", async () => {
      mockVerifyWhatsApp.mockReturnValue(false);

      const res = await postJson("/whatsapp", {
        type: "message",
        payload: { sender: "+919876543210", text: "DONE" },
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(mockHandleInboundMessage).not.toHaveBeenCalled();
    });
  });

  // ── SMS Webhook ──────────────────────────────────────────────────

  describe("POST /sms", () => {
    it("handles DELIVRD delivery receipt", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{
            id: "attempt-3",
            providerMessageId: "msg91-id-1",
            sentAt: new Date(),
          }]),
        }),
      } as any);
      mockUpdateDeliveryAttempt.mockResolvedValue(undefined);

      const res = await postJson("/sms", {
        type: "dlr",
        requestId: "msg91-id-1",
        status: "DELIVRD",
      });

      expect(res.status).toBe(200);
      expect(mockUpdateDeliveryAttempt).toHaveBeenCalledWith(
        "attempt-3",
        expect.objectContaining({ status: "delivered" }),
      );
    });

    it("handles FAILED delivery receipt", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{
            id: "attempt-4",
            providerMessageId: "msg91-id-2",
            sentAt: null,
          }]),
        }),
      } as any);
      mockUpdateDeliveryAttempt.mockResolvedValue(undefined);

      const res = await postJson("/sms", {
        type: "dlr",
        requestId: "msg91-id-2",
        status: "FAILED",
      });

      expect(mockUpdateDeliveryAttempt).toHaveBeenCalledWith(
        "attempt-4",
        expect.objectContaining({ status: "failed" }),
      );
    });

    it("delegates user reply DONE to inbound handler", async () => {
      const res = await postJson("/sms", {
        type: "mo",
        sender: "+919876543210",
        message: "DONE",
      });

      expect(res.status).toBe(200);
      expect(mockHandleInboundMessage).toHaveBeenCalledWith(
        "sms",
        "+919876543210",
        "DONE",
      );
    });

    it("delegates user reply SNOOZE to inbound handler", async () => {
      await postJson("/sms", {
        type: "mo",
        sender: "+919876543210",
        message: "SNOOZE 30m",
      });

      expect(mockHandleInboundMessage).toHaveBeenCalledWith(
        "sms",
        "+919876543210",
        "SNOOZE 30m",
      );
    });

    it("delegates user reply STOP to inbound handler", async () => {
      await postJson("/sms", {
        type: "mo",
        sender: "+919876543210",
        message: "STOP",
      });

      expect(mockHandleInboundMessage).toHaveBeenCalledWith(
        "sms",
        "+919876543210",
        "STOP",
      );
    });

    it("delegates user reply HELP to inbound handler", async () => {
      await postJson("/sms", {
        type: "mo",
        sender: "+919876543210",
        message: "HELP",
      });

      expect(mockHandleInboundMessage).toHaveBeenCalledWith(
        "sms",
        "+919876543210",
        "HELP",
      );
    });

    it("skips empty sender in user reply", async () => {
      await postJson("/sms", {
        type: "mo",
        sender: "",
        message: "DONE",
      });

      expect(mockHandleInboundMessage).not.toHaveBeenCalled();
    });

    it("skips empty message in user reply", async () => {
      await postJson("/sms", {
        type: "mo",
        sender: "+919876543210",
        message: "",
      });

      expect(mockHandleInboundMessage).not.toHaveBeenCalled();
    });

    it("returns ok when verification fails", async () => {
      mockVerifySms.mockReturnValue(false);

      const res = await postJson("/sms", {
        type: "mo",
        sender: "+919876543210",
        message: "DONE",
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(mockHandleInboundMessage).not.toHaveBeenCalled();
    });
  });

  // ── Edge Cases ───────────────────────────────────────────────────

  describe("Edge cases", () => {
    it("WhatsApp: empty body returns ok", async () => {
      const res = await postJson("/whatsapp", {});
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
    });

    it("SMS: handles missing sender in user reply gracefully", async () => {
      const res = await postJson("/sms", {
        type: "mo",
        sender: "",
        message: "DONE",
      });

      expect(res.status).toBe(200);
      expect(mockHandleInboundMessage).not.toHaveBeenCalled();
    });

    it("SMS: handles missing message in user reply gracefully", async () => {
      const res = await postJson("/sms", {
        type: "mo",
        sender: "+919876543210",
        message: "",
      });

      expect(res.status).toBe(200);
      expect(mockHandleInboundMessage).not.toHaveBeenCalled();
    });

    it("WhatsApp: no user found for sender phone returns ok without action", async () => {
      mockHandleInboundMessage.mockResolvedValue({
        action: "unlinked",
        success: false,
        replyText: null,
      });

      const res = await postJson("/whatsapp", {
        type: "message",
        payload: { sender: "+910000000000", text: "DONE" },
      });

      expect(res.status).toBe(200);
      expect(mockHandleInboundMessage).toHaveBeenCalledWith(
        "whatsapp",
        "+910000000000",
        "DONE",
      );
    });
  });
});
