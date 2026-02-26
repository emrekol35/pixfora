"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { CHART_COLORS } from "./ChartColors";
import { formatCurrency } from "@/lib/utils";

interface DataPoint {
  name: string;
  value: number;
  color?: string;
}

interface Props {
  data: DataPoint[];
  height?: number;
  isCurrency?: boolean;
  color?: string;
  layout?: "horizontal" | "vertical";
}

export default function BarChartHorizontal({
  data,
  height = 300,
  isCurrency = false,
  color = CHART_COLORS.primary,
  layout = "horizontal",
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

  if (layout === "horizontal") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) =>
              isCurrency ? `${(v / 1000).toFixed(0)}K` : String(v)
            }
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11 }}
            width={120}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [
              isCurrency ? `${formatCurrency(Number(value ?? 0))} TL` : (value ?? 0),
              "Deger",
            ]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={
                  entry.color ||
                  CHART_COLORS.palette[index % CHART_COLORS.palette.length]
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(v) =>
            isCurrency ? `${(v / 1000).toFixed(0)}K` : String(v)
          }
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [
            isCurrency ? `${formatCurrency(Number(value ?? 0))} TL` : (value ?? 0),
            "Deger",
          ]}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={
                entry.color ||
                CHART_COLORS.palette[index % CHART_COLORS.palette.length]
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
