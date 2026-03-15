import { describe, it, expect } from "vitest";
import {
  parseTimeToMinutes,
  isWithinQuietWindow,
  isQuietHoursActive,
} from "../quiet-hours.js";

describe("Quiet Hours", () => {
  // ── parseTimeToMinutes ────────────────────────────────────────────

  describe("parseTimeToMinutes", () => {
    it("parses midnight", () => {
      expect(parseTimeToMinutes("00:00")).toBe(0);
    });

    it("parses noon", () => {
      expect(parseTimeToMinutes("12:00")).toBe(720);
    });

    it("parses 23:59", () => {
      expect(parseTimeToMinutes("23:59")).toBe(1439);
    });

    it("parses 7:30", () => {
      expect(parseTimeToMinutes("7:30")).toBe(450);
    });

    it("parses 22:00", () => {
      expect(parseTimeToMinutes("22:00")).toBe(1320);
    });
  });

  // ── isWithinQuietWindow ───────────────────────────────────────────

  describe("isWithinQuietWindow", () => {
    it("detects time within same-day range", () => {
      // 14:00 → 16:00, current is 15:00
      expect(isWithinQuietWindow(900, 840, 960)).toBe(true);
    });

    it("detects time outside same-day range", () => {
      // 14:00 → 16:00, current is 17:00
      expect(isWithinQuietWindow(1020, 840, 960)).toBe(false);
    });

    it("detects time within overnight range (before midnight)", () => {
      // 22:00 → 07:00, current is 23:00
      expect(isWithinQuietWindow(1380, 1320, 420)).toBe(true);
    });

    it("detects time within overnight range (after midnight)", () => {
      // 22:00 → 07:00, current is 03:00
      expect(isWithinQuietWindow(180, 1320, 420)).toBe(true);
    });

    it("detects time outside overnight range", () => {
      // 22:00 → 07:00, current is 12:00
      expect(isWithinQuietWindow(720, 1320, 420)).toBe(false);
    });

    it("exact start time is within the window", () => {
      expect(isWithinQuietWindow(840, 840, 960)).toBe(true);
    });

    it("exact end time is NOT within the window", () => {
      expect(isWithinQuietWindow(960, 840, 960)).toBe(false);
    });
  });

  // ── isQuietHoursActive ────────────────────────────────────────────

  describe("isQuietHoursActive", () => {
    it("returns false when no quiet hours configured", () => {
      expect(
        isQuietHoursActive(null, null, "UTC", false, "medium"),
      ).toBe(false);
    });

    it("returns false when only start is set", () => {
      expect(
        isQuietHoursActive("22:00", null, "UTC", false, "medium"),
      ).toBe(false);
    });

    it("returns false when only end is set", () => {
      expect(
        isQuietHoursActive(null, "07:00", "UTC", false, "medium"),
      ).toBe(false);
    });

    it("urgent tasks bypass quiet hours when override enabled", () => {
      expect(
        isQuietHoursActive(
          "00:00",
          "23:59",
          "UTC",
          true,
          "urgent",
        ),
      ).toBe(false);
    });

    it("urgent tasks respect quiet hours when override disabled", () => {
      // With a window that covers all day, should return true
      const result = isQuietHoursActive(
        "00:00",
        "23:59",
        "UTC",
        false,
        "urgent",
      );
      expect(result).toBe(true);
    });

    it("non-urgent tasks do NOT bypass quiet hours even with override", () => {
      const result = isQuietHoursActive(
        "00:00",
        "23:59",
        "UTC",
        true,
        "medium",
      );
      expect(result).toBe(true);
    });
  });
});
