import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function formatDate(date: string | Date): string {
  return dayjs(date).format("MMM D, YYYY");
}

export function formatDateTime(date: string | Date): string {
  return dayjs(date).format("MMM D, YYYY h:mm A");
}

export function formatRelativeTime(date: string | Date): string {
  return dayjs(date).fromNow();
}

export function formatCurrency(
  amount: number,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function truncateText(text: string, maxLength: number = 80): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function categoryLabel(category: string): string {
  return category
    .split("_")
    .map(capitalizeFirst)
    .join(" ");
}

export function planColor(
  plan: string,
): "default" | "blue" | "purple" | "gold" {
  const colorMap: Record<string, "default" | "blue" | "purple" | "gold"> = {
    free: "default",
    pro: "blue",
    team: "purple",
    enterprise: "gold",
  };
  return colorMap[plan] ?? "default";
}

export function adminRoleColor(role: string): string {
  switch (role) {
    case "super_admin": return "gold";
    case "dev_admin": return "purple";
    default: return "default";
  }
}

export function adminRoleLabel(role: string): string {
  switch (role) {
    case "super_admin": return "Super Admin";
    case "dev_admin": return "Dev Admin";
    default: return "App User";
  }
}

export function priorityColor(priority: string): string {
  switch (priority) {
    case "low": return "blue";
    case "medium": return "orange";
    case "high": return "red";
    case "urgent": return "magenta";
    default: return "default";
  }
}

export function statusColor(
  status: string,
): "success" | "warning" | "error" | "processing" | "default" {
  const colorMap: Record<
    string,
    "success" | "warning" | "error" | "processing" | "default"
  > = {
    active: "success",
    healthy: "success",
    enabled: "success",
    published: "success",
    approved: "success",
    trialing: "processing",
    pending: "processing",
    scheduled: "processing",
    degraded: "warning",
    percentage: "warning",
    draft: "default",
    disabled: "default",
    suspended: "warning",
    past_due: "warning",
    banned: "error",
    down: "error",
    failed: "error",
    cancelled: "error",
  };
  return colorMap[status] ?? "default";
}
