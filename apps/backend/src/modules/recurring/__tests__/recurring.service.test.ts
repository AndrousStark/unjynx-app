import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock: recurring repository ───────────────────────────────────────────
const mockFindByTaskId = vi.fn();
const mockUpsert = vi.fn();
const mockRemove = vi.fn();

vi.mock("../recurring.repository.js", () => ({
  findByTaskId: (...args: unknown[]) => mockFindByTaskId(...args),
  upsert: (...args: unknown[]) => mockUpsert(...args),
  remove: (...args: unknown[]) => mockRemove(...args),
}));

// ── Mock: tasks repository ───────────────────────────────────────────────
const mockFindTaskById = vi.fn();
const mockUpdateTaskById = vi.fn();

vi.mock("../../tasks/tasks.repository.js", () => ({
  findTaskById: (...args: unknown[]) => mockFindTaskById(...args),
  updateTaskById: (...args: unknown[]) => mockUpdateTaskById(...args),
}));

// ── Mock: env (avoid DATABASE_URL validation at import time) ─────────────
vi.mock("../../../env.js", () => ({
  env: {
    NODE_ENV: "test",
    PORT: 3000,
    LOG_LEVEL: "info",
    DATABASE_URL: "postgres://test:test@localhost:5432/test",
    REDIS_URL: "redis://localhost:6379",
    LOGTO_ENDPOINT: "http://localhost:3001",
    LOGTO_APP_ID: "test-app-id",
    LOGTO_APP_SECRET: "test-app-secret",
    S3_ENDPOINT: "http://localhost:9000",
    S3_ACCESS_KEY: "minioadmin",
    S3_SECRET_KEY: "minioadmin",
    S3_BUCKET: "test-bucket",
    S3_REGION: "us-east-1",
  },
}));

import {
  getRecurrence,
  setRecurrence,
  removeRecurrence,
  getOccurrences,
} from "../recurring.service.js";

const fakeTask = {
  id: "task-1",
  userId: "user-1",
  projectId: null,
  title: "Recurring Task",
  description: null,
  status: "pending" as const,
  priority: "none" as const,
  dueDate: null,
  completedAt: null,
  rrule: "FREQ=DAILY",
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakeRule = {
  id: "rule-1",
  taskId: "task-1",
  userId: "user-1",
  rrule: "FREQ=DAILY",
  nextOccurrence: new Date("2026-03-11T00:00:00Z"),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Recurring Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getRecurrence", () => {
    it("returns the recurring rule when task exists", async () => {
      mockFindTaskById.mockResolvedValueOnce(fakeTask);
      mockFindByTaskId.mockResolvedValueOnce(fakeRule);

      const result = await getRecurrence("task-1", "user-1");

      expect(result).toEqual(fakeRule);
      expect(mockFindTaskById).toHaveBeenCalledWith("user-1", "task-1");
      expect(mockFindByTaskId).toHaveBeenCalledWith("task-1", "user-1");
    });

    it("returns undefined when task not found", async () => {
      mockFindTaskById.mockResolvedValueOnce(undefined);

      const result = await getRecurrence("non-existent", "user-1");

      expect(result).toBeUndefined();
      expect(mockFindByTaskId).not.toHaveBeenCalled();
    });
  });

  describe("setRecurrence", () => {
    it("creates a recurring rule when task exists", async () => {
      mockFindTaskById.mockResolvedValueOnce(fakeTask);
      mockUpdateTaskById.mockResolvedValueOnce(fakeTask);
      mockUpsert.mockResolvedValueOnce(fakeRule);

      const result = await setRecurrence("task-1", "user-1", "FREQ=DAILY");

      expect(result).toEqual(fakeRule);
      expect(mockFindTaskById).toHaveBeenCalledWith("user-1", "task-1");
      expect(mockUpdateTaskById).toHaveBeenCalledWith(
        "user-1",
        "task-1",
        expect.objectContaining({
          rrule: "FREQ=DAILY",
          updatedAt: expect.any(Date),
        }),
      );
      expect(mockUpsert).toHaveBeenCalledWith(
        "task-1",
        "user-1",
        "FREQ=DAILY",
        expect.any(Date), // nextOccurrence
      );
    });

    it("returns undefined when task not found", async () => {
      mockFindTaskById.mockResolvedValueOnce(undefined);

      const result = await setRecurrence("non-existent", "user-1", "FREQ=DAILY");

      expect(result).toBeUndefined();
      expect(mockUpsert).not.toHaveBeenCalled();
      expect(mockUpdateTaskById).not.toHaveBeenCalled();
    });

    it("throws on invalid RRULE string", async () => {
      mockFindTaskById.mockResolvedValueOnce(fakeTask);

      await expect(
        setRecurrence("task-1", "user-1", "INVALID_RRULE"),
      ).rejects.toThrow("Invalid RRULE string");
    });
  });

  describe("removeRecurrence", () => {
    it("removes the rule and clears task rrule field", async () => {
      mockFindTaskById.mockResolvedValueOnce(fakeTask);
      mockUpdateTaskById.mockResolvedValueOnce(fakeTask);
      mockRemove.mockResolvedValueOnce(true);

      const result = await removeRecurrence("task-1", "user-1");

      expect(result).toBe(true);
      expect(mockUpdateTaskById).toHaveBeenCalledWith(
        "user-1",
        "task-1",
        expect.objectContaining({
          rrule: null,
          updatedAt: expect.any(Date),
        }),
      );
      expect(mockRemove).toHaveBeenCalledWith("task-1", "user-1");
    });

    it("returns false when task not found", async () => {
      mockFindTaskById.mockResolvedValueOnce(undefined);

      const result = await removeRecurrence("non-existent", "user-1");

      expect(result).toBe(false);
      expect(mockUpdateTaskById).not.toHaveBeenCalled();
      expect(mockRemove).not.toHaveBeenCalled();
    });
  });

  describe("getOccurrences", () => {
    it("returns dates array when rule exists", async () => {
      mockFindTaskById.mockResolvedValueOnce(fakeTask);
      mockFindByTaskId.mockResolvedValueOnce(fakeRule);

      const result = await getOccurrences("task-1", "user-1", 5);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result!.length).toBeGreaterThan(0);
      for (const date of result!) {
        expect(date).toBeInstanceOf(Date);
      }
    });

    it("returns undefined when task not found", async () => {
      mockFindTaskById.mockResolvedValueOnce(undefined);

      const result = await getOccurrences("non-existent", "user-1", 5);

      expect(result).toBeUndefined();
    });

    it("returns undefined when no recurring rule exists", async () => {
      mockFindTaskById.mockResolvedValueOnce(fakeTask);
      mockFindByTaskId.mockResolvedValueOnce(undefined);

      const result = await getOccurrences("task-1", "user-1", 5);

      expect(result).toBeUndefined();
    });
  });
});
