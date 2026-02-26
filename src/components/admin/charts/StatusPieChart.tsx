"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { CHART_COLORS } from "./ChartColors";

interface DataPoint {
  name: string;
  value: number;
  color?: string;
}

interface Props {
  data: DataPoint[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

export default function StatusPieChart({
  data,
  height = 300,
  innerRadius = 50,
  outerRadius = 100,
}: Props) {
  if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
      >
        Veri bulunamadi
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }: { name?: string; percent?: number }) =>
            `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={entry.color || CHART_COLORS.palette[index % CHART_COLORS.palette.length]}
            />
          ))}
        </Pie>
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [value ?? 0, "Adet"]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
