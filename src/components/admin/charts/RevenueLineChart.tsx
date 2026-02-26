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
import { CHART_COLORS } from "./ChartColors";
import { formatCurrency } from "@/lib/utils";

interface DataPoint {
  date: string;
  revenue: number;
  orders?: number;
}

interface Props {
  data: DataPoint[];
  height?: number;
  showOrders?: boolean;
}

export default function RevenueLineChart({
  data,
  height = 300,
  showOrders = true,
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
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => {
            const d = new Date(v);
            return `${d.getDate()}/${d.getMonth() + 1}`;
          }}
        />
        <YAxis
          yAxisId="revenue"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
        />
        {showOrders && (
          <YAxis
            yAxisId="orders"
            orientation="right"
            tick={{ fontSize: 11 }}
          />
        )}
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => {
            if (name === "Gelir") return [`${formatCurrency(Number(value ?? 0))} TL`, name];
            return [value ?? 0, name];
          }}
          labelFormatter={(label) => {
            const d = new Date(label);
            return d.toLocaleDateString("tr-TR");
          }}
        />
        <Legend />
        <Area
          yAxisId="revenue"
          type="monotone"
          dataKey="revenue"
          name="Gelir"
          fill={CHART_COLORS.primary}
          fillOpacity={0.1}
          stroke={CHART_COLORS.primary}
          strokeWidth={2}
        />
        {showOrders && (
          <Line
            yAxisId="orders"
            type="monotone"
            dataKey="orders"
            name="Siparis"
            stroke={CHART_COLORS.success}
            strokeWidth={2}
            dot={false}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
