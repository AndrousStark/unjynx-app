// ============================================================
// UNJYNX Dev Portal - Metric Panel Component
// ============================================================

import { Card, Statistic, Progress, Typography } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { COLORS } from "@/utils/constants";

interface MetricPanelProps {
  readonly title: string;
  readonly value: number | string;
  readonly suffix?: string;
  readonly prefix?: React.ReactNode;
  readonly precision?: number;
  readonly trend?: number;
  readonly trendLabel?: string;
  readonly progress?: number;
  readonly thresholds?: {
    readonly warning: number;
    readonly critical: number;
    readonly inverted?: boolean;
  };
  readonly description?: string;
}

const getProgressColor = (
  value: number,
  thresholds?: MetricPanelProps["thresholds"]
): string => {
  if (!thresholds) return COLORS.violet;
  const { warning, critical, inverted } = thresholds;

  if (inverted) {
    if (value <= critical) return COLORS.critical;
    if (value <= warning) return COLORS.warning;
    return COLORS.healthy;
  }

  if (value >= critical) return COLORS.critical;
  if (value >= warning) return COLORS.warning;
  return COLORS.healthy;
};

export const MetricPanel: React.FC<MetricPanelProps> = ({
  title,
  value,
  suffix,
  prefix,
  precision,
  trend,
  trendLabel,
  progress,
  thresholds,
  description,
}) => {
  const trendColor =
    trend !== undefined
      ? trend >= 0
        ? COLORS.healthy
        : COLORS.critical
      : undefined;

  const TrendIcon =
    trend !== undefined
      ? trend >= 0
        ? ArrowUpOutlined
        : ArrowDownOutlined
      : null;

  return (
    <Card
      data-testid="metric-panel"
      style={{ background: "#1A1528", border: "1px solid #2D2640" }}
      styles={{ body: { padding: 16 } }}
    >
      <Statistic
        title={
          <span style={{ color: "#9CA3AF", fontSize: 12 }}>{title}</span>
        }
        value={value}
        suffix={suffix}
        prefix={prefix}
        precision={precision}
        valueStyle={{
          color: COLORS.white,
          fontSize: 24,
          fontWeight: 700,
        }}
      />

      {progress !== undefined && (
        <Progress
          percent={progress}
          size="small"
          strokeColor={getProgressColor(progress, thresholds)}
          trailColor="#2D2640"
          style={{ marginTop: 8 }}
          format={(p) => `${p}%`}
        />
      )}

      {(trend !== undefined || description) && (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
          {TrendIcon && (
            <>
              <TrendIcon style={{ color: trendColor, fontSize: 12 }} />
              <Typography.Text style={{ color: trendColor, fontSize: 12 }}>
                {Math.abs(trend!)}%
              </Typography.Text>
            </>
          )}
          {trendLabel && (
            <Typography.Text style={{ color: "#6B7280", fontSize: 12, marginLeft: 4 }}>
              {trendLabel}
            </Typography.Text>
          )}
          {description && (
            <Typography.Text style={{ color: "#6B7280", fontSize: 12 }}>
              {description}
            </Typography.Text>
          )}
        </div>
      )}
    </Card>
  );
};
