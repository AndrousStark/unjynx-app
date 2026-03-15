// ============================================================
// UNJYNX Dev Portal - Formatters Tests
// ============================================================

import { describe, it, expect } from "vitest";
import {
  formatNumber,
  formatPercent,
  formatBytes,
  formatDuration,
  formatUptime,
  formatCurrency,
  formatRate,
  getStatusColor,
  maskSecret,
  truncate,
  formatCron,
} from "@/utils/formatters";

describe("formatNumber", () => {
  it("formats integers with thousand separators", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("handles zero", () => {
    expect(formatNumber(0)).toBe("0");
  });
});

describe("formatPercent", () => {
  it("formats with default decimal places", () => {
    expect(formatPercent(99.123)).toBe("99.1%");
  });

  it("formats with custom decimal places", () => {
    expect(formatPercent(99.123, 2)).toBe("99.12%");
    expect(formatPercent(50, 0)).toBe("50%");
  });
});

describe("formatBytes", () => {
  it("formats zero bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1.00 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1048576)).toBe("1.00 MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(1073741824)).toBe("1.00 GB");
  });
});

describe("formatDuration", () => {
  it("formats milliseconds", () => {
    expect(formatDuration(500)).toBe("500ms");
  });

  it("formats seconds", () => {
    expect(formatDuration(1500)).toBe("1.5s");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(90000)).toBe("1m 30s");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(3660000)).toBe("1h 1m");
  });
});

describe("formatUptime", () => {
  it("formats uptime with 3 decimal places", () => {
    expect(formatUptime(99.987)).toBe("99.987%");
    expect(formatUptime(100)).toBe("100.000%");
  });
});

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    const result = formatCurrency(12.5);
    expect(result).toContain("12.50");
  });

  it("includes currency symbol", () => {
    const result = formatCurrency(100, "USD");
    expect(result).toContain("$");
  });
});

describe("formatRate", () => {
  it("formats with default unit", () => {
    expect(formatRate(142.3)).toBe("142.3 req/s");
  });

  it("formats with custom unit", () => {
    expect(formatRate(8.5, "msg/s")).toBe("8.5 msg/s");
  });
});

describe("getStatusColor", () => {
  it("returns success for healthy statuses", () => {
    expect(getStatusColor("healthy")).toBe("success");
    expect(getStatusColor("active")).toBe("success");
    expect(getStatusColor("running")).toBe("success");
    expect(getStatusColor("completed")).toBe("success");
    expect(getStatusColor("approved")).toBe("success");
    expect(getStatusColor("compliant")).toBe("success");
  });

  it("returns warning for degraded statuses", () => {
    expect(getStatusColor("degraded")).toBe("warning");
    expect(getStatusColor("pending")).toBe("warning");
    expect(getStatusColor("deploying")).toBe("warning");
  });

  it("returns error for critical statuses", () => {
    expect(getStatusColor("down")).toBe("error");
    expect(getStatusColor("failed")).toBe("error");
    expect(getStatusColor("critical")).toBe("error");
    expect(getStatusColor("non_compliant")).toBe("error");
  });

  it("returns default for unknown statuses", () => {
    expect(getStatusColor("something_else")).toBe("default");
  });
});

describe("maskSecret", () => {
  it("masks short secrets completely", () => {
    expect(maskSecret("abc123")).toBe("********");
  });

  it("shows first and last 4 chars for longer secrets", () => {
    const result = maskSecret("sk_live_abc123def456ghi789");
    expect(result.startsWith("sk_l")).toBe(true);
    expect(result.endsWith("i789")).toBe(true);
    expect(result).toContain("*");
  });
});

describe("truncate", () => {
  it("returns short strings unchanged", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates long strings with ellipsis", () => {
    expect(truncate("a very long string that should be cut", 10)).toBe("a very lon...");
  });
});

describe("formatCron", () => {
  it("formats common cron expressions", () => {
    expect(formatCron("* * * * *")).toBe("Every minute");
    expect(formatCron("*/5 * * * *")).toBe("Every 5 minutes");
    expect(formatCron("0 * * * *")).toBe("Every hour");
    expect(formatCron("0 0 * * *")).toBe("Daily at midnight");
    expect(formatCron("0 0 * * 0")).toBe("Weekly (Sunday midnight)");
  });

  it("returns raw cron for unknown patterns", () => {
    expect(formatCron("30 4 * * 1-5")).toBe("30 4 * * 1-5");
  });
});
