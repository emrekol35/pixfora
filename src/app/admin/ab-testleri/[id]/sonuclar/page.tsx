"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface VariantMetrics {
  variantId: string;
  variantName: string;
  isControl: boolean;
  uniqueVisitors: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  revenuePerVisitor: number;
  avgOrderValue: number;
  isSignificant: boolean;
  zScore: number;
  pValue: number;
}

interface DailyDataPoint {
  date: string;
  variantId: string;
  variantName: string;
  visitors: number;
  conversions: number;
  revenue: number;
}

interface TestInfo {
  id: string;
  name: string;
  description: string | null;
  status: string;
  testType: string;
  startDate: string | null;
  endDate: string | null;
  trafficPercent: number;
}

interface ResultsResponse {
  test: TestInfo;
  variants: VariantMetrics[];
  dailyData: DailyDataPoint[];
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  DRAFT: {
    label: "Taslak",
    className: "bg-gray-100 text-gray-700 border-gray-300",
  },
  RUNNING: {
    label: "Calisiyor",
    className: "bg-green-100 text-green-700 border-green-300",
  },
  PAUSED: {
    label: "Duraklatildi",
    className: "bg-yellow-100 text-yellow-700 border-yellow-300",
  },
  COMPLETED: {
    label: "Tamamlandi",
    className: "bg-blue-100 text-blue-700 border-blue-300",
  },
};

const CHART_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(value);

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("tr-TR");
};

const formatPercent = (rate: number) => {
  return `%${(rate * 100).toFixed(2)}`;
};

