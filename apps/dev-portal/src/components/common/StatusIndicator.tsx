// ============================================================
// UNJYNX Dev Portal - Status Indicator Component
// ============================================================

import { Badge, Tooltip } from "antd";
import type { ServiceStatus } from "@/types";
import { COLORS } from "@/utils/constants";
import { formatRelativeTime } from "@/utils/formatters";

interface StatusIndicatorProps {
  readonly status: ServiceStatus | string;
  readonly label?: string;
  readonly lastCheck?: string;
  readonly size?: "small" | "default" | "large";
  readonly showLabel?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  { readonly color: string; readonly text: string }
> = {
  healthy: { color: COLORS.healthy, text: "Healthy" },
  active: { color: COLORS.healthy, text: "Active" },
  running: { color: COLORS.healthy, text: "Running" },
  online: { color: COLORS.healthy, text: "Online" },
  degraded: { color: COLORS.warning, text: "Degraded" },
  warning: { color: COLORS.warning, text: "Warning" },
  deploying: { color: COLORS.warning, text: "Deploying" },
  pending: { color: COLORS.warning, text: "Pending" },
  down: { color: COLORS.critical, text: "Down" },
  error: { color: COLORS.critical, text: "Error" },
  failed: { color: COLORS.critical, text: "Failed" },
  offline: { color: COLORS.critical, text: "Offline" },
  unknown: { color: COLORS.unknown, text: "Unknown" },
  inactive: { color: COLORS.unknown, text: "Inactive" },
};

const sizeMap = {
  small: 6,
  default: 8,
  large: 12,
} as const;

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  lastCheck,
  size = "default",
  showLabel = true,
}) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.unknown;
  const dotSize = sizeMap[size];

  const tooltipContent = lastCheck
    ? `${config.text} - Last checked ${formatRelativeTime(lastCheck)}`
    : config.text;

  return (
    <Tooltip title={tooltipContent}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
        data-testid="status-indicator"
      >
        <Badge
          color={config.color}
          styles={{
            indicator: {
              width: dotSize,
              height: dotSize,
              boxShadow: `0 0 ${dotSize}px ${config.color}`,
            },
          }}
        />
        {showLabel && (
          <span style={{ fontSize: size === "small" ? 12 : 14 }}>
            {label ?? config.text}
          </span>
        )}
      </span>
    </Tooltip>
  );
};
