"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useShippingReport } from "@/hooks/useReportData";
import StatCard from "@/components/admin/StatCard";
import { ReportDateRange, ExportCSVButton } from "@/components/admin/reports";
import {
  SHIPMENT_STATUS_COLORS,
  SHIPMENT_STATUS_LABELS,
} from "@/components/admin/charts/ChartColors";
import { formatDateTR } from "@/lib/utils";

const StatusPieChart = dynamic(
  () => import("@/components/admin/charts/StatusPieChart"),
  { ssr: false }
);
const BarChartHorizontal = dynamic(
  () => import("@/components/admin/charts/BarChartHorizontal"),
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

export default function ShippingReport() {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);

  const { data, isLoading, refetch } = useShippingReport({
    startDate,
    endDate,
  });

  // Durum pie chart data
  const statusPieData = (data?.byStatus || []).map(
    (s: { status: string; count: number }) => ({
      name: SHIPMENT_STATUS_LABELS[s.status] || s.status,
      value: s.count,
      color: SHIPMENT_STATUS_COLORS[s.status],
    })
  );

  // Firma bar chart data
  const providerBarData = (data?.byProvider || []).map(
    (p: { provider: string; count: number }) => ({
      name: p.provider,
      value: p.count,
    })
  );

  // Sehir bar chart data
  const cityBarData = (data?.byCity || []).map(
    (c: { city: string; count: number }) => ({
      name: c.city,
      value: c.count,
    })
  );

  // CSV verileri
  const csvHeaders = [
    "Gonderi No",
    "Siparis No",
    "Kargo Firmasi",
    "Durum",
    "Sehir",
    "Takip No",
    "Olusturma Tarihi",
  ];
  const csvRows = (data?.shipments || []).map(
    (s: {
      number: string;
      orderNumber: string;
      provider: string;
      status: string;
      city: string;
      tracking: string;
      createdAt: string;
    }) => [
      s.number,
      s.orderNumber,
      s.provider,
      SHIPMENT_STATUS_LABELS[s.status] || s.status,
      s.city,
      s.tracking,
      formatDateTR(s.createdAt),
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
              label="Toplam Gonderi"
              value={data.totalShipments?.toLocaleString("tr-TR") || "0"}
              icon={<span className="text-lg">🚚</span>}
              color="bg-blue-500/10 text-blue-600"
            />
            <StatCard
              label="Teslim Orani"
              value={`%${data.deliveryRate || 0}`}
              icon={<span className="text-lg">✅</span>}
              color="bg-green-500/10 text-green-600"
            />
            <StatCard
              label="Ort. Teslim Suresi"
              value={`${data.avgDeliveryDays || 0} gun`}
              icon={<span className="text-lg">⏱️</span>}
              color="bg-purple-500/10 text-purple-600"
            />
            <StatCard
              label="Sorunlu Gonderiler"
              value={data.problemCount?.toLocaleString("tr-TR") || "0"}
              icon={<span className="text-lg">⚠️</span>}
              color="bg-red-500/10 text-red-600"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {statusPieData.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Kargo Durum Dagilimi
                </h2>
                <StatusPieChart data={statusPieData} height={280} />
              </div>
            )}
            {providerBarData.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Kargo Firmasi Karsilastirmasi
                </h2>
                <BarChartHorizontal
                  data={providerBarData}
                  height={280}
                  layout="vertical"
                />
              </div>
            )}
          </div>

          {/* Sehir Bazli Dagilim */}
          {cityBarData.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">
                Sehir Bazli Dagilim (Top 10)
              </h2>
              <BarChartHorizontal
                data={cityBarData}
                height={350}
                layout="horizontal"
              />
            </div>
          )}

          {/* Gonderi Tablosu */}
          {data.shipments && data.shipments.length > 0 ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Son Gonderiler ({data.shipments.length})
                </h2>
                <ExportCSVButton
                  headers={csvHeaders}
                  rows={csvRows}
                  filename={`kargo-raporu-${startDate}-${endDate}.csv`}
                />
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted z-10">
                    <tr className="border-b border-border">
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                        Gonderi No
                      </th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                        Siparis
                      </th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                        Firma
                      </th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                        Durum
                      </th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                        Sehir
                      </th>
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                        Tarih
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.shipments.map(
                      (shipment: {
                        id: string;
                        number: string;
                        orderNumber: string;
                        provider: string;
                        status: string;
                        city: string;
                        createdAt: string;
                      }) => (
                        <tr
                          key={shipment.id}
                          className="border-b border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-6 py-3 font-medium">
                            {shipment.number}
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {shipment.orderNumber}
                          </td>
                          <td className="px-6 py-3">{shipment.provider}</td>
                          <td className="px-6 py-3">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor:
                                  (SHIPMENT_STATUS_COLORS[shipment.status] ||
                                    "#6b7280") + "20",
                                color:
                                  SHIPMENT_STATUS_COLORS[shipment.status] ||
                                  "#6b7280",
                              }}
                            >
                              {SHIPMENT_STATUS_LABELS[shipment.status] ||
                                shipment.status}
                            </span>
                          </td>
                          <td className="px-6 py-3">{shipment.city}</td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {formatDateTR(shipment.createdAt)}
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
              Secilen tarih araliginda kargo verisi bulunamadi.
            </div>
          )}
        </>
      )}
    </div>
  );
}
