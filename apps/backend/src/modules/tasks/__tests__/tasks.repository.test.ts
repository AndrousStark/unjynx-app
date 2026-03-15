import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../env.js", () => ({
  env: {
    NODE_ENV: "test",
    PORT: 3000,
    LOG_LEVEL: "silent",
    DATABASE_URL: "postgres://test:test@localhost:5432/test",
    REDIS_URL: "redis://localhost:6379",
    LOGTO_ENDPOINT: "http://localhost:3001",
    S3_ENDPOINT: "http://localhost:9000",
    S3_ACCESS_KEY: "test",
    S3_SECRET_KEY: "test",
    S3_BUCKET: "test",
    S3_REGION: "us-east-1",
  },
}));

function createChainableMock(resolve: () => unknown) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "from",
    "where",
    "orderBy",
    "limit",
    "offset",
    "set",
    "values",
    "returning",
  ];
  for (const m of methods) {
    chain[m] = vi.fn((..._args: unknown[]) => chain);
  }
  chain.then = (onFulfill: (val: unknown) => unknown) =>
    Promise.resolve(resolve()).then(onFulfill);
  return chain;
}

let selectResult: unknown = [];
let selectCountResult: unknown = [{ total: 0 }];
let insertResult: unknown = [];
let updateResult: unknown = [];
let deleteResult: unknown = [];
let selectCallIndex = 0;

vi.mock("../../../db/index.js", () => ({
  db: {
    select: vi.fn((..._args: unknown[]) => {
      const idx = selectCallIndex++;
      return createChainableMock(() =>
        idx % 2 === 0 ? selectResult : selectCountResult,
      );
    }),
    insert: vi.fn(() => createChainableMock(() => insertResult)),
    update: vi.fn(() => createChainableMock(() => updateResult)),
    delete: vi.fn(() => createChainableMock(() => deleteResult)),
  },
}));

import {
  insertTask,
  findTasks,
  findTaskById,
  updateTaskById,
  deleteTaskById,
} from "../tasks.repository.js";

const fakeTask = {
  id: "task-1",
  userId: "user-1",
  projectId: null,
  title: "Test Task",
  description: null,
  status: "pending" as const,
  priority: "none" as const,
  dueDate: null,
  completedAt: null,
  rrule: null,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Tasks Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCallIndex = 0;
    selectResult = [];
    selectCountResult = [{ total: 0 }];
    insertResult = [];
    updateResult = [];
    deleteResult = [];
  });

  describe("insertTask", () => {
    it("inserts a task and returns it", async () => {
      insertResult = [fakeTask];

      const result = await insertTask({
        userId: "user-1",
        title: "Test Task",
      });

      expect(result).toEqual(fakeTask);
    });
  });

  describe("findTasks", () => {
    it("returns paginated tasks", async () => {
      selectResult = [fakeTask];
      selectCountResult = [{ total: 1 }];

      const result = await findTasks("user-1", {}, 20, 0);

      expect(result.items).toEqual([fakeTask]);
      expect(result.total).toBe(1);
    });

    it("returns empty when no tasks match", async () => {
      selectResult = [];
      selectCountResult = [{ total: 0 }];

      const result = await findTasks(
        "user-1",
        { status: "completed" },
        20,
        0,
      );

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("findTaskById", () => {
    it("returns a task when found", async () => {
      selectResult = [fakeTask];

      const result = await findTaskById("user-1", "task-1");

      expect(result).toEqual(fakeTask);
    });

    it("returns undefined when not found", async () => {
      selectResult = [];

      const result = await findTaskById("user-1", "non-existent");

      expect(result).toBeUndefined();
    });
  });

  describe("updateTaskById", () => {
    it("updates and returns the task", async () => {
      const updated = { ...fakeTask, title: "Updated" };
      updateResult = [updated];

      const result = await updateTaskById("user-1", "task-1", {
        title: "Updated",
        updatedAt: new Date(),
      });

      expect(result).toEqual(updated);
    });

    it("returns undefined when task not found", async () => {
      updateResult = [];

      const result = await updateTaskById("user-1", "non-existent", {
        title: "X",
        updatedAt: new Date(),
      });

      expect(result).toBeUndefined();
    });
  });

  describe("deleteTaskById", () => {
    it("returns true when task is deleted", async () => {
      deleteResult = [{ id: "task-1" }];

      const result = await deleteTaskById("user-1", "task-1");

      expect(result).toBe(true);
    });

    it("returns false when task not found", async () => {
      deleteResult = [];

      const result = await deleteTaskById("user-1", "non-existent");

      expect(result).toBe(false);
    });
  });
});
