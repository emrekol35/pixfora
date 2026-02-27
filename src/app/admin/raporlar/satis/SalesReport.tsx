"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useSalesReport } from "@/hooks/useReportData";
import StatCard from "@/components/admin/StatCard";
import { ReportDateRange, ExportCSVButton } from "@/components/admin/reports";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  PAYMENT_LABELS,
} from "@/components/admin/charts/ChartColors";
import { formatCurrency, formatDateTR } from "@/lib/utils";

const RevenueLineChart = dynamic(
  () => import("@/components/admin/charts/RevenueLineChart"),
  { ssr: false }
);
const StatusPieChart = dynamic(
  () => import("@/components/admin/charts/StatusPieChart"),
  { ssr: false }
);

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

  const { data, isLoading, refetch } = useSalesReport({ startDate, endDate });

  // Siparis durumu pie data
  const statusPieData = (data?.ordersByStatus || []).map(
    (s: { status: string; count: number }) => ({
      name: STATUS_LABELS[s.status] || s.status,
      value: s.count,
      color: STATUS_COLORS[s.status],
    })
  );

  // Odeme yontemi pie data
  const paymentPieData = (data?.ordersByPaymentMethod || []).map(
    (p: { method: string; count: number }) => ({
      name: PAYMENT_LABELS[p.method] || p.method,
      value: p.count,
    })
  );

  // CSV verileri
  const csvHeaders = ["Tarih", "Siparis", "Ciro (TL)"];
  const csvRows = (data?.dailySales || []).map(
    (day: { date: string; orders: number; revenue: number }) => [
      formatDateTR(day.date),
      day.orders,
      day.revenue,
    ]
  );

  return (
    <div className="space-y-6">
      {/* Tarih Filtresi */}
      <ReportDateRange
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApply={() => refetch()}
        isLoading={isLoading}
      />

      {isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          Yukleniyor...
        </div>
      )}

      {!isLoading && data && (
        <>
          {/* Ozet Kartlari */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Toplam Siparis"
              value={data.totalOrders?.toLocaleString("tr-TR") || "0"}
              icon={<span className="text-lg">📦</span>}
              color="bg-blue-500/10 text-blue-600"
            />
            <StatCard
              label="Toplam Ciro"
              value={`${formatCurrency(data.totalRevenue || 0)} TL`}
              icon={<span className="text-lg">💰</span>}
              color="bg-green-500/10 text-green-600"
            />
            <StatCard
              label="Ortalama Siparis"
              value={`${formatCurrency(data.averageOrder || 0)} TL`}
              icon={<span className="text-lg">📊</span>}
              color="bg-purple-500/10 text-purple-600"
            />
          </div>

          {/* Gelir Trendi Grafigi */}
          {data.dailySales && data.dailySales.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Gelir Trendi</h2>
              <RevenueLineChart data={data.dailySales} height={350} />
            </div>
          )}

          {/* Pie Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {statusPieData.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Siparis Durum Dagilimi
                </h2>
                <StatusPieChart data={statusPieData} height={280} />
              </div>
            )}
            {paymentPieData.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Odeme Yontemi Dagilimi
                </h2>
                <StatusPieChart
                  data={paymentPieData}
                  height={280}
                  innerRadius={40}
                  outerRadius={90}
                />
              </div>
            )}
          </div>

          {/* Gunluk Satislar Tablosu */}
          {data.dailySales && data.dailySales.length > 0 ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-semibold">Gunluk Satislar</h2>
                <ExportCSVButton
                  headers={csvHeaders}
                  rows={csvRows}
                  filename={`satis-raporu-${startDate}-${endDate}.csv`}
                />
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted z-10">
                    <tr className="border-b border-border">
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                        Tarih
                      </th>
                      <th className="text-right px-6 py-3 font-medium text-muted-foreground">
                        Siparis
                      </th>
                      <th className="text-right px-6 py-3 font-medium text-muted-foreground">
                        Ciro (TL)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.dailySales].reverse().map(
                      (day: {
                        date: string;
                        orders: number;
                        revenue: number;
                      }) => (
                        <tr
                          key={day.date}
                          className="border-b border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-6 py-3">
                            {formatDateTR(day.date)}
                          </td>
                          <td className="px-6 py-3 text-right">
                            {day.orders}
                          </td>
                          <td className="px-6 py-3 text-right font-medium">
                            {formatCurrency(day.revenue)}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground">
              Secilen tarih araliginda satis verisi bulunamadi.
            </div>
          )}
        </>
      )}
    </div>
  );
}
