import { describe, it, expect } from "vitest";
import {
  formatNumber,
  formatCurrency,
  formatPercentage,
  truncateText,
  capitalizeFirst,
  categoryLabel,
  planColor,
  statusColor,
  formatDate,
  formatDateTime,
} from "../utils/formatters";

describe("formatNumber", () => {
  it("should format numbers below 1000 with locale string", () => {
    expect(formatNumber(42)).toBe("42");
    expect(formatNumber(999)).toBe("999");
  });

  it("should format thousands with K suffix", () => {
    expect(formatNumber(1500)).toBe("1.5K");
    expect(formatNumber(10000)).toBe("10.0K");
    expect(formatNumber(999999)).toBe("1000.0K");
  });

  it("should format millions with M suffix", () => {
    expect(formatNumber(1000000)).toBe("1.0M");
    expect(formatNumber(2500000)).toBe("2.5M");
  });
});

describe("formatCurrency", () => {
  it("should format USD amounts", () => {
    const result = formatCurrency(8500);
    expect(result).toContain("8,500");
  });

  it("should format zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });

  it("should support custom currency", () => {
    const result = formatCurrency(149, "INR");
    expect(result).toBeDefined();
  });
});

describe("formatPercentage", () => {
  it("should format percentage with default decimals", () => {
    expect(formatPercentage(98.5)).toBe("98.5%");
    expect(formatPercentage(100)).toBe("100.0%");
  });

  it("should format with custom decimals", () => {
    expect(formatPercentage(98.567, 2)).toBe("98.57%");
    expect(formatPercentage(50, 0)).toBe("50%");
  });
});

describe("truncateText", () => {
  it("should return text unchanged if shorter than max", () => {
    expect(truncateText("Hello", 80)).toBe("Hello");
  });

  it("should truncate with ellipsis", () => {
    const long = "A".repeat(100);
    const result = truncateText(long, 50);
    expect(result).toHaveLength(53); // 50 + "..."
    expect(result.endsWith("...")).toBe(true);
  });

  it("should use default maxLength of 80", () => {
    const short = "Hello World";
    expect(truncateText(short)).toBe(short);
  });
});

describe("capitalizeFirst", () => {
  it("should capitalize first letter", () => {
    expect(capitalizeFirst("hello")).toBe("Hello");
    expect(capitalizeFirst("world")).toBe("World");
  });

  it("should handle already capitalized", () => {
    expect(capitalizeFirst("Hello")).toBe("Hello");
  });

  it("should handle empty string", () => {
    expect(capitalizeFirst("")).toBe("");
  });
});

describe("categoryLabel", () => {
  it("should convert snake_case to Title Case", () => {
    expect(categoryLabel("stoic_wisdom")).toBe("Stoic Wisdom");
    expect(categoryLabel("growth_mindset")).toBe("Growth Mindset");
    expect(categoryLabel("dark_humor")).toBe("Dark Humor");
  });

  it("should handle single word", () => {
    expect(categoryLabel("anime")).toBe("Anime");
  });

  it("should handle multi-word categories", () => {
    expect(categoryLabel("warrior_discipline")).toBe("Warrior Discipline");
    expect(categoryLabel("productivity_hacks")).toBe("Productivity Hacks");
  });
});

describe("planColor", () => {
  it("should return correct color for each plan", () => {
    expect(planColor("free")).toBe("default");
    expect(planColor("pro")).toBe("blue");
    expect(planColor("team")).toBe("purple");
    expect(planColor("enterprise")).toBe("gold");
  });

  it("should return default for unknown plan", () => {
    expect(planColor("unknown")).toBe("default");
  });
});

describe("statusColor", () => {
  it("should return success for active statuses", () => {
    expect(statusColor("active")).toBe("success");
    expect(statusColor("healthy")).toBe("success");
    expect(statusColor("enabled")).toBe("success");
    expect(statusColor("published")).toBe("success");
  });

  it("should return warning for warning statuses", () => {
    expect(statusColor("degraded")).toBe("warning");
    expect(statusColor("suspended")).toBe("warning");
    expect(statusColor("past_due")).toBe("warning");
  });

  it("should return error for error statuses", () => {
    expect(statusColor("banned")).toBe("error");
    expect(statusColor("down")).toBe("error");
    expect(statusColor("failed")).toBe("error");
  });

  it("should return default for unknown status", () => {
    expect(statusColor("mystery")).toBe("default");
  });
});

describe("formatDate", () => {
  it("should format ISO date string", () => {
    const result = formatDate("2026-03-11T08:30:00Z");
    expect(result).toContain("Mar");
    expect(result).toContain("2026");
  });
});

describe("formatDateTime", () => {
  it("should include time in formatted output", () => {
    const result = formatDateTime("2026-03-11T08:30:00Z");
    expect(result).toContain("Mar");
    expect(result).toContain("2026");
  });
});
