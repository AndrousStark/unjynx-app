import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock dependencies ───────────────────────────────────────────────

vi.mock("../../../db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
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
}));

const mockAdapterSend = vi.fn().mockResolvedValue({ success: true });
vi.mock("../../../services/channels/adapter-registry.js", () => ({
  getAdapter: vi.fn().mockReturnValue({
    send: (...args: unknown[]) => mockAdapterSend(...args),
  }),
}));

const mockCompleteTask = vi.fn();
const mockSnoozeTask = vi.fn();
vi.mock("../../tasks/tasks.service.js", () => ({
  completeTask: (...args: unknown[]) => mockCompleteTask(...args),
  snoozeTask: (...args: unknown[]) => mockSnoozeTask(...args),
}));

const mockFindPendingNotifications = vi.fn();
vi.mock("../../notifications/notifications.repository.js", () => ({
  findPendingNotifications: (...args: unknown[]) =>
    mockFindPendingNotifications(...args),
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

import { handleInboundMessage } from "../inbound-handler.js";
import { db } from "../../../db/index.js";

// ── Helpers ─────────────────────────────────────────────────────────

function setupUserLookup(userId: string | null) {
  const selectMock = vi.mocked(db.select);
  if (userId) {
    selectMock.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          {
            userId,
            channelType: "whatsapp",
            channelIdentifier: "+919876543210",
            isEnabled: true,
          },
        ]),
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

describe("handleInboundMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  // ── User Resolution ─────────────────────────────────────────────

  describe("user resolution", () => {
    it("returns unlinked when no user found", async () => {
      const result = await handleInboundMessage(
        "whatsapp",
        "+910000000000",
        "DONE",
      );
      expect(result.action).toBe("unlinked");
      expect(result.success).toBe(false);
      // Should send a reply telling the user to connect
      expect(mockAdapterSend).toHaveBeenCalledWith(
        "+910000000000",
        expect.objectContaining({
          text: expect.stringContaining("not linked"),
        }),
      );
    });
  });

  // ── DONE Command ────────────────────────────────────────────────

  describe("DONE command", () => {
    it("completes the most recent notified task", async () => {
      setupUserLookup("user-1");
      mockFindPendingNotifications.mockResolvedValue([
        { taskId: "task-1" },
      ]);
      mockCompleteTask.mockResolvedValue({
        id: "task-1",
        title: "Buy groceries",
      });

      const result = await handleInboundMessage(
        "whatsapp",
        "+919876543210",
        "DONE",
      );

      expect(result.action).toBe("done");
      expect(result.success).toBe(true);
      expect(mockCompleteTask).toHaveBeenCalledWith("user-1", "task-1");
      expect(mockAdapterSend).toHaveBeenCalledWith(
        "+919876543210",
        expect.objectContaining({
          text: expect.stringContaining("Buy groceries"),
        }),
      );
    });

    it("handles 'Complete' alias", async () => {
      setupUserLookup("user-1");
      mockFindPendingNotifications.mockResolvedValue([
        { taskId: "task-1" },
      ]);
      mockCompleteTask.mockResolvedValue({
        id: "task-1",
        title: "Task",
      });

      const result = await handleInboundMessage(
        "telegram",
        "12345",
        "Complete",
      );
      expect(result.action).toBe("done");
      expect(result.success).toBe(true);
    });

    it("handles 'finished' alias", async () => {
      setupUserLookup("user-1");
      mockFindPendingNotifications.mockResolvedValue([
        { taskId: "task-1" },
      ]);
      mockCompleteTask.mockResolvedValue({
        id: "task-1",
        title: "Task",
      });

      const result = await handleInboundMessage(
        "sms",
        "+919876543210",
        "finished",
      );
      expect(result.action).toBe("done");
      expect(result.success).toBe(true);
    });

    it("returns failure when no recent task found", async () => {
      setupUserLookup("user-1");
      mockFindPendingNotifications.mockResolvedValue([]);

      const result = await handleInboundMessage(
        "whatsapp",
        "+919876543210",
        "DONE",
      );

      expect(result.action).toBe("done");
      expect(result.success).toBe(false);
    });
  });

  // ── SNOOZE Command ──────────────────────────────────────────────

  describe("SNOOZE command", () => {
    it("snoozes with default 15 minutes", async () => {
      setupUserLookup("user-1");
      mockFindPendingNotifications.mockResolvedValue([
        { taskId: "task-1" },
      ]);
      mockSnoozeTask.mockResolvedValue({
        id: "task-1",
        title: "Meeting prep",
      });

      const result = await handleInboundMessage(
        "whatsapp",
        "+919876543210",
        "SNOOZE",
      );

      expect(result.action).toBe("snooze");
      expect(result.success).toBe(true);
      expect(mockSnoozeTask).toHaveBeenCalledWith("user-1", "task-1", 15);
    });

    it("snoozes with specified minutes (30)", async () => {
      setupUserLookup("user-1");
      mockFindPendingNotifications.mockResolvedValue([
        { taskId: "task-1" },
      ]);
      mockSnoozeTask.mockResolvedValue({
        id: "task-1",
        title: "Task",
      });

      const result = await handleInboundMessage(
        "sms",
        "+919876543210",
        "SNOOZE 30",
      );

      expect(result.success).toBe(true);
      expect(mockSnoozeTask).toHaveBeenCalledWith("user-1", "task-1", 30);
    });

    it("snoozes with human-friendly duration (1h)", async () => {
      setupUserLookup("user-1");
      mockFindPendingNotifications.mockResolvedValue([
        { taskId: "task-1" },
      ]);
      mockSnoozeTask.mockResolvedValue({
        id: "task-1",
        title: "Task",
      });

      const result = await handleInboundMessage(
        "telegram",
        "12345",
        "snooze 1h",
      );

      expect(result.success).toBe(true);
      expect(mockSnoozeTask).toHaveBeenCalledWith("user-1", "task-1", 60);
    });

    it("snoozes with 30m format", async () => {
      setupUserLookup("user-1");
      mockFindPendingNotifications.mockResolvedValue([
        { taskId: "task-1" },
      ]);
      mockSnoozeTask.mockResolvedValue({
        id: "task-1",
        title: "Task",
      });

      const result = await handleInboundMessage(
        "whatsapp",
        "+919876543210",
        "SNOOZE 30m",
      );

      expect(result.success).toBe(true);
      expect(mockSnoozeTask).toHaveBeenCalledWith("user-1", "task-1", 30);
    });

    it("falls back to 15 min for invalid duration", async () => {
      setupUserLookup("user-1");
      mockFindPendingNotifications.mockResolvedValue([
        { taskId: "task-1" },
      ]);
      mockSnoozeTask.mockResolvedValue({
        id: "task-1",
        title: "Task",
      });

      const result = await handleInboundMessage(
        "whatsapp",
        "+919876543210",
        "SNOOZE blah",
      );

      expect(result.success).toBe(true);
      expect(mockSnoozeTask).toHaveBeenCalledWith("user-1", "task-1", 15);
    });

    it("returns failure when no recent task found", async () => {
      setupUserLookup("user-1");
      mockFindPendingNotifications.mockResolvedValue([]);

      const result = await handleInboundMessage(
        "whatsapp",
        "+919876543210",
        "SNOOZE",
      );

      expect(result.action).toBe("snooze");
      expect(result.success).toBe(false);
    });
  });

  // ── STOP Command ────────────────────────────────────────────────

  describe("STOP command", () => {
    it("disables channel and returns confirmation", async () => {
      setupUserLookup("user-1");

      const result = await handleInboundMessage(
        "whatsapp",
        "+919876543210",
        "STOP",
      );

      expect(result.action).toBe("stop");
      expect(result.success).toBe(true);
      expect(vi.mocked(db.update)).toHaveBeenCalled();
    });

    it("handles 'unsubscribe' alias", async () => {
      setupUserLookup("user-1");

      const result = await handleInboundMessage(
        "sms",
        "+919876543210",
        "unsubscribe",
      );

      expect(result.action).toBe("stop");
      expect(result.success).toBe(true);
    });

    it("handles 'opt-out' alias", async () => {
      setupUserLookup("user-1");

      const result = await handleInboundMessage(
        "telegram",
        "12345",
        "opt-out",
      );

      expect(result.action).toBe("stop");
      expect(result.success).toBe(true);
    });
  });

  // ── HELP Command ────────────────────────────────────────────────

  describe("HELP command", () => {
    it("returns help text", async () => {
      setupUserLookup("user-1");

      const result = await handleInboundMessage(
        "whatsapp",
        "+919876543210",
        "HELP",
      );

      expect(result.action).toBe("help");
      expect(result.success).toBe(true);
      expect(mockAdapterSend).toHaveBeenCalledWith(
        "+919876543210",
        expect.objectContaining({
          text: expect.stringContaining("UNJYNX Commands"),
        }),
      );
    });

    it("handles '?' alias", async () => {
      setupUserLookup("user-1");

      const result = await handleInboundMessage(
        "sms",
        "+919876543210",
        "?",
      );

      expect(result.action).toBe("help");
      expect(result.success).toBe(true);
    });
  });

  // ── Unknown Command ─────────────────────────────────────────────

  describe("unknown command", () => {
    it("returns unknown with guidance", async () => {
      setupUserLookup("user-1");

      const result = await handleInboundMessage(
        "whatsapp",
        "+919876543210",
        "gibberish",
      );

      expect(result.action).toBe("unknown");
      expect(result.success).toBe(false);
      expect(mockAdapterSend).toHaveBeenCalledWith(
        "+919876543210",
        expect.objectContaining({
          text: expect.stringContaining("HELP"),
        }),
      );
    });
  });
});
