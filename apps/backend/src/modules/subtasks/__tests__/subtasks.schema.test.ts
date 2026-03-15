import { describe, it, expect } from "vitest";
import {
  createSubtaskSchema,
  updateSubtaskSchema,
  reorderSubtasksSchema,
  subtaskQuerySchema,
} from "../subtasks.schema.js";

describe("Subtask Schemas", () => {
  describe("createSubtaskSchema", () => {
    it("validates a valid title", () => {
      const result = createSubtaskSchema.safeParse({ title: "Buy groceries" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Buy groceries");
      }
    });

    it("rejects missing title", () => {
      const result = createSubtaskSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects empty title", () => {
      const result = createSubtaskSchema.safeParse({ title: "" });
      expect(result.success).toBe(false);
    });

    it("rejects title exceeding 500 chars", () => {
      const result = createSubtaskSchema.safeParse({
        title: "a".repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it("accepts title at max length (500 chars)", () => {
      const result = createSubtaskSchema.safeParse({
        title: "a".repeat(500),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("updateSubtaskSchema", () => {
    it("validates partial update with title only", () => {
      const result = updateSubtaskSchema.safeParse({ title: "Updated" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Updated");
      }
    });

    it("validates partial update with isCompleted only", () => {
      const result = updateSubtaskSchema.safeParse({ isCompleted: true });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isCompleted).toBe(true);
      }
    });

    it("validates all fields together", () => {
      const result = updateSubtaskSchema.safeParse({
        title: "Updated subtask",
        isCompleted: false,
        sortOrder: 3,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Updated subtask");
        expect(result.data.isCompleted).toBe(false);
        expect(result.data.sortOrder).toBe(3);
      }
    });

    it("accepts empty object (all fields optional)", () => {
      const result = updateSubtaskSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("rejects non-integer sortOrder", () => {
      const result = updateSubtaskSchema.safeParse({ sortOrder: 1.5 });
      expect(result.success).toBe(false);
    });

    it("rejects empty title", () => {
      const result = updateSubtaskSchema.safeParse({ title: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("reorderSubtasksSchema", () => {
    it("validates an array of valid UUIDs", () => {
      const result = reorderSubtasksSchema.safeParse({
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
      const result = reorderSubtasksSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
    });

    it("rejects more than 100 IDs", () => {
      const ids = Array.from({ length: 101 }, (_, i) =>
        `550e8400-e29b-41d4-a716-${String(i).padStart(12, "0")}`,
      );
      const result = reorderSubtasksSchema.safeParse({ ids });
      expect(result.success).toBe(false);
    });

    it("rejects invalid UUID format", () => {
      const result = reorderSubtasksSchema.safeParse({
        ids: ["not-a-uuid"],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("subtaskQuerySchema", () => {
    it("provides defaults for empty object", () => {
      const result = subtaskQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("accepts custom page and limit", () => {
      const result = subtaskQuerySchema.safeParse({ page: 3, limit: 50 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(50);
      }
    });

    it("coerces string numbers", () => {
      const result = subtaskQuerySchema.safeParse({ page: "2", limit: "10" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(10);
      }
    });

    it("rejects page < 1", () => {
      const result = subtaskQuerySchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it("rejects limit > 100", () => {
      const result = subtaskQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });
  });
});
