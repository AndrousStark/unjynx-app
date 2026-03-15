import { describe, it, expect } from "vitest";
import {
  bulkCreateTasksSchema,
  bulkUpdateTasksSchema,
  bulkDeleteTasksSchema,
  snoozeTaskSchema,
  moveTaskSchema,
  cursorQuerySchema,
} from "../tasks.schema.js";

describe("Task Extended Schemas", () => {
  describe("bulkCreateTasksSchema", () => {
    it("validates an array of valid tasks", () => {
      const result = bulkCreateTasksSchema.safeParse({
        tasks: [
          { title: "Task 1" },
          { title: "Task 2", priority: "high" },
        ],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tasks).toHaveLength(2);
        expect(result.data.tasks[0].title).toBe("Task 1");
        expect(result.data.tasks[1].priority).toBe("high");
      }
    });

    it("rejects empty array", () => {
      const result = bulkCreateTasksSchema.safeParse({ tasks: [] });
      expect(result.success).toBe(false);
    });

    it("rejects more than 50 tasks", () => {
      const tasks = Array.from({ length: 51 }, (_, i) => ({
        title: `Task ${i}`,
      }));
      const result = bulkCreateTasksSchema.safeParse({ tasks });
      expect(result.success).toBe(false);
    });

    it("rejects tasks with invalid fields", () => {
      const result = bulkCreateTasksSchema.safeParse({
        tasks: [{ title: "" }],
      });
      expect(result.success).toBe(false);
    });

    it("applies defaults within each task", () => {
      const result = bulkCreateTasksSchema.safeParse({
        tasks: [{ title: "Minimal task" }],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tasks[0].priority).toBe("none");
      }
    });
  });

  describe("bulkUpdateTasksSchema", () => {
    it("validates tasks with IDs and update fields", () => {
      const result = bulkUpdateTasksSchema.safeParse({
        tasks: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            title: "Updated Task",
          },
          {
            id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
            status: "completed",
          },
        ],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tasks).toHaveLength(2);
      }
    });

    it("rejects tasks missing required ID", () => {
      const result = bulkUpdateTasksSchema.safeParse({
        tasks: [{ title: "No ID" }],
      });
      expect(result.success).toBe(false);
    });

    it("rejects tasks with invalid UUID for ID", () => {
      const result = bulkUpdateTasksSchema.safeParse({
        tasks: [{ id: "not-a-uuid", title: "Bad ID" }],
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty array", () => {
      const result = bulkUpdateTasksSchema.safeParse({ tasks: [] });
      expect(result.success).toBe(false);
    });

    it("rejects more than 50 tasks", () => {
      const tasks = Array.from({ length: 51 }, (_, i) => ({
        id: `550e8400-e29b-41d4-a716-${String(i).padStart(12, "0")}`,
        title: `Task ${i}`,
      }));
      const result = bulkUpdateTasksSchema.safeParse({ tasks });
      expect(result.success).toBe(false);
    });
  });

  describe("bulkDeleteTasksSchema", () => {
    it("validates an array of valid UUIDs", () => {
      const result = bulkDeleteTasksSchema.safeParse({
        ids: [
          "550e8400-e29b-41d4-a716-446655440000",
          "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        ],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ids).toHaveLength(2);
      }
    });

    it("rejects empty array", () => {
      const result = bulkDeleteTasksSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
    });

    it("rejects more than 50 IDs", () => {
      const ids = Array.from({ length: 51 }, (_, i) =>
        `550e8400-e29b-41d4-a716-${String(i).padStart(12, "0")}`,
      );
      const result = bulkDeleteTasksSchema.safeParse({ ids });
      expect(result.success).toBe(false);
    });

    it("rejects invalid UUID format", () => {
      const result = bulkDeleteTasksSchema.safeParse({
        ids: ["not-a-uuid"],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("snoozeTaskSchema", () => {
    it("validates a reasonable snooze duration", () => {
      const result = snoozeTaskSchema.safeParse({ minutes: 30 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minutes).toBe(30);
      }
    });

    it("accepts minimum value (1 minute)", () => {
      const result = snoozeTaskSchema.safeParse({ minutes: 1 });
      expect(result.success).toBe(true);
    });

    it("accepts maximum value (10080 minutes = 7 days)", () => {
      const result = snoozeTaskSchema.safeParse({ minutes: 10080 });
      expect(result.success).toBe(true);
    });

    it("rejects 0 minutes", () => {
      const result = snoozeTaskSchema.safeParse({ minutes: 0 });
      expect(result.success).toBe(false);
    });

    it("rejects negative minutes", () => {
      const result = snoozeTaskSchema.safeParse({ minutes: -5 });
      expect(result.success).toBe(false);
    });

    it("rejects exceeding max (10081 minutes)", () => {
      const result = snoozeTaskSchema.safeParse({ minutes: 10081 });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer minutes", () => {
      const result = snoozeTaskSchema.safeParse({ minutes: 15.5 });
      expect(result.success).toBe(false);
    });
  });

  describe("moveTaskSchema", () => {
    it("validates a valid project UUID", () => {
      const result = moveTaskSchema.safeParse({
        projectId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.projectId).toBe(
          "550e8400-e29b-41d4-a716-446655440000",
        );
      }
    });

    it("accepts null projectId (remove from project)", () => {
      const result = moveTaskSchema.safeParse({ projectId: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.projectId).toBeNull();
      }
    });

    it("rejects invalid UUID for projectId", () => {
      const result = moveTaskSchema.safeParse({ projectId: "not-a-uuid" });
      expect(result.success).toBe(false);
    });

    it("rejects missing projectId", () => {
      const result = moveTaskSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("cursorQuerySchema", () => {
    it("provides defaults for empty object", () => {
      const result = cursorQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.sort).toBe("-created_at");
        expect(result.data.cursor).toBeUndefined();
        expect(result.data.status).toBeUndefined();
        expect(result.data.priority).toBeUndefined();
        expect(result.data.search).toBeUndefined();
      }
    });

    it("validates all fields together", () => {
      const result = cursorQuerySchema.safeParse({
        cursor: "abc123",
        limit: 100,
        status: "pending",
        priority: "high",
        projectId: "550e8400-e29b-41d4-a716-446655440000",
        search: "grocery",
        sort: "due_at",
        dueBefore: "2026-12-31",
        dueAfter: "2026-01-01",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cursor).toBe("abc123");
        expect(result.data.limit).toBe(100);
        expect(result.data.status).toBe("pending");
        expect(result.data.priority).toBe("high");
        expect(result.data.sort).toBe("due_at");
        expect(result.data.search).toBe("grocery");
      }
    });

    it("validates all sort options", () => {
      const validSorts = [
        "due_at",
        "-due_at",
        "priority",
        "-priority",
        "created_at",
        "-created_at",
        "title",
        "-title",
      ];
      for (const sort of validSorts) {
        const result = cursorQuerySchema.safeParse({ sort });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid sort value", () => {
      const result = cursorQuerySchema.safeParse({ sort: "invalid_sort" });
      expect(result.success).toBe(false);
    });

    it("rejects limit > 200", () => {
      const result = cursorQuerySchema.safeParse({ limit: 201 });
      expect(result.success).toBe(false);
    });

    it("rejects limit < 1", () => {
      const result = cursorQuerySchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
    });

    it("rejects search exceeding 500 chars", () => {
      const result = cursorQuerySchema.safeParse({
        search: "a".repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it("accepts search at max length (500 chars)", () => {
      const result = cursorQuerySchema.safeParse({
        search: "a".repeat(500),
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
      const result = cursorQuerySchema.safeParse({ status: "done" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid priority", () => {
      const result = cursorQuerySchema.safeParse({ priority: "super-urgent" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid projectId UUID", () => {
      const result = cursorQuerySchema.safeParse({
        projectId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("coerces date strings for dueBefore and dueAfter", () => {
      const result = cursorQuerySchema.safeParse({
        dueBefore: "2026-06-15",
        dueAfter: "2026-01-01",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dueBefore).toBeInstanceOf(Date);
        expect(result.data.dueAfter).toBeInstanceOf(Date);
      }
    });
  });
});
