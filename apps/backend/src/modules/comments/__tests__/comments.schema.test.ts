import { describe, it, expect } from "vitest";
import {
  createCommentSchema,
  updateCommentSchema,
  commentQuerySchema,
} from "../comments.schema.js";

describe("Comment Schemas", () => {
  describe("createCommentSchema", () => {
    it("validates valid content", () => {
      const result = createCommentSchema.safeParse({
        content: "This looks good!",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe("This looks good!");
      }
    });

    it("rejects missing content", () => {
      const result = createCommentSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects empty content", () => {
      const result = createCommentSchema.safeParse({ content: "" });
      expect(result.success).toBe(false);
    });

    it("rejects content exceeding 5000 chars", () => {
      const result = createCommentSchema.safeParse({
        content: "x".repeat(5001),
      });
      expect(result.success).toBe(false);
    });

    it("accepts content at max length (5000 chars)", () => {
      const result = createCommentSchema.safeParse({
        content: "x".repeat(5000),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("updateCommentSchema", () => {
    it("validates valid content", () => {
      const result = updateCommentSchema.safeParse({
        content: "Updated comment",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe("Updated comment");
      }
    });

    it("rejects empty content", () => {
      const result = updateCommentSchema.safeParse({ content: "" });
      expect(result.success).toBe(false);
    });

    it("rejects content exceeding 5000 chars", () => {
      const result = updateCommentSchema.safeParse({
        content: "x".repeat(5001),
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing content (required field)", () => {
      const result = updateCommentSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("commentQuerySchema", () => {
    it("provides defaults for empty object", () => {
      const result = commentQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("accepts custom page and limit", () => {
      const result = commentQuerySchema.safeParse({ page: 2, limit: 50 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
      }
    });

    it("coerces string numbers", () => {
      const result = commentQuerySchema.safeParse({ page: "3", limit: "25" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(25);
      }
    });

    it("rejects page < 1", () => {
      const result = commentQuerySchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it("rejects limit > 100", () => {
      const result = commentQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });
  });
});
