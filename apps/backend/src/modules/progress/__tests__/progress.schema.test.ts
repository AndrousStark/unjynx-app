import { describe, it, expect } from "vitest";
import { heatmapQuerySchema } from "../progress.schema.js";

describe("Progress Schemas", () => {
  describe("heatmapQuerySchema", () => {
    it("accepts empty object", () => {
      const result = heatmapQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startDate).toBeUndefined();
        expect(result.data.endDate).toBeUndefined();
      }
    });

    it("accepts valid date strings", () => {
      const result = heatmapQuerySchema.safeParse({
        startDate: "2026-03-01",
        endDate: "2026-03-10",
      });
      expect(result.success).toBe(true);
    });

    it("coerces string dates to Date objects", () => {
      const result = heatmapQuerySchema.safeParse({
        startDate: "2026-03-01",
        endDate: "2026-03-10",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startDate).toBeInstanceOf(Date);
        expect(result.data.endDate).toBeInstanceOf(Date);
      }
    });

    it("accepts Date objects", () => {
      const result = heatmapQuerySchema.safeParse({
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-03-10"),
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startDate).toBeInstanceOf(Date);
        expect(result.data.endDate).toBeInstanceOf(Date);
      }
    });

    it("rejects invalid date strings", () => {
      const result = heatmapQuerySchema.safeParse({
        startDate: "not-a-date",
      });
      expect(result.success).toBe(false);
    });
  });
});
