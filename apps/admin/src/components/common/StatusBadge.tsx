import React from "react";
import { Badge, Tag } from "antd";
import { capitalizeFirst, statusColor } from "../../utils/formatters";

interface StatusBadgeProps {
  readonly status: string;
  readonly variant?: "badge" | "tag";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = "tag",
}) => {
  const color = statusColor(status);
  const label = capitalizeFirst(status.replace(/_/g, " "));

  if (variant === "badge") {
    return <Badge status={color} text={label} />;
  }

  return <Tag color={color}>{label}</Tag>;
};
