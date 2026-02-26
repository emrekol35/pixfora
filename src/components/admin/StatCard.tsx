"use client";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  trend,
  color = "bg-primary/10 text-primary",
}: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon && (
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold">{value}</span>
        {trend && (
          <span
            className={`text-xs font-medium flex items-center gap-0.5 mb-1 ${
              trend.isPositive ? "text-success" : "text-danger"
            }`}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
}
