import { describe, it, expect } from "vitest";
import {
  setRecurrenceSchema,
  occurrencesQuerySchema,
} from "../recurring.schema.js";

describe("Recurring Schemas", () => {
  describe("setRecurrenceSchema", () => {
    it("accepts a simple FREQ=DAILY rule", () => {
      const result = setRecurrenceSchema.safeParse({ rrule: "FREQ=DAILY" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rrule).toBe("FREQ=DAILY");
      }
    });

    it("accepts a full RRULE: prefixed rule", () => {
      const result = setRecurrenceSchema.safeParse({
        rrule: "RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rrule).toBe(
          "RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR",
        );
      }
    });

    it("rejects empty string", () => {
      const result = setRecurrenceSchema.safeParse({ rrule: "" });
      expect(result.success).toBe(false);
    });

    it("rejects string not starting with FREQ= or RRULE:FREQ=", () => {
      const result = setRecurrenceSchema.safeParse({
        rrule: "INTERVAL=2;BYDAY=MO",
      });
      expect(result.success).toBe(false);
    });

    it("rejects string over 1000 characters", () => {
      const result = setRecurrenceSchema.safeParse({
        rrule: "FREQ=" + "A".repeat(1000),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("occurrencesQuerySchema", () => {
    it("defaults count to 5 when not provided", () => {
      const result = occurrencesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(5);
      }
    });

    it("accepts a valid count", () => {
      const result = occurrencesQuerySchema.safeParse({ count: 50 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(50);
      }
    });

    it("rejects count of 0", () => {
      const result = occurrencesQuerySchema.safeParse({ count: 0 });
      expect(result.success).toBe(false);
    });

    it("rejects count of 101", () => {
      const result = occurrencesQuerySchema.safeParse({ count: 101 });
      expect(result.success).toBe(false);
    });

    it("coerces string '10' to number 10", () => {
      const result = occurrencesQuerySchema.safeParse({ count: "10" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.count).toBe(10);
      }
    });
  });
});
