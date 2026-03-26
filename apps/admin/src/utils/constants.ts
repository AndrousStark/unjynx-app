// ── API ──────────────────────────────────────────────────────────────
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";
export const API_ADMIN_PREFIX = "/api/v1/admin";

// ── Brand Colors ─────────────────────────────────────────────────────
export const BRAND_COLORS = {
  midnight: "#0F0A1A",
  gold: "#FFD700",
  violet: "#6C5CE7",
  lightBg: "#F8F5FF",
  white: "#FFFFFF",
  success: "#52C41A",
  warning: "#FAAD14",
  error: "#FF4D4F",
  info: "#1890FF",
} as const;

export const CHART_COLORS = [
  BRAND_COLORS.violet,
  BRAND_COLORS.gold,
  "#A29BFE",
  "#FDCB6E",
  "#00CEC9",
  "#E17055",
  "#74B9FF",
  "#FD79A8",
] as const;

// ── Content Categories ───────────────────────────────────────────────
export const CONTENT_CATEGORIES = [
  { value: "stoic_wisdom", label: "Stoic Wisdom" },
  { value: "ancient_indian", label: "Ancient Indian" },
  { value: "growth_mindset", label: "Growth Mindset" },
  { value: "dark_humor", label: "Dark Humor" },
  { value: "anime", label: "Anime" },
  { value: "gratitude", label: "Gratitude" },
  { value: "warrior_discipline", label: "Warrior Discipline" },
  { value: "poetry", label: "Poetry" },
  { value: "productivity_hacks", label: "Productivity Hacks" },
  { value: "comeback_stories", label: "Comeback Stories" },
] as const;

// ── Plans ────────────────────────────────────────────────────────────
export const PLAN_OPTIONS = [
  { value: "free", label: "Free", color: "default" },
  { value: "pro", label: "Pro", color: "blue" },
  { value: "team", label: "Team", color: "purple" },
  { value: "enterprise", label: "Enterprise", color: "gold" },
] as const;

// ── Notification Channels ────────────────────────────────────────────
export const CHANNEL_OPTIONS = [
  { value: "push", label: "Push", icon: "BellOutlined" },
  { value: "whatsapp", label: "WhatsApp", icon: "WhatsAppOutlined" },
  { value: "telegram", label: "Telegram", icon: "SendOutlined" },
  { value: "email", label: "Email", icon: "MailOutlined" },
  { value: "sms", label: "SMS", icon: "MessageOutlined" },
  { value: "instagram", label: "Instagram", icon: "InstagramOutlined" },
  { value: "slack", label: "Slack", icon: "SlackOutlined" },
  { value: "discord", label: "Discord", icon: "CommentOutlined" },
] as const;

// ── Feature Flag Types ───────────────────────────────────────────────
export const FLAG_TYPES = [
  { value: "release", label: "Release", color: "blue" },
  { value: "experiment", label: "Experiment", color: "green" },
  { value: "ops", label: "Ops (Kill Switch)", color: "red" },
  { value: "permission", label: "Permission", color: "purple" },
] as const;

// ── Admin Roles ─────────────────────────────────────────────────────
export const ADMIN_ROLE_OPTIONS = [
  { value: "owner", label: "Owner", color: "gold" },
  { value: "admin", label: "Admin", color: "purple" },
  { value: "member", label: "Member", color: "blue" },
  { value: "viewer", label: "Viewer", color: "default" },
  { value: "guest", label: "Guest", color: "default" },
] as const;

// ── Task Priorities ─────────────────────────────────────────────────
export const TASK_PRIORITY_OPTIONS = [
  { value: "none", label: "None", color: "default" },
  { value: "low", label: "Low", color: "blue" },
  { value: "medium", label: "Medium", color: "orange" },
  { value: "high", label: "High", color: "red" },
  { value: "urgent", label: "Urgent", color: "magenta" },
] as const;

// ── Timezones ───────────────────────────────────────────────────────
export const TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "America/New_York", label: "US Eastern" },
  { value: "America/Los_Angeles", label: "US Pacific" },
  { value: "Europe/London", label: "UK (GMT)" },
  { value: "Europe/Berlin", label: "Central Europe" },
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "Asia/Dubai", label: "UAE (GST)" },
  { value: "Australia/Sydney", label: "Australia (AEST)" },
] as const;

// ── Logto OIDC ───────────────────────────────────────────────────────
export const LOGTO_ENDPOINT =
  import.meta.env.VITE_LOGTO_ENDPOINT ?? "http://localhost:3001";
export const LOGTO_APP_ID =
  import.meta.env.VITE_LOGTO_APP_ID ?? "unjynx-admin-web";

const basePath = import.meta.env.BASE_URL ?? "/admin/";
const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3001";
export const LOGTO_REDIRECT_URI =
  import.meta.env.VITE_LOGTO_REDIRECT_URI ?? `${origin}${basePath}callback`;

// oidc-client-ts config (used by UserManager)
export const LOGTO_CONFIG = {
  authority: `${LOGTO_ENDPOINT}/oidc`,
  clientId: LOGTO_APP_ID,
  redirectUri: LOGTO_REDIRECT_URI,
  postLogoutRedirectUri: `${origin}${basePath}`,
  scopes: ["openid", "profile", "email"],
  // API resource — must be registered in Logto admin console.
  // Without this, Logto issues an opaque token (not JWT) and the
  // backend auth middleware will reject it with 401.
  resource: import.meta.env.VITE_LOGTO_API_RESOURCE ?? "https://api.unjynx.me",
} as const;

// ── Sidebar Menu Keys ────────────────────────────────────────────────
export const MENU_KEYS = {
  DASHBOARD: "dashboard",
  USERS: "users",
  CONTENT: "content",
  NOTIFICATIONS: "notifications",
  FLAGS: "feature-flags",
  ANALYTICS: "analytics",
  SUPPORT: "support",
  BILLING: "billing",
  COMPLIANCE: "compliance",
} as const;
