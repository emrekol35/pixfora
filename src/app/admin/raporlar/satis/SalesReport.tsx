"use client";

import { useState, useEffect, useCallback } from "react";

interface DailySale {
  date: string;
  orders: number;
  revenue: number;
}

interface SalesData {
  totalOrders: number;
  totalRevenue: number;
  averageOrder: number;
  dailySales: DailySale[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);

  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export default function SalesReport() {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SalesData | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/reports/sales?${params.toString()}`);
      if (!res.ok) throw new Error("Veri alinamadi");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Sales report fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const maxRevenue =
    data?.dailySales && data.dailySales.length > 0
      ? Math.max(...data.dailySales.map((d) => d.revenue))
      : 0;

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              Baslangic Tarihi
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 bg-muted text-foreground text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              Bitis Tarihi
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 bg-muted text-foreground text-sm"
            />
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Yukleniyor..." : "Raporu Getir"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-muted-foreground">
          Yukleniyor...
        </div>
      )}

      {!loading && data && (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-muted-foreground text-sm">Toplam Siparis</p>
              <p className="text-2xl font-bold mt-1">
                {data.totalOrders.toLocaleString("tr-TR")}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-muted-foreground text-sm">Toplam Ciro</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(data.totalRevenue)} TL
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-muted-foreground text-sm">Ortalama Siparis</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(data.averageOrder)} TL
              </p>
            </div>
          </div>

          {/* Daily Sales Table */}
          {data.dailySales.length > 0 ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-semibold">Gunluk Satislar</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted">
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                        Tarih
                      </th>
                      <th className="text-right px-6 py-3 font-medium text-muted-foreground">
                        Siparis Sayisi
                      </th>
                      <th className="text-right px-6 py-3 font-medium text-muted-foreground">
                        Ciro (TL)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.dailySales.map((day) => (
                      <tr
                        key={day.date}
                        className="border-b border-border hover:bg-muted transition-colors"
                      >
                        <td className="px-6 py-3">{formatDate(day.date)}</td>
                        <td className="px-6 py-3 text-right">{day.orders}</td>
                        <td className="px-6 py-3 text-right">
                          {formatCurrency(day.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground">
              Secilen tarih araliginda satis verisi bulunamadi.
            </div>
          )}

          {/* Bar Chart */}
          {data.dailySales.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">
                Gunluk Ciro Grafigi
              </h2>
              <div className="space-y-2">
                {data.dailySales.map((day) => {
                  const widthPercent =
                    maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-24 shrink-0 text-right">
                        {formatDate(day.date)}
                      </span>
                      <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                        <div
                          className="h-full bg-primary rounded transition-all duration-300"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-28 shrink-0 text-right">
                        {formatCurrency(day.revenue)} TL
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
