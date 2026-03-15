import React from "react";
import { Card, Statistic, Typography } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { BRAND_COLORS } from "../../utils/constants";

const { Text } = Typography;

interface StatCardProps {
  readonly title: string;
  readonly value: number | string;
  readonly prefix?: React.ReactNode;
  readonly suffix?: string;
  readonly precision?: number;
  readonly trend?: number; // percentage change, positive = up
  readonly trendLabel?: string;
  readonly loading?: boolean;
  readonly valueStyle?: React.CSSProperties;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  precision,
  trend,
  trendLabel,
  loading = false,
  valueStyle,
}) => {
  const trendColor =
    trend !== undefined
      ? trend >= 0
        ? BRAND_COLORS.success
        : BRAND_COLORS.error
      : undefined;

  const trendIcon =
    trend !== undefined ? (
      trend >= 0 ? (
        <ArrowUpOutlined style={{ color: trendColor, fontSize: 12 }} />
      ) : (
        <ArrowDownOutlined style={{ color: trendColor, fontSize: 12 }} />
      )
    ) : null;

  return (
    <Card
      bordered={false}
      style={{ height: "100%" }}
      styles={{ body: { padding: "20px 24px" } }}
    >
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={suffix}
        precision={precision}
        loading={loading}
        valueStyle={{
          color: BRAND_COLORS.violet,
          fontWeight: 700,
          ...valueStyle,
        }}
      />
      {trend !== undefined && (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
          {trendIcon}
          <Text style={{ color: trendColor, fontSize: 13 }}>
            {Math.abs(trend).toFixed(1)}%
          </Text>
          {trendLabel && (
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
              {trendLabel}
            </Text>
          )}
        </div>
      )}
    </Card>
  );
};
