import { describe, it, expect } from "vitest";
import {
  sendNudgeSchema,
  createSharedGoalSchema,
} from "../accountability.schema.js";

describe("Accountability Schemas", () => {
  describe("sendNudgeSchema", () => {
    it("accepts valid message", () => {
      const result = sendNudgeSchema.safeParse({
        message: "Hey! Don't forget your tasks today!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty message", () => {
      const result = sendNudgeSchema.safeParse({ message: "" });
      expect(result.success).toBe(false);
    });

    it("rejects message exceeding 500 chars", () => {
      const result = sendNudgeSchema.safeParse({
        message: "A".repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createSharedGoalSchema", () => {
    it("validates a valid shared goal", () => {
      const result = createSharedGoalSchema.safeParse({
        title: "Complete 100 tasks this month",
        targetValue: 100,
        metric: "tasks_completed",
        startsAt: "2026-04-01",
        endsAt: "2026-04-30",
      });
      expect(result.success).toBe(true);
    });

    it("accepts all metric types", () => {
      for (const metric of ["tasks_completed", "streak_days", "focus_minutes"]) {
        const result = createSharedGoalSchema.safeParse({
          title: "Goal",
          targetValue: 10,
          metric,
          startsAt: "2026-04-01",
          endsAt: "2026-04-30",
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects empty title", () => {
      const result = createSharedGoalSchema.safeParse({
        title: "",
        targetValue: 10,
        metric: "tasks_completed",
        startsAt: "2026-04-01",
        endsAt: "2026-04-30",
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-positive target value", () => {
      const result = createSharedGoalSchema.safeParse({
        title: "Goal",
        targetValue: 0,
        metric: "tasks_completed",
        startsAt: "2026-04-01",
        endsAt: "2026-04-30",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid metric", () => {
      const result = createSharedGoalSchema.safeParse({
        title: "Goal",
        targetValue: 10,
        metric: "invalid_metric",
        startsAt: "2026-04-01",
        endsAt: "2026-04-30",
      });
      expect(result.success).toBe(false);
    });
  });
});
