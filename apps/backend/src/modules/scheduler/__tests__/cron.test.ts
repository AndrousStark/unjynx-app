import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mock external dependencies ──────────────────────────────────────

const mockDbSelect = vi.fn();
const mockDbFrom = vi.fn();
const mockDbLeftJoin = vi.fn();
const mockDbInnerJoin = vi.fn();
const mockDbWhere = vi.fn();

function createChainableQuery(result: unknown[] = []) {
  const chain = {
    from: vi.fn().mockReturnValue({
      leftJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(result),
      }),
      innerJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(result),
      }),
      where: vi.fn().mockResolvedValue(result),
    }),
  };
  return chain;
}

let selectReturnValue: ReturnType<typeof createChainableQuery>;

vi.mock("../../../db/index.js", () => ({
  db: {
    select: vi.fn(() => selectReturnValue),
  },
}));

vi.mock("../../../db/schema/index.js", () => ({
  tasks: { id: "id", userId: "userId", dueDate: "dueDate", status: "status" },
  notificationPreferences: { userId: "userId", digestMode: "digestMode" },
  notificationChannels: {
    userId: "userId",
    channelType: "channelType",
    channelIdentifier: "channelIdentifier",
    isEnabled: "isEnabled",
    isVerified: "isVerified",
    updatedAt: "updatedAt",
  },
  profiles: { id: "id", name: "name" },
}));

const mockPlanReminders = vi.fn();
const mockPlanOverdueAlerts = vi.fn();
const mockPlanDigest = vi.fn();

vi.mock("../scheduler.service.js", () => ({
  planReminders: (...args: unknown[]) => mockPlanReminders(...args),
  planOverdueAlerts: (...args: unknown[]) => mockPlanOverdueAlerts(...args),
  planDigest: (...args: unknown[]) => mockPlanDigest(...args),
}));

const mockDispatchBatch = vi.fn();

vi.mock("../notification-dispatcher.js", () => ({
  dispatchBatch: (...args: unknown[]) => mockDispatchBatch(...args),
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

import {
  checkReminders,
  checkOverdue,
  sendDailyDigest,
  checkInstagramWindows,
  startCronJobs,
  stopCronJobs,
  isCronRunning,
} from "../cron.js";

import { db } from "../../../db/index.js";

// ── Helpers ──────────────────────────────────────────────────────────

function makeFakeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: "task-1",
    userId: "user-1",
    title: "Test Task",
    dueDate: new Date(),
    priority: "medium",
    status: "pending",
    completedAt: null,
    ...overrides,
  };
}

function makeFakePrefs(overrides: Record<string, unknown> = {}) {
  return {
    userId: "user-1",
    primaryChannel: "push",
    fallbackChain: null,
    quietStart: null,
    quietEnd: null,
    timezone: "UTC",
    maxRemindersPerDay: 20,
    digestMode: "daily",
    advanceReminderMinutes: 15,
    ...overrides,
  };
}

function makeFakeProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    name: "Test User",
    ...overrides,
  };
}

