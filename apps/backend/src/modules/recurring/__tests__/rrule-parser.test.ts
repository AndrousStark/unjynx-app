import { describe, it, expect } from "vitest";
import { parseRRule, getNextOccurrences } from "../rrule-parser.js";

const FIXED_AFTER = new Date("2026-03-10T00:00:00Z");

describe("RRULE Parser", () => {
  describe("parseRRule", () => {
    it("parses FREQ=DAILY with defaults", () => {
      const result = parseRRule("FREQ=DAILY");
      expect(result).toEqual({
        freq: "DAILY",
        interval: 1,
        byDay: [],
        byMonthDay: [],
        byMonth: [],
        count: null,
        until: null,
      });
    });

    it("parses RRULE: prefix with WEEKLY, INTERVAL, and BYDAY", () => {
      const result = parseRRule(
        "RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR",
      );
      expect(result).toEqual({
        freq: "WEEKLY",
        interval: 2,
        byDay: ["MO", "WE", "FR"],
        byMonthDay: [],
        byMonth: [],
        count: null,
        until: null,
      });
    });

    it("parses MONTHLY with BYMONTHDAY", () => {
      const result = parseRRule("FREQ=MONTHLY;BYMONTHDAY=1,15");
      expect(result).toEqual({
        freq: "MONTHLY",
        interval: 1,
        byDay: [],
        byMonthDay: [1, 15],
        byMonth: [],
        count: null,
        until: null,
      });
    });

    it("parses YEARLY with BYMONTH and BYMONTHDAY", () => {
      const result = parseRRule("FREQ=YEARLY;BYMONTH=1,6;BYMONTHDAY=1");
      expect(result).toEqual({
        freq: "YEARLY",
        interval: 1,
        byDay: [],
        byMonthDay: [1],
        byMonth: [1, 6],
        count: null,
        until: null,
      });
    });

    it("parses COUNT", () => {
      const result = parseRRule("FREQ=DAILY;COUNT=10");
      expect(result).not.toBeNull();
      expect(result!.count).toBe(10);
    });

    it("parses UNTIL date (YYYYMMDD)", () => {
      const result = parseRRule("FREQ=DAILY;UNTIL=20261231");
      expect(result).not.toBeNull();
      expect(result!.until).toEqual(new Date(Date.UTC(2026, 11, 31)));
    });

    it("parses UNTIL with time (YYYYMMDDTHHmmssZ)", () => {
      const result = parseRRule("FREQ=DAILY;UNTIL=20261231T235959Z");
      expect(result).not.toBeNull();
      expect(result!.until).toEqual(
        new Date(Date.UTC(2026, 11, 31, 23, 59, 59)),
      );
    });

    it("returns null for invalid FREQ (HOURLY)", () => {
      expect(parseRRule("FREQ=HOURLY")).toBeNull();
    });

    it("returns null for missing FREQ", () => {
      expect(parseRRule("INTERVAL=2")).toBeNull();
    });

    it("returns null for malformed string", () => {
      expect(parseRRule("not_valid")).toBeNull();
    });

    it("returns null for invalid INTERVAL (0)", () => {
      expect(parseRRule("FREQ=DAILY;INTERVAL=0")).toBeNull();
    });

    it("returns null for invalid BYDAY (XX)", () => {
      expect(parseRRule("FREQ=WEEKLY;BYDAY=XX")).toBeNull();
    });

    it("returns null for invalid BYMONTHDAY (32)", () => {
      expect(parseRRule("FREQ=MONTHLY;BYMONTHDAY=32")).toBeNull();
    });

    it("returns null for invalid BYMONTH (13)", () => {
      expect(parseRRule("FREQ=YEARLY;BYMONTH=13")).toBeNull();
    });
  });

  describe("getNextOccurrences", () => {
    it("returns N daily dates starting from after-date", () => {
      const results = getNextOccurrences("FREQ=DAILY", 3, FIXED_AFTER);

      expect(results).toHaveLength(3);
      // First occurrence should be the day after FIXED_AFTER
      expect(results[0].getUTCFullYear()).toBe(2026);
      expect(results[0].getUTCMonth()).toBe(2); // March (0-indexed)
      expect(results[0].getUTCDate()).toBe(11);
      expect(results[1].getUTCDate()).toBe(12);
      expect(results[2].getUTCDate()).toBe(13);
    });

    it("returns only Mondays for FREQ=WEEKLY;BYDAY=MO", () => {
      const results = getNextOccurrences(
        "FREQ=WEEKLY;BYDAY=MO",
        4,
        FIXED_AFTER,
      );

      expect(results.length).toBeGreaterThan(0);
      for (const date of results) {
        // Monday = 1 in getUTCDay()
        expect(date.getUTCDay()).toBe(1);
      }
    });

    it("returns the 15th of each month for FREQ=MONTHLY;BYMONTHDAY=15", () => {
      const results = getNextOccurrences(
        "FREQ=MONTHLY;BYMONTHDAY=15",
        3,
        FIXED_AFTER,
      );

      expect(results).toHaveLength(3);
      for (const date of results) {
        expect(date.getUTCDate()).toBe(15);
      }
      // March 15, April 15, May 15
      expect(results[0].getUTCMonth()).toBe(2);
      expect(results[1].getUTCMonth()).toBe(3);
      expect(results[2].getUTCMonth()).toBe(4);
    });

    it("respects COUNT limit", () => {
      const results = getNextOccurrences(
        "FREQ=DAILY;COUNT=3",
        10,
        FIXED_AFTER,
      );

      expect(results.length).toBeLessThanOrEqual(3);
    });

    it("respects UNTIL boundary", () => {
      const results = getNextOccurrences(
        "FREQ=DAILY;UNTIL=20260315",
        100,
        FIXED_AFTER,
      );

      const untilDate = new Date(Date.UTC(2026, 2, 15));
      for (const date of results) {
        expect(date.getTime()).toBeLessThanOrEqual(untilDate.getTime());
      }
      // Should get exactly 5 days: March 11-15
      expect(results).toHaveLength(5);
    });

    it("returns empty array for invalid rrule", () => {
      const results = getNextOccurrences("not_valid", 5, FIXED_AFTER);
      expect(results).toEqual([]);
    });

    it("handles INTERVAL > 1 (every 3 days)", () => {
      const results = getNextOccurrences(
        "FREQ=DAILY;INTERVAL=3",
        3,
        FIXED_AFTER,
      );

      expect(results).toHaveLength(3);
      // First occurrence is March 11 (day after FIXED_AFTER)
      expect(results[0].getUTCDate()).toBe(11);
      // Next should be 3 days later: March 14
      expect(results[1].getUTCDate()).toBe(14);
      // Next: March 17
      expect(results[2].getUTCDate()).toBe(17);
    });
  });
});
