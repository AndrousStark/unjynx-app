import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NotificationJobData } from "../types.js";

// ── Mock BullMQ ─────────────────────────────────────────────────────

const mockAdd = vi.fn().mockResolvedValue({ id: "bullmq-job-1", name: "test" });
const mockClose = vi.fn().mockResolvedValue(undefined);

vi.mock("bullmq", () => {
  const MockQueue = vi.fn().mockImplementation((name: string) => ({
    name,
    add: mockAdd,
    close: mockClose,
  }));
  return { Queue: MockQueue, Worker: vi.fn() };
});

vi.mock("../connection.js", () => ({
  createProducerConnection: vi.fn().mockReturnValue({
    connection: { status: "ready" },
    close: vi.fn().mockResolvedValue(undefined),
  }),
  createWorkerConnection: vi.fn().mockReturnValue({
    connection: { status: "ready" },
    close: vi.fn().mockResolvedValue(undefined),
  }),
  createInMemoryQueueConnection: vi.fn().mockReturnValue({
    connection: { status: "ready" },
    close: vi.fn().mockResolvedValue(undefined),
  }),
}));

import {
  dispatchNotification,
  dispatchCascade,
  type DispatcherNotificationPort,
  type DispatcherDeliveryPort,
} from "../notification-dispatcher.js";
import { initializeQueues, resetQueues } from "../queue-factory.js";
import { createInMemoryQueueConnection } from "../connection.js";

// ── Mock Ports ──────────────────────────────────────────────────────

function createMockPorts() {
  const notifications: DispatcherNotificationPort = {
    insertNotification: vi.fn().mockResolvedValue({ id: "notif-new-1" }),
  };

  const delivery: DispatcherDeliveryPort = {
    insertDeliveryAttempt: vi.fn().mockResolvedValue({ id: "attempt-1" }),
  };

  return { notifications, delivery };
}

function createSampleJob(overrides?: Partial<NotificationJobData>): NotificationJobData {
  return {
    userId: "user-1",
    taskId: "task-1",
    notificationId: "placeholder",
    channel: "push",
    messageType: "task_reminder",
    templateVars: { task_title: "Buy groceries", due_time: "in 15 min" },
    priority: 5,
    attemptNumber: 1,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe("Notification Dispatcher", () => {
  let ports: ReturnType<typeof createMockPorts>;

  beforeEach(() => {
    resetQueues();
    mockAdd.mockClear();
    const conn = createInMemoryQueueConnection();
    initializeQueues(conn);
    ports = createMockPorts();
  });

  afterEach(() => {
    resetQueues();
  });

  describe("dispatchNotification", () => {
    it("creates a notification record in the database", async () => {
      const jobData = createSampleJob();
      await dispatchNotification(jobData, ports);

      expect(ports.notifications.insertNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          taskId: "task-1",
          type: "task_reminder",
          priority: 5,
        }),
      );
    });

    it("creates a delivery attempt record", async () => {
      const jobData = createSampleJob();
      await dispatchNotification(jobData, ports);

      expect(ports.delivery.insertDeliveryAttempt).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationId: "notif-new-1",
          channel: "push",
          provider: "fcm",
          status: "queued",
        }),
      );
    });

    it("adds job to the correct BullMQ queue", async () => {
      const jobData = createSampleJob({ channel: "email" });
      await dispatchNotification(jobData, ports);

      expect(mockAdd).toHaveBeenCalledWith(
        "task_reminder:email",
        expect.objectContaining({
          channel: "email",
          notificationId: "notif-new-1",
        }),
        expect.any(Object),
      );
    });

    it("returns notification and job IDs", async () => {
      const jobData = createSampleJob();
      const result = await dispatchNotification(jobData, ports);

      expect(result.notificationId).toBe("notif-new-1");
      expect(result.jobId).toBe("bullmq-job-1");
      expect(result.queueName).toBe("notification:push");
    });

    it("passes delay option to BullMQ", async () => {
      const jobData = createSampleJob();
      await dispatchNotification(jobData, ports, { delayMs: 60_000 });

      expect(mockAdd).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ delay: 60_000 }),
      );
    });

    it("uses correct provider mapping for each channel", async () => {
      const providerMap: Record<string, string> = {
        push: "fcm",
        telegram: "telegram-bot-api",
        email: "sendgrid",
        whatsapp: "gupshup",
        sms: "msg91",
        instagram: "messenger-api",
        slack: "slack-api",
        discord: "discord-api",
      };

      for (const [channel, provider] of Object.entries(providerMap)) {
        const freshPorts = createMockPorts();
        const jobData = createSampleJob({ channel });
        await dispatchNotification(jobData, freshPorts);

        expect(freshPorts.delivery.insertDeliveryAttempt).toHaveBeenCalledWith(
          expect.objectContaining({ provider }),
        );
      }
    });

    it("throws for unknown channel", async () => {
      const jobData = createSampleJob({ channel: "carrier_pigeon" });
      await expect(
        dispatchNotification(jobData, ports),
      ).rejects.toThrow("Unknown channel: carrier_pigeon");
    });

    it("enriches job data with real notification ID", async () => {
      const jobData = createSampleJob({ notificationId: "placeholder" });
      await dispatchNotification(jobData, ports);

      // The add call should have the real notification ID
      expect(mockAdd).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          notificationId: "notif-new-1",
        }),
        expect.any(Object),
      );
    });
  });

  describe("dispatchCascade", () => {
    it("dispatches all jobs in the cascade", async () => {
      const cascadeId = "cascade-1";
      const jobs = [
        createSampleJob({ channel: "push", cascadeId }),
        createSampleJob({ channel: "email", cascadeId }),
        createSampleJob({ channel: "sms", cascadeId }),
      ];

      const results = await dispatchCascade(jobs, ports);

      expect(results).toHaveLength(3);
      expect(ports.notifications.insertNotification).toHaveBeenCalledTimes(3);
    });

    it("applies increasing delays for cascade steps", async () => {
      const jobs = [
        createSampleJob({ channel: "push", cascadeId: "c1" }),
        createSampleJob({ channel: "email", cascadeId: "c1" }),
      ];

      await dispatchCascade(jobs, ports, 0, 300_000);

      // First call: delay = 0
      expect(mockAdd).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ delay: 0 }),
      );

      // Second call: delay = 300_000
      expect(mockAdd).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ delay: 300_000 }),
      );
    });

    it("returns empty array for empty cascade", async () => {
      const results = await dispatchCascade([], ports);
      expect(results).toHaveLength(0);
    });

    it("supports custom base delay", async () => {
      const jobs = [createSampleJob({ channel: "push", cascadeId: "c2" })];
      await dispatchCascade(jobs, ports, 60_000);

      expect(mockAdd).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ delay: 60_000 }),
      );
    });
  });
});
