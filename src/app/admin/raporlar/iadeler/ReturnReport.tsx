"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useReturnReport } from "@/hooks/useReportData";
import StatCard from "@/components/admin/StatCard";
import { ReportDateRange, ExportCSVButton } from "@/components/admin/reports";
import {
  RETURN_STATUS_COLORS,
  RETURN_STATUS_LABELS,
} from "@/components/admin/charts/ChartColors";
import { formatCurrency, formatDateTR } from "@/lib/utils";

const StatusPieChart = dynamic(
  () => import("@/components/admin/charts/StatusPieChart"),
  { ssr: false }
);
const BarChartHorizontal = dynamic(
  () => import("@/components/admin/charts/BarChartHorizontal"),
  { ssr: false }
);
const RevenueLineChart = dynamic(
  () => import("@/components/admin/charts/RevenueLineChart"),
  { ssr: false }
);

function getDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 90);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

export default function ReturnReport() {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);

  const { data, isLoading, refetch } = useReturnReport({
    startDate,
    endDate,
  });

  // Durum pie chart data
  const statusPieData = (data?.byStatus || []).map(
    (s: { status: string; count: number }) => ({
      name: RETURN_STATUS_LABELS[s.status] || s.status,
      value: s.count,
      color: RETURN_STATUS_COLORS[s.status],
    })
  );

  // Sebep bar chart data
  const reasonBarData = (data?.byReason || []).map(
    (r: { reason: string; count: number }) => ({
      name: r.reason.length > 30 ? r.reason.slice(0, 30) + "..." : r.reason,
      value: r.count,
    })
  );

  // CSV verileri
  const csvHeaders = [
    "Iade No",
    "Siparis No",
    "Musteri",
    "Sebep",
    "Tutar (TL)",
    "Durum",
    "Tarih",
  ];
  const csvRows = (data?.returns || []).map(
    (r: {
      number: string;
      orderNumber: string;
      customerName: string;
      reason: string;
      amount: number;
      status: string;
      createdAt: string;
    }) => [
      r.number,
      r.orderNumber,
      r.customerName,
      r.reason,
      r.amount,
      RETURN_STATUS_LABELS[r.status] || r.status,
      formatDateTR(r.createdAt),
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
          {/* KPI Kartlari */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              label="Toplam Iade"
              value={data.totalReturns?.toLocaleString("tr-TR") || "0"}
              icon={<span className="text-lg">↩️</span>}
              color="bg-blue-500/10 text-blue-600"
            />
            <StatCard
              label="Iade Orani"
              value={`%${data.returnRate || 0}`}
              icon={<span className="text-lg">📊</span>}
              color="bg-orange-500/10 text-orange-600"
            />
            <StatCard
              label="Toplam Iade Tutari"
              value={`${formatCurrency(data.totalRefundAmount || 0)} TL`}
              icon={<span className="text-lg">💸</span>}
              color="bg-red-500/10 text-red-600"
            />
            <StatCard
              label="Ort. Islem Suresi"
              value={`${data.avgProcessingDays || 0} gun`}
              icon={<span className="text-lg">⏱️</span>}
              color="bg-purple-500/10 text-purple-600"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {statusPieData.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Iade Durum Dagilimi
                </h2>
                <StatusPieChart data={statusPieData} height={280} />
              </div>
            )}
            {reasonBarData.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Iade Sebepleri
                </h2>
                <BarChartHorizontal
                  data={reasonBarData}
                  height={280}
                  layout="horizontal"
                />
              </div>
            )}
          </div>

          {/* Aylik Iade Trendi */}
          {data.monthlyTrend && data.monthlyTrend.length > 1 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">
                Aylik Iade Trendi
              </h2>
              <RevenueLineChart
                data={data.monthlyTrend}
                height={300}
                showOrders={false}
              />
            </div>
          )}

          {/* Iade Tablosu */}
          {data.returns && data.returns.length > 0 ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Son Iadeler ({data.returns.length})
                </h2>
                <ExportCSVButton
                  headers={csvHeaders}
                  rows={csvRows}
                  filename={`iade-raporu-${startDate}-${endDate}.csv`}
                />
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted z-10">
                    <tr className="border-b border-border">
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                        Iade No
                      </th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                        Siparis
                      </th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                        Musteri
                      </th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                        Sebep
                      </th>
                      <th className="text-right px-6 py-3 font-medium text-muted-foreground">
                        Tutar (TL)
                      </th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                        Durum
                      </th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                        Tarih
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.returns.map(
                      (ret: {
                        id: string;
                        number: string;
                        orderNumber: string;
                        customerName: string;
                        reason: string;
                        amount: number;
                        status: string;
                        createdAt: string;
                      }) => (
                        <tr
                          key={ret.id}
                          className="border-b border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-6 py-3 font-medium">
                            {ret.number}
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {ret.orderNumber}
                          </td>
                          <td className="px-6 py-3">{ret.customerName}</td>
                          <td className="px-6 py-3 max-w-[200px] truncate" title={ret.reason}>
                            {ret.reason}
                          </td>
                          <td className="px-6 py-3 text-right font-medium">
                            {formatCurrency(ret.amount)}
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor:
                                  (RETURN_STATUS_COLORS[ret.status] ||
                                    "#6b7280") + "20",
                                color:
                                  RETURN_STATUS_COLORS[ret.status] || "#6b7280",
                              }}
                            >
                              {RETURN_STATUS_LABELS[ret.status] || ret.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {formatDateTR(ret.createdAt)}
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
              Secilen tarih araliginda iade verisi bulunamadi.
            </div>
          )}
        </>
      )}
    </div>
  );
}
