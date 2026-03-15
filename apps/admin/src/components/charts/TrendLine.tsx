import React from "react";
import { Card, Typography } from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CHART_COLORS } from "../../utils/constants";

const { Title } = Typography;

interface TrendLineProps {
  readonly title: string;
  readonly data: readonly Record<string, unknown>[];
  readonly dataKeys: readonly {
    readonly key: string;
    readonly label: string;
    readonly color?: string;
  }[];
  readonly xAxisKey?: string;
  readonly height?: number;
}

export const TrendLine: React.FC<TrendLineProps> = ({
  title,
  data,
  dataKeys,
  xAxisKey = "date",
  height = 300,
}) => {
  return (
    <Card bordered={false}>
      <Title level={5} style={{ marginBottom: 16 }}>
        {title}
      </Title>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data as Record<string, unknown>[]}>
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
            <Line
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              name={dk.label}
              stroke={dk.color ?? CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
