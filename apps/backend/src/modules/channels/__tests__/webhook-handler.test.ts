import { describe, it, expect, vi, beforeEach } from "vitest";
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

vi.mock("../../../services/templates/template-engine.js", () => ({
  renderTemplate: vi.fn().mockReturnValue({ text: "rendered text" }),
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
  // resolveUserByChannel returns the channel row or empty
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
      // Default mock returns empty array (no user)
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

    it("acknowledges non-callback_query updates with ok: true", async () => {
      const res = await postJson("/telegram", {
        update_id: 7,
        message: { message_id: 1, from: { id: 123 }, text: "hello" },
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
    });
  });

  // ── WhatsApp Webhook ─────────────────────────────────────────────

  describe("POST /whatsapp", () => {
    it("handles DELIVERED delivery receipt", async () => {
      // updateDeliveryByProviderId needs to find an attempt
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

    it("handles user reply DONE", async () => {
      // First call: resolveUserByChannel
      // Second call: findMostRecentNotifiedTask
      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ userId: "user-1" }]),
            }),
          } as any;
        }
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        } as any;
      });

      mockFindPendingNotifications.mockResolvedValue([{ taskId: "task-1" }]);
      mockCompleteTask.mockResolvedValue({ id: "task-1", title: "Buy milk" });

      const res = await postJson("/whatsapp", {
        type: "message",
        payload: { sender: "+919876543210", text: "DONE" },
      });

      expect(res.status).toBe(200);
      expect(mockCompleteTask).toHaveBeenCalledWith("user-1", "task-1");
    });

    it("handles user reply SNOOZE", async () => {
      setupUserLookup("user-1");
      mockFindPendingNotifications.mockResolvedValue([{ taskId: "task-1" }]);
      mockSnoozeTask.mockResolvedValue({ id: "task-1", title: "Call Bob" });

      const res = await postJson("/whatsapp", {
        type: "message",
        payload: { sender: "+919876543210", text: "SNOOZE 30" },
      });

      expect(res.status).toBe(200);
      expect(mockSnoozeTask).toHaveBeenCalledWith("user-1", "task-1", 30);
    });

    it("handles user reply STOP and disables channel", async () => {
      setupUserLookup("user-1");

      const res = await postJson("/whatsapp", {
        type: "message",
        payload: { sender: "+919876543210", text: "STOP" },
      });

      expect(res.status).toBe(200);
      expect(vi.mocked(db.update)).toHaveBeenCalled();
    });

    it("handles user reply HELP and sends help text", async () => {
      setupUserLookup("user-1");

      const res = await postJson("/whatsapp", {
        type: "message",
        payload: { sender: "+919876543210", text: "HELP" },
      });

      expect(res.status).toBe(200);
      // Adapter send should be called with help text
      expect(mockAdapterSend).toHaveBeenCalled();
    });

    it("handles unknown command from user", async () => {
      setupUserLookup("user-1");

      const res = await postJson("/whatsapp", {
        type: "message",
        payload: { sender: "+919876543210", text: "GIBBERISH" },
      });

      expect(res.status).toBe(200);
      // Should still respond with unknown command message
      expect(mockAdapterSend).toHaveBeenCalled();
    });

    it("returns ok when body has no type", async () => {
      const res = await postJson("/whatsapp", { payload: {} });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
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

    it("handles user reply DONE via SMS", async () => {
      setupUserLookup("user-1");
      mockFindPendingNotifications.mockResolvedValue([{ taskId: "task-5" }]);
      mockCompleteTask.mockResolvedValue({ id: "task-5", title: "Send report" });

      const res = await postJson("/sms", {
        type: "mo",
        sender: "+919876543210",
        message: "DONE",
      });

      expect(res.status).toBe(200);
      expect(mockCompleteTask).toHaveBeenCalledWith("user-1", "task-5");
    });

    it("handles user reply SNOOZE via SMS", async () => {
      setupUserLookup("user-1");
      mockFindPendingNotifications.mockResolvedValue([{ taskId: "task-6" }]);
      mockSnoozeTask.mockResolvedValue({ id: "task-6", title: "Review PR" });

      const res = await postJson("/sms", {
        type: "mo",
        sender: "+919876543210",
        message: "SNOOZE",
      });

      expect(res.status).toBe(200);
      expect(mockSnoozeTask).toHaveBeenCalledWith("user-1", "task-6", 15);
    });

    it("handles user reply STOP via SMS", async () => {
      setupUserLookup("user-1");

      const res = await postJson("/sms", {
        type: "mo",
        sender: "+919876543210",
        message: "STOP",
      });

      expect(res.status).toBe(200);
      expect(vi.mocked(db.update)).toHaveBeenCalled();
    });

    it("handles user reply HELP via SMS", async () => {
      setupUserLookup("user-1");

      const res = await postJson("/sms", {
        type: "mo",
        sender: "+919876543210",
        message: "HELP",
      });

      expect(res.status).toBe(200);
      expect(mockAdapterSend).toHaveBeenCalled();
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
      expect(mockCompleteTask).not.toHaveBeenCalled();
    });

    it("SMS: handles missing message in user reply gracefully", async () => {
      const res = await postJson("/sms", {
        type: "mo",
        sender: "+919876543210",
        message: "",
      });

      expect(res.status).toBe(200);
      expect(mockCompleteTask).not.toHaveBeenCalled();
    });

    it("WhatsApp: no user found for sender phone returns ok without action", async () => {
      // Default mock returns empty (no user)
      const res = await postJson("/whatsapp", {
        type: "message",
        payload: { sender: "+910000000000", text: "DONE" },
      });

      expect(res.status).toBe(200);
      expect(mockCompleteTask).not.toHaveBeenCalled();
    });
  });
});