export default function ABTestResultsPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [results, setResults] = useState<ResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Date range filter
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(
        `/api/admin/ab-tests/${testId}/results?${params.toString()}`
      );
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Test bulunamadi");
        }
        throw new Error("Sonuclar yuklenemedi");
      }
      const data: ResultsResponse = await res.json();
      setResults(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Bilinmeyen bir hata olustu"
      );
    } finally {
      setLoading(false);
    }
  }, [testId, startDate, endDate]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleComplete = async () => {
    if (actionLoading) return;
    const confirmed = window.confirm(
      "Bu testi tamamlamak istediginize emin misiniz? Test durdurulacak ve daha fazla veri toplanmayacak."
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/ab-tests/${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Test tamamlanamadi");
      }
      await fetchResults();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Test tamamlanirken hata olustu"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Chart data: pivot daily data by date with variant conversion rates
  const chartData = useMemo(() => {
    if (!results || results.dailyData.length === 0) return [];

    // Unique dates and variants
    const dateMap = new Map<string, Record<string, number>>();

    for (const point of results.dailyData) {
      if (!dateMap.has(point.date)) {
        dateMap.set(point.date, {});
      }
      const entry = dateMap.get(point.date)!;
      const rate =
        point.visitors > 0 ? (point.conversions / point.visitors) * 100 : 0;
      entry[point.variantName] = Math.round(rate * 100) / 100;
    }

    const sorted = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({
        date: new Date(date).toLocaleDateString("tr-TR", {
          day: "2-digit",
          month: "2-digit",
        }),
        ...values,
      }));

    return sorted;
  }, [results]);

  const variantNames = useMemo(() => {
    if (!results) return [];
    return results.variants.map((v) => v.variantName);
  }, [results]);

  // Find winning variant (highest conversion rate with significance)
  const winningVariantId = useMemo(() => {
    if (!results) return null;
    const significant = results.variants.filter(
      (v) => !v.isControl && v.isSignificant
    );
    if (significant.length === 0) return null;
    const best = significant.reduce((a, b) =>
      a.conversionRate > b.conversionRate ? a : b
    );
    return best.variantId;
  }, [results]);

  // Total metrics
  const totalVisitors = useMemo(() => {
    if (!results) return 0;
    return results.variants.reduce((sum, v) => sum + v.uniqueVisitors, 0);
  }, [results]);

  const totalConversions = useMemo(() => {
    if (!results) return 0;
    return results.variants.reduce((sum, v) => sum + v.conversions, 0);
  }, [results]);

  const totalRevenue = useMemo(() => {
    if (!results) return 0;
    return results.variants.reduce((sum, v) => sum + v.revenue, 0);
  }, [results]);

  const overallConversionRate = useMemo(() => {
    if (totalVisitors === 0) return 0;
    return totalConversions / totalVisitors;
  }, [totalVisitors, totalConversions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">
          Sonuclar yukleniyor...
        </span>
      </div>
    );
  }

  if (error && !results) {
    return (
      <div className="text-center py-20">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg inline-block">
          {error}
        </div>
        <div className="mt-4">
          <Link
            href="/admin/ab-testleri"
            className="text-primary hover:underline"
          >
            &larr; Listeye don
          </Link>
        </div>
      </div>
    );
  }

  if (!results) return null;

  const { test, variants } = results;
  const badge = STATUS_BADGE[test.status] || {
    label: test.status,
    className: "bg-gray-100 text-gray-700",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/ab-testleri"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Geri
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{test.name}</h1>
            {test.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {test.description}
              </p>
            )}
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/ab-testleri/${testId}`}
            className="px-3 py-1.5 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Test Detayi
          </Link>
          {test.status === "RUNNING" && (
            <button
              onClick={handleComplete}
              disabled={actionLoading}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {actionLoading ? "Isleniyor..." : "Testi Tamamla"}
            </button>
          )}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-foreground">
            Tarih Araligi:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-muted-foreground">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Temizle
            </button>
          )}
          <div className="ml-auto text-sm text-muted-foreground">
            {test.startDate && (
              <span>
                Test baslangici: {formatDate(test.startDate)}
              </span>
            )}
            {test.endDate && (
              <span className="ml-4">
                Test bitisi: {formatDate(test.endDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <span className="text-sm text-muted-foreground">
            Toplam Ziyaretci
          </span>
          <p className="text-3xl font-bold text-foreground mt-1">
            {totalVisitors.toLocaleString("tr-TR")}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <span className="text-sm text-muted-foreground">
            Genel Donusum Orani
          </span>
          <p className="text-3xl font-bold text-foreground mt-1">
            {formatPercent(overallConversionRate)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {totalConversions.toLocaleString("tr-TR")} donusum
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <span className="text-sm text-muted-foreground">Toplam Gelir</span>
          <p className="text-3xl font-bold text-foreground mt-1">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
      </div>

      {/* Variant Comparison Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Varyant Karsilastirmasi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Varyant
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                  Ziyaretci
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                  Donusum
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                  Donusum Orani
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                  Gelir/Ziyaretci
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                  Ort. Siparis
                </th>
                <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">
                  Anlamlilik
                </th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => {
                const isWinner = variant.variantId === winningVariantId;
                return (
                  <tr
                    key={variant.variantId}
                    className={`border-t border-border ${
                      isWinner ? "bg-green-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {variant.variantName}
                        {variant.isControl && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            (Kontrol)
                          </span>
                        )}
                        {isWinner && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Kazanan
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                      {variant.uniqueVisitors.toLocaleString("tr-TR")}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                      {variant.conversions.toLocaleString("tr-TR")}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-foreground">
                      {formatPercent(variant.conversionRate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                      {formatCurrency(variant.revenuePerVisitor)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-muted-foreground">
                      {formatCurrency(variant.avgOrderValue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {variant.isControl ? (
                        <span className="text-gray-400">-</span>
                      ) : variant.uniqueVisitors < 30 ? (
                        <span
                          className="text-yellow-600"
                          title="Henuz yeterli veri yok"
                        >
                          Henuz yeterli veri yok
                        </span>
                      ) : variant.isSignificant ? (
                        <span
                          className="text-green-600 font-medium"
                          title={`p=${variant.pValue}, z=${variant.zScore}`}
                        >
                          Anlamli (p={variant.pValue})
                        </span>
                      ) : (
                        <span
                          className="text-red-500"
                          title={`p=${variant.pValue}, z=${variant.zScore}`}
                        >
                          Anlamli degil
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conversion Rate Chart */}
      {chartData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            Gunluk Donusum Orani (%)
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis
                  fontSize={12}
                  tickFormatter={(value: number) => `%${value}`}
                />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip
                  formatter={(value: any) => [`%${value}`, undefined]}
                  labelFormatter={(label: any) => `Tarih: ${label}`}
                />
                <Legend />
                {variantNames.map((name, index) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Empty data state */}
      {chartData.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <p className="text-muted-foreground">
            Henuz gorsellestirilecek gunluk veri bulunmuyor. Test calistikca
            burada donusum trendi goruntulenecektir.
          </p>
        </div>
      )}
    </div>
  );
}
