"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CHART_COLORS } from "@/components/admin/charts/ChartColors";
import { formatCurrency } from "@/lib/utils";

interface DataPoint {
  day: number;
  current: number;
  previous: number;
}

interface Props {
  data: DataPoint[];
  height?: number;
}

export default function RevenueComparisonChart({
  data,
  height = 350,
}: Props) {
  if (!data || data.length === 0) {
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
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${v}. gun`}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => [
            `${formatCurrency(Number(value ?? 0))} TL`,
            name,
          ]}
          labelFormatter={(label) => `${label}. gun`}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="current"
          name="Bu Donem"
          fill={CHART_COLORS.primary}
          fillOpacity={0.15}
          stroke={CHART_COLORS.primary}
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="previous"
          name="Onceki Donem"
          stroke={CHART_COLORS.warning}
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
