import React from "react";
import { Card, Typography } from "antd";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CHART_COLORS } from "../../utils/constants";

const { Title } = Typography;

interface DonutChartProps {
  readonly title: string;
  readonly data: readonly {
    readonly name: string;
    readonly value: number;
  }[];
  readonly height?: number;
  readonly innerRadius?: number;
  readonly outerRadius?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  title,
  data,
  height = 300,
  innerRadius = 60,
  outerRadius = 100,
}) => {
  return (
    <Card bordered={false}>
      <Title level={5} style={{ marginBottom: 16 }}>
        {title}
      </Title>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data as { name: string; value: number }[]}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};
