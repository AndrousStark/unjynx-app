import { describe, it, expect } from "vitest";
import {
  createTagSchema,
  updateTagSchema,
  tagQuerySchema,
  addTagToTaskSchema,
} from "../tags.schema.js";

describe("Tag Schemas", () => {
  describe("createTagSchema", () => {
    it("validates name with default color", () => {
      const result = createTagSchema.safeParse({ name: "Work" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Work");
        expect(result.data.color).toBe("#6C5CE7");
      }
    });

    it("validates name with custom color", () => {
      const result = createTagSchema.safeParse({
        name: "Urgent",
        color: "#FF5733",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Urgent");
        expect(result.data.color).toBe("#FF5733");
      }
    });

    it("rejects missing name", () => {
      const result = createTagSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects empty name", () => {
      const result = createTagSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects name exceeding 100 chars", () => {
      const result = createTagSchema.safeParse({ name: "a".repeat(101) });
      expect(result.success).toBe(false);
    });

    it("rejects invalid color hex (missing #)", () => {
      const result = createTagSchema.safeParse({
        name: "Test",
        color: "FF5733",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid color hex (wrong length)", () => {
      const result = createTagSchema.safeParse({
        name: "Test",
        color: "#FFF",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid color hex (non-hex chars)", () => {
      const result = createTagSchema.safeParse({
        name: "Test",
        color: "#GGGGGG",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateTagSchema", () => {
    it("validates partial update with name only", () => {
      const result = updateTagSchema.safeParse({ name: "Personal" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Personal");
      }
    });

    it("validates partial update with color only", () => {
      const result = updateTagSchema.safeParse({ color: "#00FF00" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.color).toBe("#00FF00");
      }
    });

    it("accepts empty object (all fields optional)", () => {
      const result = updateTagSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("tagQuerySchema", () => {
    it("provides defaults for empty object", () => {
      const result = tagQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("accepts custom page and limit", () => {
      const result = tagQuerySchema.safeParse({ page: 5, limit: 30 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.limit).toBe(30);
      }
    });

    it("coerces string numbers", () => {
      const result = tagQuerySchema.safeParse({ page: "2", limit: "15" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(15);
      }
    });
  });

  describe("addTagToTaskSchema", () => {
    it("validates a valid UUID", () => {
      const result = addTagToTaskSchema.safeParse({
        tagId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tagId).toBe(
          "550e8400-e29b-41d4-a716-446655440000",
        );
      }
    });

    it("rejects invalid UUID", () => {
      const result = addTagToTaskSchema.safeParse({ tagId: "not-a-uuid" });
      expect(result.success).toBe(false);
    });

    it("rejects missing tagId", () => {
      const result = addTagToTaskSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
