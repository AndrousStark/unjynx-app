// ============================================================
// UNJYNX Dev Portal - Formatting Utilities
// ============================================================

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";

dayjs.extend(relativeTime);
dayjs.extend(duration);

/**
 * Format a number with locale-aware thousand separators.
 */
export const formatNumber = (value: number): string =>
  new Intl.NumberFormat("en-US").format(value);

/**
 * Format a number as a percentage string.
 */
export const formatPercent = (value: number, decimals = 1): string =>
  `${value.toFixed(decimals)}%`;

/**
 * Format bytes into human-readable size.
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val < 10 ? 2 : 1)} ${units[i]}`;
};

/**
 * Format a duration in milliseconds into human-readable form.
 */
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const d = dayjs.duration(ms);
  if (ms < 3_600_000) return `${d.minutes()}m ${d.seconds()}s`;
  return `${d.hours()}h ${d.minutes()}m`;
};

/**
 * Format an uptime percentage with color class.
 */
export const formatUptime = (percent: number): string =>
  `${percent.toFixed(3)}%`;

/**
 * Format a timestamp as relative time (e.g., "2 minutes ago").
 */
export const formatRelativeTime = (timestamp: string): string =>
  dayjs(timestamp).fromNow();

/**
 * Format a timestamp in standard display format.
 */
export const formatTimestamp = (timestamp: string): string =>
  dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss");

/**
 * Format a short date (no time).
 */
export const formatDate = (timestamp: string): string =>
  dayjs(timestamp).format("YYYY-MM-DD");

/**
 * Format currency value.
 */
export const formatCurrency = (
  amount: number,
  currency = "USD"
): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);

/**
 * Format a rate (requests per second).
 */
export const formatRate = (value: number, unit = "req/s"): string =>
  `${value.toFixed(1)} ${unit}`;

/**
 * Determine status color based on thresholds.
 */
export const getStatusColor = (
  status: string
): "success" | "warning" | "error" | "default" => {
  switch (status) {
    case "healthy":
    case "active":
    case "running":
    case "completed":
    case "success":
    case "succeeded":
    case "applied":
    case "approved":
    case "compliant":
    case "passed":
    case "configured":
      return "success";
    case "degraded":
    case "deploying":
    case "pending":
    case "in_progress":
    case "testing":
    case "scheduled":
    case "idle":
    case "expired":
    case "rolling_back":
      return "warning";
    case "down":
    case "error":
    case "failed":
    case "revoked":
    case "rejected":
    case "non_compliant":
    case "failing":
    case "stopped":
    case "critical":
    case "missing":
      return "error";
    default:
      return "default";
  }
};

/**
 * Mask a secret value, showing only first and last 4 chars.
 */
export const maskSecret = (value: string): string => {
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}${"*".repeat(value.length - 8)}${value.slice(-4)}`;
};

/**
 * Truncate a string with ellipsis.
 */
export const truncate = (str: string, maxLen = 50): string =>
  str.length <= maxLen ? str : `${str.slice(0, maxLen)}...`;

/**
 * Format a cron expression into human-readable text.
 */
export const formatCron = (cron: string): string => {
  const parts = cron.split(" ");
  if (parts.length < 5) return cron;
  if (cron === "* * * * *") return "Every minute";
  if (cron === "*/5 * * * *") return "Every 5 minutes";
  if (cron === "*/15 * * * *") return "Every 15 minutes";
  if (cron === "0 * * * *") return "Every hour";
  if (/^0 \*\/(\d+) \* \* \*$/.test(cron)) {
    const hours = cron.match(/\*\/(\d+)/)?.[1];
    return `Every ${hours} hours`;
  }
  if (cron === "0 0 * * *") return "Daily at midnight";
  if (/^0 (\d+) \* \* \*$/.test(cron)) {
    const hour = cron.match(/^0 (\d+)/)?.[1];
    return `Daily at ${hour}:00`;
  }
  if (/^0 (\d+) \* \* 0$/.test(cron)) {
    const hour = cron.match(/^0 (\d+)/)?.[1];
    return `Weekly (Sun ${hour}:00)`;
  }
  if (cron === "0 0 * * 0") return "Weekly (Sunday midnight)";
  return cron;
};
