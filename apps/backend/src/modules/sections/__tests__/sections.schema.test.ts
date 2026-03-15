import { describe, it, expect } from "vitest";
import {
  createSectionSchema,
  updateSectionSchema,
  reorderSectionsSchema,
} from "../sections.schema.js";

describe("Section Schemas", () => {
  describe("createSectionSchema", () => {
    it("validates a valid name", () => {
      const result = createSectionSchema.safeParse({ name: "To Do" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("To Do");
      }
    });

    it("rejects missing name", () => {
      const result = createSectionSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects empty name", () => {
      const result = createSectionSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects name exceeding 200 chars", () => {
      const result = createSectionSchema.safeParse({
        name: "a".repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it("accepts name at max length (200 chars)", () => {
      const result = createSectionSchema.safeParse({
        name: "a".repeat(200),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("updateSectionSchema", () => {
    it("validates name only", () => {
      const result = updateSectionSchema.safeParse({ name: "In Progress" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("In Progress");
      }
    });

    it("validates sortOrder only", () => {
      const result = updateSectionSchema.safeParse({ sortOrder: 2 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sortOrder).toBe(2);
      }
    });

    it("validates both name and sortOrder", () => {
      const result = updateSectionSchema.safeParse({
        name: "Done",
        sortOrder: 5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Done");
        expect(result.data.sortOrder).toBe(5);
      }
    });

    it("accepts empty object (all fields optional)", () => {
      const result = updateSectionSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("rejects non-integer sortOrder", () => {
      const result = updateSectionSchema.safeParse({ sortOrder: 1.5 });
      expect(result.success).toBe(false);
    });

    it("rejects empty name", () => {
      const result = updateSectionSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("reorderSectionsSchema", () => {
    it("validates an array of valid UUIDs", () => {
      const result = reorderSectionsSchema.safeParse({
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
      const result = reorderSectionsSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
    });

    it("rejects more than 50 IDs", () => {
      const ids = Array.from({ length: 51 }, (_, i) =>
        `550e8400-e29b-41d4-a716-${String(i).padStart(12, "0")}`,
      );
      const result = reorderSectionsSchema.safeParse({ ids });
      expect(result.success).toBe(false);
    });

    it("rejects invalid UUID format", () => {
      const result = reorderSectionsSchema.safeParse({
        ids: ["not-a-uuid"],
      });
      expect(result.success).toBe(false);
    });
  });
});
