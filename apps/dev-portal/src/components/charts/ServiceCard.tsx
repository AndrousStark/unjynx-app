// ============================================================
// UNJYNX Dev Portal - Service Card Component
// ============================================================

import { Card, Statistic, Row, Col, Typography } from "antd";
import { StatusIndicator } from "@/components/common/StatusIndicator";
import type { ServiceStatus } from "@/types";
import { COLORS } from "@/utils/constants";

interface MetricItem {
  readonly label: string;
  readonly value: number | string;
  readonly suffix?: string;
  readonly precision?: number;
}

interface ServiceCardProps {
  readonly title: string;
  readonly status: ServiceStatus;
  readonly lastCheck?: string;
  readonly metrics: ReadonlyArray<MetricItem>;
  readonly icon?: React.ReactNode;
  readonly extra?: React.ReactNode;
}

const statusBorderColor: Record<ServiceStatus, string> = {
  healthy: COLORS.healthy,
  degraded: COLORS.warning,
  down: COLORS.critical,
  unknown: COLORS.unknown,
};

export const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  status,
  lastCheck,
  metrics,
  icon,
  extra,
}) => (
  <Card
    data-testid="service-card"
    style={{
      borderTop: `3px solid ${statusBorderColor[status]}`,
      background: "#1A1528",
    }}
    styles={{
      header: { borderBottom: "1px solid #2D2640" },
      body: { padding: 16 },
    }}
    title={
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {icon}
        <Typography.Text strong style={{ color: COLORS.white, fontSize: 15 }}>
          {title}
        </Typography.Text>
      </div>
    }
    extra={
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <StatusIndicator status={status} lastCheck={lastCheck} size="small" />
        {extra}
      </div>
    }
  >
    <Row gutter={[16, 12]}>
      {metrics.map((metric) => (
        <Col key={metric.label} xs={12} sm={8} md={12} lg={8}>
          <Statistic
            title={
              <span style={{ color: "#9CA3AF", fontSize: 12 }}>
                {metric.label}
              </span>
            }
            value={metric.value}
            suffix={metric.suffix}
            precision={metric.precision}
            valueStyle={{
              color: COLORS.white,
              fontSize: 18,
              fontWeight: 600,
            }}
          />
        </Col>
      ))}
    </Row>
  </Card>
);
