"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface EventSummary {
  eventType: string;
  total: number;
  uniqueVisitors: number;
  trend: number[];
}

interface EventDetail {
  id: string;
  visitorId: string;
  eventType: string;
  eventData: unknown;
  page: string | null;
  createdAt: string;
  sessionId: string;
}

interface EventResponse {
  events: EventSummary[];
  details?: EventDetail[];
}

// Mini sparkline component
function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const height = 24;
  const width = 80;
  const step = width / (data.length - 1 || 1);

  const points = data
    .map((val, i) => `${i * step},${height - (val / max) * height}`)
    .join(" ");

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-primary"
      />
    </svg>
  );
}

export default function EventlerPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedEventType, setSelectedEventType] = useState<string | null>(
    null
  );
  const [data, setData] = useState<EventResponse | null>(null);
  const [detailData, setDetailData] = useState<EventDetail[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch event summary
  useEffect(() => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    fetch(`/api/admin/analytics/events?${params}`)
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
  }, [startDate, endDate]);

  // Fetch detail when event type selected
  useEffect(() => {
    if (!selectedEventType) {
      setDetailData(null);
      return;
    }

    setDetailLoading(true);
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("eventType", selectedEventType);

    fetch(`/api/admin/analytics/events?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Detay yuklenemedi");
        return res.json();
      })
      .then((json) => {
        setDetailData(json.details || []);
        setDetailLoading(false);
      })
      .catch(() => {
        setDetailLoading(false);
      });
  }, [selectedEventType, startDate, endDate]);

  // Prepare daily volume chart data
  const dailyChartData = (() => {
    if (!data?.events?.length) return [];

    const now = new Date();
    const days: string[] = [];
    for (let d = 6; d >= 0; d--) {
      const day = new Date(now);
      day.setDate(day.getDate() - d);
      days.push(
        day.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })
      );
    }

    return days.map((dayLabel, dayIndex) => {
      const entry: Record<string, string | number> = { gun: dayLabel };
      let total = 0;
      for (const ev of data.events) {
        const val = ev.trend[dayIndex] || 0;
        entry[ev.eventType] = val;
        total += val;
      }
      entry.toplam = total;
      return entry;
    });
  })();

  const totalEvents =
    data?.events?.reduce((sum, e) => sum + e.total, 0) || 0;
  const totalUniqueVisitors =
    data?.events?.reduce((sum, e) => sum + e.uniqueVisitors, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Event Analizi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tum izleme eventlerini detayli analiz edin
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
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-sm text-muted-foreground">
            Event verileri yukleniyor...
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
                Toplam Event
              </p>
              <p className="text-2xl font-bold mt-1">
                {totalEvents.toLocaleString("tr-TR")}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground font-medium">
                Benzersiz Ziyaretci
              </p>
              <p className="text-2xl font-bold mt-1">
                {totalUniqueVisitors.toLocaleString("tr-TR")}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground font-medium">
                Event Tipi Sayisi
              </p>
              <p className="text-2xl font-bold mt-1">
                {data.events?.length || 0}
              </p>
            </div>
          </div>

          {/* Daily Volume Chart */}
          {dailyChartData.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-4">
                Son 7 Gun - Gunluk Event Hacmi
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="gun" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: any) => [
                      Number(value).toLocaleString("tr-TR"),
                      "Event",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="toplam"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Toplam"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Event Summary Table */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4">Event Ozeti</h3>
            {data.events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Bu tarih araliginda event bulunamadi.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 font-medium">
                        Event Tipi
                      </th>
                      <th className="text-right py-2 font-medium">Toplam</th>
                      <th className="text-right py-2 font-medium">
                        Benzersiz Ziyaretci
                      </th>
                      <th className="text-center py-2 font-medium">
                        Son 7 Gun
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.events
                      .sort((a, b) => b.total - a.total)
                      .map((ev) => (
                        <tr
                          key={ev.eventType}
                          className={`border-b border-border/50 last:border-0 cursor-pointer transition-colors ${
                            selectedEventType === ev.eventType
                              ? "bg-primary/5"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() =>
                            setSelectedEventType(
                              selectedEventType === ev.eventType
                                ? null
                                : ev.eventType
                            )
                          }
                        >
                          <td className="py-3">
                            <span className="font-medium">{ev.eventType}</span>
                          </td>
                          <td className="py-3 text-right">
                            {ev.total.toLocaleString("tr-TR")}
                          </td>
                          <td className="py-3 text-right">
                            {ev.uniqueVisitors.toLocaleString("tr-TR")}
                          </td>
                          <td className="py-3 text-center">
                            <Sparkline data={ev.trend} />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedEventType && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">
                  {selectedEventType} - Son 50 Event
                </h3>
                <button
                  onClick={() => setSelectedEventType(null)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Kapat
                </button>
              </div>

              {detailLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : detailData && detailData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 font-medium">Tarih</th>
                        <th className="text-left py-2 font-medium">
                          Ziyaretci ID
                        </th>
                        <th className="text-left py-2 font-medium">Sayfa</th>
                        <th className="text-left py-2 font-medium">
                          Detay (JSON)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailData.map((ev) => (
                        <tr
                          key={ev.id}
                          className="border-b border-border/50 last:border-0"
                        >
                          <td className="py-2 whitespace-nowrap">
                            {new Date(ev.createdAt).toLocaleDateString(
                              "tr-TR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </td>
                          <td className="py-2 font-mono text-xs">
                            {ev.visitorId.substring(0, 12)}...
                          </td>
                          <td className="py-2 truncate max-w-[200px]">
                            {ev.page || "-"}
                          </td>
                          <td className="py-2">
                            <pre className="text-xs bg-muted p-1 rounded max-w-[300px] overflow-x-auto">
                              {ev.eventData
                                ? JSON.stringify(ev.eventData, null, 1)
                                : "-"}
                            </pre>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Bu event tipi icin detay bulunamadi.
                </p>
              )}
            </div>
          )}

          {/* Empty state */}
          {data.events.length === 0 && (
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
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-muted-foreground text-sm">
                Secilen tarih araliginda event verisi bulunamadi.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
