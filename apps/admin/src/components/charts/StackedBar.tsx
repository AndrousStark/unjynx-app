import React from "react";
import { Card, Typography } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CHART_COLORS } from "../../utils/constants";

const { Title } = Typography;

interface StackedBarProps {
  readonly title: string;
  readonly data: readonly Record<string, unknown>[];
  readonly dataKeys: readonly {
    readonly key: string;
    readonly label: string;
    readonly color?: string;
  }[];
  readonly xAxisKey?: string;
  readonly height?: number;
  readonly stacked?: boolean;
}

export const StackedBar: React.FC<StackedBarProps> = ({
  title,
  data,
  dataKeys,
  xAxisKey = "date",
  height = 300,
  stacked = true,
}) => {
  return (
    <Card bordered={false}>
      <Title level={5} style={{ marginBottom: 16 }}>
        {title}
      </Title>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data as Record<string, unknown>[]}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12 }}
            stroke="#999"
          />
          <YAxis tick={{ fontSize: 12 }} stroke="#999" />
          <Tooltip />
          <Legend />
          {dataKeys.map((dk, i) => (
            <Bar
              key={dk.key}
              dataKey={dk.key}
              name={dk.label}
              fill={dk.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              stackId={stacked ? "stack" : undefined}
              radius={stacked ? undefined : [4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
