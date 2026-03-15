// ============================================================
// UNJYNX Dev Portal - Constants
// ============================================================

// Brand Colors
export const COLORS = {
  midnight: "#0F0A1A",
  gold: "#FFD700",
  violet: "#6C5CE7",
  lightBg: "#F8F5FF",
  white: "#FFFFFF",
  textPrimary: "#1A0533",
  textSecondary: "#6B7280",

  // Status colors
  healthy: "#10B981",
  warning: "#F59E0B",
  critical: "#EF4444",
  info: "#3B82F6",
  unknown: "#9CA3AF",

  // Chart palette
  chartPrimary: "#6C5CE7",
  chartSecondary: "#FFD700",
  chartTertiary: "#10B981",
  chartQuaternary: "#F59E0B",
  chartQuinary: "#EF4444",
} as const;

// Ant Design theme token overrides
export const THEME_TOKEN = {
  colorPrimary: COLORS.violet,
  colorSuccess: COLORS.healthy,
  colorWarning: COLORS.warning,
  colorError: COLORS.critical,
  colorInfo: COLORS.info,
  colorBgBase: COLORS.midnight,
  colorTextBase: COLORS.white,
  borderRadius: 8,
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontFamilyCode: "'JetBrains Mono', 'Fira Code', monospace",
} as const;

// API Config
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";
export const API_PREFIX = "/api/v1/dev";

// Grafana Config
export const GRAFANA_BASE_URL =
  import.meta.env.VITE_GRAFANA_URL ?? "http://localhost:3100";

// Default Grafana dashboard UIDs
export const GRAFANA_DASHBOARDS = {
  systemOverview: "system-overview",
  apiMetrics: "api-metrics",
  databaseMetrics: "database-metrics",
  queueMetrics: "queue-metrics",
  cacheMetrics: "cache-metrics",
} as const;

// Logto OIDC Config
const logtoEndpoint = import.meta.env.VITE_LOGTO_ENDPOINT ?? "http://localhost:3001";
const basePath = import.meta.env.BASE_URL ?? "/dev/";
const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3002";

export const LOGTO_CONFIG = {
  authority: `${logtoEndpoint}/oidc`,
  clientId: import.meta.env.VITE_LOGTO_APP_ID ?? "unjynx-dev-portal",
  redirectUri: `${origin}${basePath}callback`,
  postLogoutRedirectUri: `${origin}${basePath}`,
  scopes: ["openid", "profile", "email", "roles"],
  // API resource — must be registered in Logto admin console.
  // Without this, Logto issues an opaque token (not JWT) and the
  // backend auth middleware will reject it with 401.
  resource: import.meta.env.VITE_LOGTO_API_RESOURCE ?? "https://api.unjynx.me",
} as const;

// Refresh intervals (ms)
export const REFRESH_INTERVALS = {
  realtime: 5_000,
  fast: 15_000,
  normal: 30_000,
  slow: 60_000,
} as const;

// Channel display info
export const CHANNEL_INFO: Record<
  string,
  { readonly label: string; readonly color: string; readonly provider: string }
> = {
  whatsapp: { label: "WhatsApp", color: "#25D366", provider: "Gupshup" },
  telegram: { label: "Telegram", color: "#0088CC", provider: "Bot API" },
  email: { label: "Email", color: "#EA4335", provider: "SendGrid" },
  sms: { label: "SMS", color: "#FF6B35", provider: "MSG91" },
  push: { label: "Push", color: "#4285F4", provider: "FCM" },
  instagram: { label: "Instagram", color: "#E1306C", provider: "Messenger API" },
  slack: { label: "Slack", color: "#4A154B", provider: "Slack Web API" },
  discord: { label: "Discord", color: "#5865F2", provider: "Discord Bot API" },
} as const;

// Navigation items
export const NAV_ITEMS = [
  { key: "/system-health", label: "System Health", icon: "dashboard" },
  { key: "/database", label: "Database", icon: "database" },
  { key: "/api-management", label: "API Management", icon: "api" },
  { key: "/deployment", label: "Deployment", icon: "cloud-server" },
  { key: "/notifications", label: "Notifications", icon: "bell" },
  { key: "/ai-models", label: "AI Models", icon: "robot" },
  { key: "/channel-providers", label: "Channel Providers", icon: "message" },
  { key: "/data-pipeline", label: "Data Pipeline", icon: "node-index" },
] as const;
