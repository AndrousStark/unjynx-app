// ============================================================
// UNJYNX Dev Portal - Time Series Chart Component
// ============================================================

import { Card } from "antd";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { COLORS } from "@/utils/constants";

interface SeriesConfig {
  readonly dataKey: string;
  readonly name: string;
  readonly color?: string;
  readonly type?: "monotone" | "linear" | "step";
}

interface TimeSeriesChartProps {
  readonly title?: string;
  readonly data: ReadonlyArray<Record<string, unknown>>;
  readonly series: ReadonlyArray<SeriesConfig>;
  readonly xAxisKey?: string;
  readonly height?: number;
  readonly showGrid?: boolean;
  readonly showLegend?: boolean;
  readonly yAxisLabel?: string;
  readonly extra?: React.ReactNode;
}

const DEFAULT_COLORS = [
  COLORS.chartPrimary,
  COLORS.chartSecondary,
  COLORS.chartTertiary,
  COLORS.chartQuaternary,
  COLORS.chartQuinary,
];

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  title,
  data,
  series,
  xAxisKey = "time",
  height = 300,
  showGrid = true,
  showLegend = true,
  yAxisLabel,
  extra,
}) => (
  <Card
    data-testid="time-series-chart"
    title={title}
    extra={extra}
    style={{ background: "#1A1528", border: "1px solid #2D2640" }}
    styles={{
      header: {
        borderBottom: "1px solid #2D2640",
        color: COLORS.white,
      },
      body: { padding: "16px 8px" },
    }}
  >
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data as Record<string, unknown>[]}>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#2D2640" />
        )}
        <XAxis
          dataKey={xAxisKey}
          stroke="#6B7280"
          fontSize={11}
          tickLine={false}
          fontFamily="'JetBrains Mono', monospace"
        />
        <YAxis
          stroke="#6B7280"
          fontSize={11}
          tickLine={false}
          label={
            yAxisLabel
              ? {
                  value: yAxisLabel,
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "#6B7280", fontSize: 11 },
                }
              : undefined
          }
          fontFamily="'JetBrains Mono', monospace"
        />
        <Tooltip
          contentStyle={{
            background: "#1A1528",
            border: "1px solid #2D2640",
            borderRadius: 8,
            color: COLORS.white,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
          }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ color: "#9CA3AF", fontSize: 12 }}
          />
        )}
        {series.map((s, idx) => (
          <Area
            key={s.dataKey}
            type={s.type ?? "monotone"}
            dataKey={s.dataKey}
            name={s.name}
            stroke={s.color ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
            fill={s.color ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
            fillOpacity={0.1}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  </Card>
);