function makeFakeJob(overrides: Record<string, unknown> = {}) {
  return {
    userId: "user-1",
    taskId: "task-1",
    notificationId: "notif-1",
    channel: "push",
    messageType: "task_reminder",
    templateVars: { task_title: "Test Task", _recipient: "" },
    priority: 5,
    attemptNumber: 1,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe("Cron Scheduler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: DB returns empty results
    selectReturnValue = createChainableQuery([]);
  });

  afterEach(() => {
    // Ensure cron is stopped after each test
    stopCronJobs();
  });

  // ── checkReminders ───────────────────────────────────────────────

  describe("checkReminders", () => {
    it("returns 0 when no tasks are due", async () => {
      selectReturnValue = createChainableQuery([]);

      const result = await checkReminders();

      expect(result).toBe(0);
    });

    it("dispatches reminders for a single due task", async () => {
      const task = makeFakeTask();
      const prefs = makeFakePrefs();
      const jobs = [makeFakeJob()];

      // First call: find due tasks
      const dueTasks = [{ task, prefs }];
      const dueChain = createChainableQuery(dueTasks);
      // Second call: enrichJobsWithRecipients - find channels
      const channelChain = createChainableQuery([
        { channelType: "push", channelIdentifier: "fcm-token-1" },
      ]);

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount += 1;
        return callCount === 1
          ? (dueChain as any)
          : (channelChain as any);
      });

      mockPlanReminders.mockReturnValue(jobs);
      mockDispatchBatch.mockResolvedValue({ dispatched: 1, suppressed: 0, failed: 0 });

      const result = await checkReminders();

      expect(result).toBe(1);
      expect(mockPlanReminders).toHaveBeenCalledTimes(1);
      expect(mockDispatchBatch).toHaveBeenCalledTimes(1);
    });

    it("dispatches reminders for multiple due tasks", async () => {
      const task1 = makeFakeTask({ id: "task-1", userId: "user-1" });
      const task2 = makeFakeTask({ id: "task-2", userId: "user-2" });
      const prefs = makeFakePrefs();
      const jobs1 = [makeFakeJob({ taskId: "task-1" })];
      const jobs2 = [makeFakeJob({ taskId: "task-2", userId: "user-2" })];

      const dueTasks = [
        { task: task1, prefs },
        { task: task2, prefs: { ...prefs, userId: "user-2" } },
      ];

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return createChainableQuery(dueTasks) as any;
        return createChainableQuery([
          { channelType: "push", channelIdentifier: "token" },
        ]) as any;
      });

      mockPlanReminders
        .mockReturnValueOnce(jobs1)
        .mockReturnValueOnce(jobs2);
      mockDispatchBatch.mockResolvedValue({ dispatched: 1, suppressed: 0, failed: 0 });

      const result = await checkReminders();

      expect(result).toBe(2);
      expect(mockPlanReminders).toHaveBeenCalledTimes(2);
      expect(mockDispatchBatch).toHaveBeenCalledTimes(2);
    });

    it("skips tasks where planReminders returns null", async () => {
      const task = makeFakeTask();
      const prefs = makeFakePrefs();

      vi.mocked(db.select).mockImplementation(
        () => createChainableQuery([{ task, prefs }]) as any,
      );

      mockPlanReminders.mockReturnValue(null);

      const result = await checkReminders();

      expect(result).toBe(0);
      expect(mockDispatchBatch).not.toHaveBeenCalled();
    });

    it("skips tasks where planReminders returns empty array", async () => {
      const task = makeFakeTask();
      const prefs = makeFakePrefs();

      vi.mocked(db.select).mockImplementation(
        () => createChainableQuery([{ task, prefs }]) as any,
      );

      mockPlanReminders.mockReturnValue([]);

      const result = await checkReminders();

      expect(result).toBe(0);
      expect(mockDispatchBatch).not.toHaveBeenCalled();
    });

    it("handles DB error gracefully and returns 0", async () => {
      vi.mocked(db.select).mockImplementation(() => {
        throw new Error("Connection refused");
      });

      const result = await checkReminders();

      expect(result).toBe(0);
    });
  });

  // ── checkOverdue ─────────────────────────────────────────────────

  describe("checkOverdue", () => {
    it("returns 0 when no tasks are overdue", async () => {
      selectReturnValue = createChainableQuery([]);

      const result = await checkOverdue();

      expect(result).toBe(0);
    });

    it("dispatches alerts for a single overdue task", async () => {
      const task = makeFakeTask({ dueDate: new Date(Date.now() - 60_000) });
      const prefs = makeFakePrefs();
      const jobs = [makeFakeJob({ messageType: "overdue_alert" })];

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return createChainableQuery([{ task, prefs }]) as any;
        return createChainableQuery([
          { channelType: "push", channelIdentifier: "token" },
        ]) as any;
      });

      mockPlanOverdueAlerts.mockReturnValue(jobs);
      mockDispatchBatch.mockResolvedValue({ dispatched: 1, suppressed: 0, failed: 0 });

      const result = await checkOverdue();

      expect(result).toBe(1);
      expect(mockPlanOverdueAlerts).toHaveBeenCalledTimes(1);
    });

    it("groups multiple overdue tasks by user for batch processing", async () => {
      const task1 = makeFakeTask({ id: "task-1", userId: "user-1" });
      const task2 = makeFakeTask({ id: "task-2", userId: "user-1" });
      const prefs = makeFakePrefs();

      const overdueTasks = [
        { task: task1, prefs },
        { task: task2, prefs },
      ];

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return createChainableQuery(overdueTasks) as any;
        return createChainableQuery([
          { channelType: "push", channelIdentifier: "token" },
        ]) as any;
      });

      mockPlanOverdueAlerts.mockReturnValue([makeFakeJob()]);
      mockDispatchBatch.mockResolvedValue({ dispatched: 1, suppressed: 0, failed: 0 });

      const result = await checkOverdue();

      // Same user, so planOverdueAlerts called once with 2 tasks
      expect(mockPlanOverdueAlerts).toHaveBeenCalledTimes(1);
      const calledTasks = mockPlanOverdueAlerts.mock.calls[0][0];
      expect(calledTasks).toHaveLength(2);
    });

    it("dispatches separately for different users", async () => {
      const task1 = makeFakeTask({ id: "task-1", userId: "user-1" });
      const task2 = makeFakeTask({ id: "task-2", userId: "user-2" });
      const prefs = makeFakePrefs();

      const overdueTasks = [
        { task: task1, prefs },
        { task: task2, prefs: { ...prefs, userId: "user-2" } },
      ];

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return createChainableQuery(overdueTasks) as any;
        return createChainableQuery([
          { channelType: "push", channelIdentifier: "token" },
        ]) as any;
      });

      mockPlanOverdueAlerts.mockReturnValue([makeFakeJob()]);
      mockDispatchBatch.mockResolvedValue({ dispatched: 1, suppressed: 0, failed: 0 });

      const result = await checkOverdue();

      expect(mockPlanOverdueAlerts).toHaveBeenCalledTimes(2);
      expect(mockDispatchBatch).toHaveBeenCalledTimes(2);
    });

    it("handles DB error gracefully and returns 0", async () => {
      vi.mocked(db.select).mockImplementation(() => {
        throw new Error("Connection lost");
      });

      const result = await checkOverdue();

      expect(result).toBe(0);
    });
  });

  // ── sendDailyDigest ──────────────────────────────────────────────

  describe("sendDailyDigest", () => {
    it("returns 0 when no users have digest enabled", async () => {
      selectReturnValue = createChainableQuery([]);

      const result = await sendDailyDigest();

      expect(result).toBe(0);
    });

    it("dispatches digest for a user with digest enabled", async () => {
      const prefs = makeFakePrefs({ digestMode: "daily" });
      const profile = makeFakeProfile();
      const userTasks = [makeFakeTask()];
      const digestJob = makeFakeJob({ messageType: "daily_digest" });

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) {
          // First: find users with digest enabled
          return createChainableQuery([{ prefs, profile }]) as any;
        }
        if (callCount === 2) {
          // Second: fetch user tasks
          return createChainableQuery(userTasks) as any;
        }
        // Third+: enrichJobsWithRecipients
        return createChainableQuery([
          { channelType: "push", channelIdentifier: "token" },
        ]) as any;
      });

      mockPlanDigest.mockReturnValue(digestJob);
      mockDispatchBatch.mockResolvedValue({ dispatched: 1, suppressed: 0, failed: 0 });

      const result = await sendDailyDigest();

      expect(result).toBe(1);
      expect(mockPlanDigest).toHaveBeenCalledTimes(1);
    });

    it("skips user when planDigest returns null", async () => {
      const prefs = makeFakePrefs({ digestMode: "daily" });
      const profile = makeFakeProfile();

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return createChainableQuery([{ prefs, profile }]) as any;
        return createChainableQuery([]) as any;
      });

      mockPlanDigest.mockReturnValue(null);

      const result = await sendDailyDigest();

      expect(result).toBe(0);
      expect(mockDispatchBatch).not.toHaveBeenCalled();
    });

    it("handles DB error gracefully and returns 0", async () => {
      vi.mocked(db.select).mockImplementation(() => {
        throw new Error("DB timeout");
      });

      const result = await sendDailyDigest();

      expect(result).toBe(0);
    });
  });

  // ── checkInstagramWindows ────────────────────────────────────────

  describe("checkInstagramWindows", () => {
    it("returns 0 when no Instagram channels are expiring", async () => {
      selectReturnValue = createChainableQuery([]);

      const result = await checkInstagramWindows();

      expect(result).toBe(0);
    });

    it("dispatches push notification for expiring Instagram channel", async () => {
      const expiringChannel = {
        id: "ch-1",
        userId: "user-1",
        channelType: "instagram",
        channelIdentifier: "ig_user",
        isEnabled: true,
        isVerified: true,
        updatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      };

      let callCount = 0;
      vi.mocked(db.select).mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) {
          return createChainableQuery([expiringChannel]) as any;
        }
        return createChainableQuery([
          { channelType: "push", channelIdentifier: "fcm-token" },
        ]) as any;
      });

      mockDispatchBatch.mockResolvedValue({ dispatched: 1, suppressed: 0, failed: 0 });

      const result = await checkInstagramWindows();

      expect(result).toBe(1);
      expect(mockDispatchBatch).toHaveBeenCalledTimes(1);
    });

    it("handles DB error gracefully and returns 0", async () => {
      vi.mocked(db.select).mockImplementation(() => {
        throw new Error("DB error");
      });

      const result = await checkInstagramWindows();

      expect(result).toBe(0);
    });
  });

  // ── Lifecycle: startCronJobs / stopCronJobs / isCronRunning ──────

  describe("Lifecycle", () => {
    it("isCronRunning returns false initially", () => {
      expect(isCronRunning()).toBe(false);
    });

    it("startCronJobs sets running state to true", () => {
      startCronJobs();
      expect(isCronRunning()).toBe(true);
    });

    it("stopCronJobs sets running state to false", () => {
      startCronJobs();
      expect(isCronRunning()).toBe(true);

      stopCronJobs();
      expect(isCronRunning()).toBe(false);
    });

    it("prevents double-start (calling startCronJobs twice)", () => {
      startCronJobs();
      // Second call should be a no-op (warns but doesn't error)
      startCronJobs();
      expect(isCronRunning()).toBe(true);
    });

    it("stopCronJobs is safe to call when not running", () => {
      // Should not throw
      expect(() => stopCronJobs()).not.toThrow();
      expect(isCronRunning()).toBe(false);
    });

    it("can restart after stopping", () => {
      startCronJobs();
      stopCronJobs();
      expect(isCronRunning()).toBe(false);

      startCronJobs();
      expect(isCronRunning()).toBe(true);
    });
  });
});
