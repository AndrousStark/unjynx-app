import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CHANNEL_QUEUES, type ChannelQueueName } from "../types.js";

// Mock bullmq before importing queue-factory
vi.mock("bullmq", () => {
  const mockQueue = vi.fn().mockImplementation((name: string) => ({
    name,
    add: vi.fn().mockResolvedValue({ id: `job-${Date.now()}`, name: "test" }),
    close: vi.fn().mockResolvedValue(undefined),
    getJob: vi.fn().mockResolvedValue(null),
  }));

  return { Queue: mockQueue, Worker: vi.fn() };
});

// Mock connection
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
  initializeQueues,
  getQueue,
  getAllQueues,
  closeAllQueues,
  resetQueues,
} from "../queue-factory.js";
import { createInMemoryQueueConnection } from "../connection.js";

describe("Queue Factory", () => {
  beforeEach(() => {
    resetQueues();
  });

  afterEach(async () => {
    await closeAllQueues();
  });

  describe("initializeQueues", () => {
    it("creates queues for all channel types", () => {
      const conn = createInMemoryQueueConnection();
      const queues = initializeQueues(conn);

      const expectedNames = Object.values(CHANNEL_QUEUES);
      expect(queues.size).toBe(expectedNames.length);

      for (const name of expectedNames) {
        expect(queues.has(name as ChannelQueueName)).toBe(true);
      }
    });

    it("is idempotent - second call returns same queues", () => {
      const conn = createInMemoryQueueConnection();
      const first = initializeQueues(conn);
      const second = initializeQueues(conn);

      expect(first.size).toBe(second.size);
    });

    it("creates exactly 10 queues (8 channels + digest + escalation)", () => {
      const conn = createInMemoryQueueConnection();
      const queues = initializeQueues(conn);
      expect(queues.size).toBe(10);
    });
  });

  describe("getQueue", () => {
    it("returns queue for valid channel name", () => {
      const conn = createInMemoryQueueConnection();
      initializeQueues(conn);

      const queue = getQueue("notification:push");
      expect(queue).toBeDefined();
      expect(queue.name).toBe("notification:push");
    });

    it("throws when queues are not initialized", () => {
      expect(() => getQueue("notification:push")).toThrow(
        /not found.*initializeQueues/,
      );
    });

    it("returns different queues for different channels", () => {
      const conn = createInMemoryQueueConnection();
      initializeQueues(conn);

      const pushQueue = getQueue("notification:push");
      const emailQueue = getQueue("notification:email");

      expect(pushQueue.name).not.toBe(emailQueue.name);
    });
  });

  describe("getAllQueues", () => {
    it("returns empty map before initialization", () => {
      const queues = getAllQueues();
      expect(queues.size).toBe(0);
    });

    it("returns all queues after initialization", () => {
      const conn = createInMemoryQueueConnection();
      initializeQueues(conn);

      const queues = getAllQueues();
      expect(queues.size).toBe(10);
    });
  });

  describe("closeAllQueues", () => {
    it("clears the queue registry", async () => {
      const conn = createInMemoryQueueConnection();
      initializeQueues(conn);
      expect(getAllQueues().size).toBe(10);

      await closeAllQueues();
      expect(getAllQueues().size).toBe(0);
    });

    it("handles closing when no queues exist", async () => {
      await expect(closeAllQueues()).resolves.toBeUndefined();
    });
  });

  describe("resetQueues", () => {
    it("clears the registry without closing", () => {
      const conn = createInMemoryQueueConnection();
      initializeQueues(conn);
      expect(getAllQueues().size).toBe(10);

      resetQueues();
      expect(getAllQueues().size).toBe(0);
    });
  });
});
