import { describe, it, expect } from "vitest";
import {
  importPreviewSchema,
  importExecuteSchema,
  exportQuerySchema,
} from "../import-export.schema.js";

describe("Import/Export Schemas", () => {
  describe("importPreviewSchema", () => {
    it("validates valid preview request", () => {
      const result = importPreviewSchema.safeParse({
        csvContent: "title,priority\nTask 1,high",
      });
      expect(result.success).toBe(true);
    });

    it("defaults format to generic", () => {
      const result = importPreviewSchema.parse({
        csvContent: "title\nTask 1",
      });
      expect(result.format).toBe("generic");
      expect(result.delimiter).toBe(",");
    });

    it("accepts todoist format", () => {
      const result = importPreviewSchema.safeParse({
        csvContent: "Content,Priority\nTask,1",
        format: "todoist",
      });
      expect(result.success).toBe(true);
    });

    it("accepts ticktick format", () => {
      const result = importPreviewSchema.safeParse({
        csvContent: "Title,Priority\nTask,3",
        format: "ticktick",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty CSV content", () => {
      const result = importPreviewSchema.safeParse({
        csvContent: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects CSV content > 5MB", () => {
      const result = importPreviewSchema.safeParse({
        csvContent: "A".repeat(5_000_001),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("importExecuteSchema", () => {
    it("validates with default options", () => {
      const result = importExecuteSchema.parse({
        csvContent: "title\nTask 1",
      });
      expect(result.skipDuplicates).toBe(true);
      expect(result.format).toBe("generic");
    });

    it("accepts column mapping", () => {
      const result = importExecuteSchema.safeParse({
        csvContent: "task_name\nTask 1",
        columnMapping: {
          title: "task_name",
        },
      });
      expect(result.success).toBe(true);
    });

    it("allows disabling duplicate skip", () => {
      const result = importExecuteSchema.parse({
        csvContent: "title\nTask 1",
        skipDuplicates: false,
      });
      expect(result.skipDuplicates).toBe(false);
    });
  });

  describe("exportQuerySchema", () => {
    it("accepts empty query", () => {
      const result = exportQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts status filter", () => {
      const result = exportQuerySchema.safeParse({ status: "completed" });
      expect(result.success).toBe(true);
    });

    it("accepts projectId filter", () => {
      const result = exportQuerySchema.safeParse({
        projectId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
      const result = exportQuerySchema.safeParse({ status: "invalid" });
      expect(result.success).toBe(false);
    });
  });
});
