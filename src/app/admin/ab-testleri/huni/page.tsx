"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface FunnelStep {
  step: string;
  label: string;
  visitors: number;
  dropoff: number;
}

interface ABTestOption {
  id: string;
  name: string;
  status: string;
}

interface FunnelResponse {
  funnel: FunnelStep[];
  byVariant?: Record<string, FunnelStep[]>;
}

const FUNNEL_COLORS = [
  "#6366f1",
  "#818cf8",
  "#a5b4fc",
  "#c7d2fe",
  "#e0e7ff",
];

export default function HuniPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [testId, setTestId] = useState("");
  const [data, setData] = useState<FunnelResponse | null>(null);
  const [abTests, setAbTests] = useState<ABTestOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch A/B test list
  useEffect(() => {
    fetch("/api/admin/ab-tests?status=RUNNING")
      .then((res) => res.json())
      .then((json) => {
        if (json.tests) {
          setAbTests(json.tests);
        }
      })
      .catch(() => {
        // Silent fail for AB test list
      });
  }, []);

  // Fetch funnel data
  useEffect(() => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (testId) params.set("testId", testId);

    fetch(`/api/admin/analytics/funnel?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Veri yuklenemedi");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Bir hata olustu");
        setLoading(false);
      });
  }, [startDate, endDate, testId]);

  const totalVisitors = data?.funnel?.[0]?.visitors || 0;
  const purchaseVisitors =
    data?.funnel?.[data.funnel.length - 1]?.visitors || 0;
  const conversionRate =
    totalVisitors > 0
      ? ((purchaseVisitors / totalVisitors) * 100).toFixed(2)
      : "0.00";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Donusum Hunisi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kullanici yolculugunu adim adim analiz edin
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Baslangic Tarihi
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-background"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Bitis Tarihi
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-background"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              A/B Testi (Opsiyonel)
            </label>
            <select
              value={testId}
              onChange={(e) => setTestId(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-background min-w-[200px]"
            >
              <option value="">Tum Ziyaretciler</option>
              {abTests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-sm text-muted-foreground">
            Huni verileri yukleniyor...
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-danger/10 text-danger rounded-xl p-6 text-center">
          {error}
        </div>
      )}

      {/* Data */}
      {!loading && !error && data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground font-medium">
                Toplam Ziyaretci
              </p>
              <p className="text-2xl font-bold mt-1">
                {totalVisitors.toLocaleString("tr-TR")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">son 30 gun</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground font-medium">
                Genel Donusum Orani
              </p>
              <p className="text-2xl font-bold mt-1 text-primary">
                %{conversionRate}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                urun goruntulemesi &rarr; satin alma
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground font-medium">
                Toplam Satin Alma
              </p>
              <p className="text-2xl font-bold mt-1 text-success">
                {purchaseVisitors.toLocaleString("tr-TR")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                benzersiz alisverisci
              </p>
            </div>
          </div>

          {/* Funnel Chart */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4">Donusum Hunisi</h3>
            {data.funnel.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Bu tarih araliginda veri bulunamadi.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={data.funnel}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={110}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: any) => [
                      `${Number(value).toLocaleString("tr-TR")} ziyaretci`,
                      "Ziyaretci",
                    ]}
                  />
                  <Bar dataKey="visitors" radius={[0, 4, 4, 0]}>
                    {data.funnel.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Step Details */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4">Adim Detaylari</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 font-medium">Adim</th>
                    <th className="text-right py-2 font-medium">Ziyaretci</th>
                    <th className="text-right py-2 font-medium">Kayip (%)</th>
                    <th className="text-right py-2 font-medium">
                      Gorsel Oran
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.funnel.map((step, i) => {
                    const maxVisitors = data.funnel[0]?.visitors || 1;
                    const widthPercent = (step.visitors / maxVisitors) * 100;
                    return (
                      <tr
                        key={step.step}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-3 font-medium">{step.label}</td>
                        <td className="py-3 text-right">
                          {step.visitors.toLocaleString("tr-TR")}
                        </td>
                        <td className="py-3 text-right">
                          {i === 0 ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <span
                              className={
                                step.dropoff > 50
                                  ? "text-danger font-medium"
                                  : step.dropoff > 25
                                    ? "text-warning font-medium"
                                    : "text-success font-medium"
                              }
                            >
                              %{step.dropoff}
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${widthPercent}%`,
                                backgroundColor:
                                  FUNNEL_COLORS[i % FUNNEL_COLORS.length],
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Variant Comparison */}
          {data.byVariant && Object.keys(data.byVariant).length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-4">
                A/B Test Variant Karsilastirmasi
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(data.byVariant).map(
                  ([variantName, steps]) => {
                    const vTotal = steps[0]?.visitors || 0;
                    const vPurchase =
                      steps[steps.length - 1]?.visitors || 0;
                    const vRate =
                      vTotal > 0
                        ? ((vPurchase / vTotal) * 100).toFixed(2)
                        : "0.00";

                    return (
                      <div
                        key={variantName}
                        className="border border-border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm">
                            {variantName}
                          </h4>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Donusum: %{vRate}
                          </span>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart
                            data={steps}
                            layout="vertical"
                            margin={{
                              top: 5,
                              right: 20,
                              left: 100,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              opacity={0.1}
                            />
                            <XAxis type="number" />
                            <YAxis
                              type="category"
                              dataKey="label"
                              width={90}
                              tick={{ fontSize: 11 }}
                            />
                            <Tooltip
                              formatter={(value: any) => [
                                `${Number(value).toLocaleString("tr-TR")} ziyaretci`,
                                "Ziyaretci",
                              ]}
                            />
                            <Bar dataKey="visitors" radius={[0, 4, 4, 0]}>
                              {steps.map((_, index) => (
                                <Cell
                                  key={`vcell-${index}`}
                                  fill={
                                    FUNNEL_COLORS[
                                      index % FUNNEL_COLORS.length
                                    ]
                                  }
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-2 space-y-1">
                          {steps.map((s, i) => (
                            <div
                              key={s.step}
                              className="flex justify-between text-xs text-muted-foreground"
                            >
                              <span>{s.label}</span>
                              <span>
                                {s.visitors.toLocaleString("tr-TR")}
                                {i > 0 && (
                                  <span
                                    className={
                                      s.dropoff > 50
                                        ? " text-danger ml-2"
                                        : s.dropoff > 25
                                          ? " text-warning ml-2"
                                          : " text-success ml-2"
                                    }
                                  >
                                    -%{s.dropoff}
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && !error && data && data.funnel.every((s) => s.visitors === 0) && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <svg
            className="w-12 h-12 mx-auto text-muted-foreground mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
            />
          </svg>
          <p className="text-muted-foreground text-sm">
            Secilen tarih araliginda huni verisi bulunamadi.
          </p>
        </div>
      )}
    </div>
  );
}
