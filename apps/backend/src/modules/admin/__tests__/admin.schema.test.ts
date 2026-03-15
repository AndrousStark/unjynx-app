import { describe, it, expect } from "vitest";
import {
  userListQuerySchema,
  updateUserSchema,
  createContentSchema,
  updateContentSchema,
  contentListQuerySchema,
  bulkImportContentSchema,
  createFeatureFlagSchema,
  updateFeatureFlagSchema,
  auditLogQuerySchema,
  analyticsQuerySchema,
  broadcastSchema,
} from "../admin.schema.js";

describe("Admin Schemas", () => {
  describe("userListQuerySchema", () => {
    it("uses defaults", () => {
      const result = userListQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.search).toBeUndefined();
    });

    it("accepts search parameter", () => {
      const result = userListQuerySchema.parse({ search: "john" });
      expect(result.search).toBe("john");
    });

    it("rejects search > 200 chars", () => {
      const result = userListQuerySchema.safeParse({ search: "A".repeat(201) });
      expect(result.success).toBe(false);
    });
  });

  describe("updateUserSchema", () => {
    it("accepts partial updates", () => {
      const result = updateUserSchema.safeParse({ name: "New Name" });
      expect(result.success).toBe(true);
    });

    it("accepts isBanned flag", () => {
      const result = updateUserSchema.safeParse({ isBanned: true });
      expect(result.success).toBe(true);
    });

    it("accepts plan override", () => {
      for (const plan of ["free", "pro", "team", "enterprise"]) {
        const result = updateUserSchema.safeParse({ planOverride: plan });
        expect(result.success).toBe(true);
      }
    });

    it("accepts empty object", () => {
      const result = updateUserSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("createContentSchema", () => {
    it("validates valid content", () => {
      const result = createContentSchema.safeParse({
        category: "stoic_wisdom",
        content: "The obstacle is the way.",
        author: "Marcus Aurelius",
      });
      expect(result.success).toBe(true);
    });

    it("accepts all categories", () => {
      const categories = [
        "stoic_wisdom", "ancient_indian", "growth_mindset",
        "dark_humor", "anime", "gratitude", "warrior_discipline",
        "poetry", "productivity_hacks", "comeback_stories",
      ];
      for (const category of categories) {
        const result = createContentSchema.safeParse({
          category,
          content: "Test content",
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects empty content", () => {
      const result = createContentSchema.safeParse({
        category: "stoic_wisdom",
        content: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid category", () => {
      const result = createContentSchema.safeParse({
        category: "invalid",
        content: "Test",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateContentSchema", () => {
    it("accepts partial updates", () => {
      const result = updateContentSchema.safeParse({
        content: "Updated content",
      });
      expect(result.success).toBe(true);
    });

    it("accepts isActive toggle", () => {
      const result = updateContentSchema.safeParse({ isActive: false });
      expect(result.success).toBe(true);
    });
  });

  describe("contentListQuerySchema", () => {
    it("uses defaults", () => {
      const result = contentListQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("accepts category filter", () => {
      const result = contentListQuerySchema.parse({ category: "anime" });
      expect(result.category).toBe("anime");
    });
  });

  describe("bulkImportContentSchema", () => {
    it("validates array of content items", () => {
      const result = bulkImportContentSchema.safeParse({
        items: [
          { category: "stoic_wisdom", content: "Quote 1" },
          { category: "anime", content: "Quote 2" },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty items array", () => {
      const result = bulkImportContentSchema.safeParse({ items: [] });
      expect(result.success).toBe(false);
    });

    it("rejects > 500 items", () => {
      const items = Array.from({ length: 501 }, () => ({
        category: "stoic_wisdom",
        content: "Quote",
      }));
      const result = bulkImportContentSchema.safeParse({ items });
      expect(result.success).toBe(false);
    });
  });

  describe("createFeatureFlagSchema", () => {
    it("validates valid feature flag", () => {
      const result = createFeatureFlagSchema.safeParse({
        key: "dark_mode_v2",
        name: "Dark Mode V2",
      });
      expect(result.success).toBe(true);
    });

    it("defaults status to disabled", () => {
      const result = createFeatureFlagSchema.parse({
        key: "test",
        name: "Test",
      });
      expect(result.status).toBe("disabled");
      expect(result.percentage).toBe(0);
    });

    it("accepts all status values", () => {
      for (const status of ["enabled", "disabled", "percentage", "user_list"]) {
        const result = createFeatureFlagSchema.safeParse({
          key: "test",
          name: "Test",
          status,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("auditLogQuerySchema", () => {
    it("uses defaults", () => {
      const result = auditLogQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("accepts filters", () => {
      const result = auditLogQuerySchema.parse({
        action: "user.update",
        userId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.action).toBe("user.update");
    });
  });

  describe("analyticsQuerySchema", () => {
    it("defaults to month", () => {
      const result = analyticsQuerySchema.parse({});
      expect(result.period).toBe("month");
    });

    it("accepts all period values", () => {
      for (const period of ["day", "week", "month", "year"]) {
        const result = analyticsQuerySchema.safeParse({ period });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("broadcastSchema", () => {
    it("validates valid broadcast", () => {
      const result = broadcastSchema.safeParse({
        title: "System Update",
        body: "We have new features!",
      });
      expect(result.success).toBe(true);
    });

    it("defaults targetPlan to all", () => {
      const result = broadcastSchema.parse({
        title: "Test",
        body: "Content",
      });
      expect(result.targetPlan).toBe("all");
    });

    it("rejects empty title", () => {
      const result = broadcastSchema.safeParse({
        title: "",
        body: "Content",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty body", () => {
      const result = broadcastSchema.safeParse({
        title: "Title",
        body: "",
      });
      expect(result.success).toBe(false);
    });
  });
});
