import { describe, it, expect } from "vitest";
import {
  contentTodayQuerySchema,
  saveContentSchema,
  updatePrefsSchema,
  logRitualSchema,
  ritualHistorySchema,
} from "../content.schema.js";

describe("Content Schemas", () => {
  // ── contentTodayQuerySchema ─────────────────────────────────────────

  describe("contentTodayQuerySchema", () => {
    it("accepts empty object (no category)", () => {
      const result = contentTodayQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBeUndefined();
      }
    });

    it("accepts a valid category", () => {
      const validCategories = [
        "stoic_wisdom",
        "ancient_indian",
        "growth_mindset",
        "dark_humor",
        "anime",
        "gratitude",
        "warrior_discipline",
        "poetry",
        "productivity_hacks",
        "comeback_stories",
      ] as const;

      for (const category of validCategories) {
        const result = contentTodayQuerySchema.safeParse({ category });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.category).toBe(category);
        }
      }
    });

    it("rejects an invalid category", () => {
      const result = contentTodayQuerySchema.safeParse({
        category: "invalid_category",
      });
      expect(result.success).toBe(false);
    });
  });

  // ── saveContentSchema ───────────────────────────────────────────────

  describe("saveContentSchema", () => {
    it("accepts a valid UUID", () => {
      const result = saveContentSchema.safeParse({
        contentId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contentId).toBe(
          "550e8400-e29b-41d4-a716-446655440000",
        );
      }
    });

    it("rejects a non-UUID string", () => {
      const result = saveContentSchema.safeParse({
        contentId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects an empty object", () => {
      const result = saveContentSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects an empty string", () => {
      const result = saveContentSchema.safeParse({ contentId: "" });
      expect(result.success).toBe(false);
    });
  });

  // ── updatePrefsSchema ───────────────────────────────────────────────

  describe("updatePrefsSchema", () => {
    it("accepts valid categories with delivery time", () => {
      const result = updatePrefsSchema.safeParse({
        categories: ["stoic_wisdom", "anime"],
        deliveryTime: "08:30",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.categories).toEqual(["stoic_wisdom", "anime"]);
        expect(result.data.deliveryTime).toBe("08:30");
      }
    });

    it("accepts categories without deliveryTime (optional)", () => {
      const result = updatePrefsSchema.safeParse({
        categories: ["gratitude"],
      });
      expect(result.success).toBe(true);
    });

    it("applies default deliveryTime of 07:00 when provided explicitly", () => {
      // When deliveryTime is not provided at all, it's undefined (optional)
      // When it needs a default, the schema defaults to "07:00"
      const result = updatePrefsSchema.safeParse({
        categories: ["poetry"],
        deliveryTime: undefined,
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty categories array", () => {
      const result = updatePrefsSchema.safeParse({
        categories: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects more than 10 categories", () => {
      const result = updatePrefsSchema.safeParse({
        categories: [
          "stoic_wisdom",
          "ancient_indian",
          "growth_mindset",
          "dark_humor",
          "anime",
          "gratitude",
          "warrior_discipline",
          "poetry",
          "productivity_hacks",
          "comeback_stories",
          "stoic_wisdom", // 11th
        ],
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid time format 25:00", () => {
      const result = updatePrefsSchema.safeParse({
        categories: ["anime"],
        deliveryTime: "25:00",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid time format 7:00 (missing leading zero)", () => {
      const result = updatePrefsSchema.safeParse({
        categories: ["anime"],
        deliveryTime: "7:00",
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-time string 'abc'", () => {
      const result = updatePrefsSchema.safeParse({
        categories: ["anime"],
        deliveryTime: "abc",
      });
      expect(result.success).toBe(false);
    });

    it("accepts boundary time values", () => {
      const validTimes = ["00:00", "23:59", "12:30", "07:00"];
      for (const deliveryTime of validTimes) {
        const result = updatePrefsSchema.safeParse({
          categories: ["poetry"],
          deliveryTime,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid categories within the array", () => {
      const result = updatePrefsSchema.safeParse({
        categories: ["stoic_wisdom", "invalid_cat"],
      });
      expect(result.success).toBe(false);
    });
  });

  // ── logRitualSchema ─────────────────────────────────────────────────

  describe("logRitualSchema", () => {
    it("accepts morning ritual type", () => {
      const result = logRitualSchema.safeParse({ ritualType: "morning" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ritualType).toBe("morning");
      }
    });

    it("accepts evening ritual type", () => {
      const result = logRitualSchema.safeParse({ ritualType: "evening" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ritualType).toBe("evening");
      }
    });

    it("rejects invalid ritual type", () => {
      const result = logRitualSchema.safeParse({ ritualType: "afternoon" });
      expect(result.success).toBe(false);
    });

    it("accepts mood at minimum boundary (1)", () => {
      const result = logRitualSchema.safeParse({
        ritualType: "morning",
        mood: 1,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mood).toBe(1);
      }
    });

    it("accepts mood at maximum boundary (5)", () => {
      const result = logRitualSchema.safeParse({
        ritualType: "morning",
        mood: 5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mood).toBe(5);
      }
    });

    it("rejects mood below minimum (0)", () => {
      const result = logRitualSchema.safeParse({
        ritualType: "morning",
        mood: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects mood above maximum (6)", () => {
      const result = logRitualSchema.safeParse({
        ritualType: "morning",
        mood: 6,
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer mood", () => {
      const result = logRitualSchema.safeParse({
        ritualType: "morning",
        mood: 3.5,
      });
      expect(result.success).toBe(false);
    });

    it("accepts all optional fields together", () => {
      const result = logRitualSchema.safeParse({
        ritualType: "evening",
        mood: 4,
        gratitude: "Grateful for a productive day",
        intention: "Rest well tonight",
        reflection: "I accomplished my top 3 goals",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.gratitude).toBe("Grateful for a productive day");
        expect(result.data.intention).toBe("Rest well tonight");
        expect(result.data.reflection).toBe(
          "I accomplished my top 3 goals",
        );
      }
    });

    it("rejects gratitude exceeding 2000 characters", () => {
      const result = logRitualSchema.safeParse({
        ritualType: "morning",
        gratitude: "x".repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it("rejects intention exceeding 2000 characters", () => {
      const result = logRitualSchema.safeParse({
        ritualType: "morning",
        intention: "x".repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it("rejects reflection exceeding 2000 characters", () => {
      const result = logRitualSchema.safeParse({
        ritualType: "morning",
        reflection: "x".repeat(2001),
      });
      expect(result.success).toBe(false);
    });

    it("accepts gratitude at exactly 2000 characters", () => {
      const result = logRitualSchema.safeParse({
        ritualType: "morning",
        gratitude: "x".repeat(2000),
      });
      expect(result.success).toBe(true);
    });
  });

  // ── ritualHistorySchema ─────────────────────────────────────────────

  describe("ritualHistorySchema", () => {
    it("provides default page=1 and limit=20", () => {
      const result = ritualHistorySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("rejects page 0 (must be positive)", () => {
      const result = ritualHistorySchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it("rejects negative page", () => {
      const result = ritualHistorySchema.safeParse({ page: -1 });
      expect(result.success).toBe(false);
    });

    it("rejects limit greater than 100", () => {
      const result = ritualHistorySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });

    it("rejects limit of 0", () => {
      const result = ritualHistorySchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
    });

    it("coerces string numbers to integers", () => {
      const result = ritualHistorySchema.safeParse({
        page: "3",
        limit: "50",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(50);
      }
    });

    it("accepts valid page and limit", () => {
      const result = ritualHistorySchema.safeParse({ page: 5, limit: 100 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.limit).toBe(100);
      }
    });
  });
});
