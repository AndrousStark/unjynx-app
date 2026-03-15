import { describe, it, expect } from "vitest";
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
} from "../tasks.schema.js";

describe("Task Schemas", () => {
  describe("createTaskSchema", () => {
    it("validates a minimal task", () => {
      const result = createTaskSchema.safeParse({ title: "Buy milk" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Buy milk");
        expect(result.data.priority).toBe("none");
      }
    });

    it("validates a full task", () => {
      const result = createTaskSchema.safeParse({
        title: "Review PR",
        description: "Check the auth changes",
        projectId: "550e8400-e29b-41d4-a716-446655440000",
        priority: "high",
        dueDate: "2026-12-31",
        rrule: "FREQ=WEEKLY;BYDAY=MO",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty title", () => {
      const result = createTaskSchema.safeParse({ title: "" });
      expect(result.success).toBe(false);
    });

    it("rejects title exceeding 500 chars", () => {
      const result = createTaskSchema.safeParse({ title: "a".repeat(501) });
      expect(result.success).toBe(false);
    });

    it("rejects invalid priority", () => {
      const result = createTaskSchema.safeParse({
        title: "Test",
        priority: "super-urgent",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid projectId format", () => {
      const result = createTaskSchema.safeParse({
        title: "Test",
        projectId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects description exceeding 5000 chars", () => {
      const result = createTaskSchema.safeParse({
        title: "Test",
        description: "x".repeat(5001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateTaskSchema", () => {
    it("validates partial updates", () => {
      const result = updateTaskSchema.safeParse({ title: "Updated" });
      expect(result.success).toBe(true);
    });

    it("allows nullable fields", () => {
      const result = updateTaskSchema.safeParse({
        description: null,
        projectId: null,
        dueDate: null,
        rrule: null,
      });
      expect(result.success).toBe(true);
    });

    it("validates status transitions", () => {
      const statuses = ["pending", "in_progress", "completed", "cancelled"];
      for (const status of statuses) {
        const result = updateTaskSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid status", () => {
      const result = updateTaskSchema.safeParse({ status: "done" });
      expect(result.success).toBe(false);
    });

    it("validates sortOrder as integer", () => {
      expect(updateTaskSchema.safeParse({ sortOrder: 5 }).success).toBe(true);
      expect(updateTaskSchema.safeParse({ sortOrder: 1.5 }).success).toBe(false);
    });
  });

  describe("taskQuerySchema", () => {
    it("provides defaults", () => {
      const result = taskQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("coerces string numbers", () => {
      const result = taskQuerySchema.safeParse({ page: "3", limit: "50" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(50);
      }
    });

    it("rejects page < 1", () => {
      const result = taskQuerySchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it("rejects limit > 100", () => {
      const result = taskQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it("accepts optional filters", () => {
      const result = taskQuerySchema.safeParse({
        status: "completed",
        priority: "high",
        projectId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });
  });
});
