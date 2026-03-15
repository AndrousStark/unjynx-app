import { describe, it, expect } from "vitest";
import {
  BRAND_COLORS,
  CHART_COLORS,
  CONTENT_CATEGORIES,
  PLAN_OPTIONS,
  CHANNEL_OPTIONS,
  FLAG_TYPES,
  API_ADMIN_PREFIX,
} from "../utils/constants";

describe("BRAND_COLORS", () => {
  it("should have all required brand colors", () => {
    expect(BRAND_COLORS.midnight).toBe("#0F0A1A");
    expect(BRAND_COLORS.gold).toBe("#FFD700");
    expect(BRAND_COLORS.violet).toBe("#6C5CE7");
    expect(BRAND_COLORS.lightBg).toBe("#F8F5FF");
    expect(BRAND_COLORS.white).toBe("#FFFFFF");
  });

  it("should have status colors", () => {
    expect(BRAND_COLORS.success).toBeDefined();
    expect(BRAND_COLORS.warning).toBeDefined();
    expect(BRAND_COLORS.error).toBeDefined();
    expect(BRAND_COLORS.info).toBeDefined();
  });
});

describe("CHART_COLORS", () => {
  it("should have at least 8 chart colors", () => {
    expect(CHART_COLORS.length).toBeGreaterThanOrEqual(8);
  });

  it("should start with brand violet", () => {
    expect(CHART_COLORS[0]).toBe(BRAND_COLORS.violet);
  });
});

describe("CONTENT_CATEGORIES", () => {
  it("should have 10 categories", () => {
    expect(CONTENT_CATEGORIES).toHaveLength(10);
  });

  it("should have value and label for each category", () => {
    for (const cat of CONTENT_CATEGORIES) {
      expect(cat.value).toBeDefined();
      expect(cat.label).toBeDefined();
      expect(cat.value.length).toBeGreaterThan(0);
      expect(cat.label.length).toBeGreaterThan(0);
    }
  });

  it("should include stoic_wisdom category", () => {
    const stoic = CONTENT_CATEGORIES.find((c) => c.value === "stoic_wisdom");
    expect(stoic).toBeDefined();
    expect(stoic?.label).toBe("Stoic Wisdom");
  });
});

describe("PLAN_OPTIONS", () => {
  it("should have 4 plans", () => {
    expect(PLAN_OPTIONS).toHaveLength(4);
  });

  it("should include free, pro, team, enterprise", () => {
    const values = PLAN_OPTIONS.map((p) => p.value);
    expect(values).toContain("free");
    expect(values).toContain("pro");
    expect(values).toContain("team");
    expect(values).toContain("enterprise");
  });
});

describe("CHANNEL_OPTIONS", () => {
  it("should have 8 notification channels", () => {
    expect(CHANNEL_OPTIONS).toHaveLength(8);
  });

  it("should include all required channels", () => {
    const values = CHANNEL_OPTIONS.map((c) => c.value);
    expect(values).toContain("push");
    expect(values).toContain("whatsapp");
    expect(values).toContain("telegram");
    expect(values).toContain("email");
    expect(values).toContain("sms");
    expect(values).toContain("instagram");
    expect(values).toContain("slack");
    expect(values).toContain("discord");
  });
});

describe("FLAG_TYPES", () => {
  it("should have 4 flag types", () => {
    expect(FLAG_TYPES).toHaveLength(4);
  });

  it("should include all flag types", () => {
    const values = FLAG_TYPES.map((f) => f.value);
    expect(values).toContain("release");
    expect(values).toContain("experiment");
    expect(values).toContain("ops");
    expect(values).toContain("permission");
  });
});

describe("API_ADMIN_PREFIX", () => {
  it("should match expected prefix", () => {
    expect(API_ADMIN_PREFIX).toBe("/api/v1/admin");
  });
});
