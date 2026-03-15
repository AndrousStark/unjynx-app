import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsertTask = vi.fn();
const mockFindTasks = vi.fn();
const mockFindTaskById = vi.fn();
const mockUpdateTaskById = vi.fn();
const mockDeleteTaskById = vi.fn();

vi.mock("../tasks.repository.js", () => ({
  insertTask: (...args: unknown[]) => mockInsertTask(...args),
  findTasks: (...args: unknown[]) => mockFindTasks(...args),
  findTaskById: (...args: unknown[]) => mockFindTaskById(...args),
  updateTaskById: (...args: unknown[]) => mockUpdateTaskById(...args),
  deleteTaskById: (...args: unknown[]) => mockDeleteTaskById(...args),
}));

import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from "../tasks.service.js";

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

describe("Tasks Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTask", () => {
    it("creates a task via repository", async () => {
      mockInsertTask.mockResolvedValueOnce(fakeTask);

      const result = await createTask("user-1", {
        title: "Test Task",
        priority: "none",
      });

      expect(result).toEqual(fakeTask);
      expect(mockInsertTask).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          title: "Test Task",
          priority: "none",
        }),
      );
    });
  });

  describe("getTasks", () => {
    it("returns paginated tasks from repository", async () => {
      mockFindTasks.mockResolvedValueOnce({ items: [fakeTask], total: 1 });

      const result = await getTasks("user-1", { page: 1, limit: 20 });

      expect(result.items).toEqual([fakeTask]);
      expect(result.total).toBe(1);
      expect(mockFindTasks).toHaveBeenCalledWith(
        "user-1",
        { status: undefined, priority: undefined, projectId: undefined },
        20,
        0,
      );
    });

    it("passes filters to repository", async () => {
      mockFindTasks.mockResolvedValueOnce({ items: [], total: 0 });

      await getTasks("user-1", {
        page: 2,
        limit: 10,
        status: "completed",
        priority: "high",
      });

      expect(mockFindTasks).toHaveBeenCalledWith(
        "user-1",
        { status: "completed", priority: "high", projectId: undefined },
        10,
        10, // offset = (page-1) * limit
      );
    });
  });

  describe("getTaskById", () => {
    it("returns task from repository", async () => {
      mockFindTaskById.mockResolvedValueOnce(fakeTask);

      const result = await getTaskById("user-1", "task-1");

      expect(result).toEqual(fakeTask);
    });

    it("returns undefined when not found", async () => {
      mockFindTaskById.mockResolvedValueOnce(undefined);

      const result = await getTaskById("user-1", "non-existent");

      expect(result).toBeUndefined();
    });
  });

  describe("updateTask", () => {
    it("updates via repository", async () => {
      const updated = { ...fakeTask, title: "Updated" };
      mockUpdateTaskById.mockResolvedValueOnce(updated);

      const result = await updateTask("user-1", "task-1", {
        title: "Updated",
      });

      expect(result).toEqual(updated);
    });

    it("sets completedAt when status becomes completed", async () => {
      const completed = {
        ...fakeTask,
        status: "completed",
        completedAt: new Date(),
      };
      mockUpdateTaskById.mockResolvedValueOnce(completed);

      await updateTask("user-1", "task-1", { status: "completed" });

      expect(mockUpdateTaskById).toHaveBeenCalledWith(
        "user-1",
        "task-1",
        expect.objectContaining({
          status: "completed",
          completedAt: expect.any(Date),
        }),
      );
    });

    it("clears completedAt when status changes from completed", async () => {
      mockUpdateTaskById.mockResolvedValueOnce({
        ...fakeTask,
        status: "pending",
      });

      await updateTask("user-1", "task-1", { status: "pending" });

      expect(mockUpdateTaskById).toHaveBeenCalledWith(
        "user-1",
        "task-1",
        expect.objectContaining({
          status: "pending",
          completedAt: null,
        }),
      );
    });

    it("returns undefined when task not found", async () => {
      mockUpdateTaskById.mockResolvedValueOnce(undefined);

      const result = await updateTask("user-1", "non-existent", {
        title: "X",
      });

      expect(result).toBeUndefined();
    });
  });

  describe("deleteTask", () => {
    it("returns true when deleted via repository", async () => {
      mockDeleteTaskById.mockResolvedValueOnce(true);

      const result = await deleteTask("user-1", "task-1");

      expect(result).toBe(true);
    });

    it("returns false when not found", async () => {
      mockDeleteTaskById.mockResolvedValueOnce(false);

      const result = await deleteTask("user-1", "non-existent");

      expect(result).toBe(false);
    });
  });
});
