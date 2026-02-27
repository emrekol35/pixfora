"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useProductReport } from "@/hooks/useReportData";
import StatCard from "@/components/admin/StatCard";
import { ReportDateRange, ExportCSVButton } from "@/components/admin/reports";
import { formatCurrency } from "@/lib/utils";

const BarChartHorizontal = dynamic(
  () => import("@/components/admin/charts/BarChartHorizontal"),
  { ssr: false }
);
const StatusPieChart = dynamic(
  () => import("@/components/admin/charts/StatusPieChart"),
  { ssr: false }
);

interface ProductData {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image: string | null;
  categoryName: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface CategoryData {
  name: string;
  revenue: number;
  quantity: number;
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
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

export default function ProductReport() {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);

  const { data, isLoading, refetch } = useProductReport({
    limit: 30,
    startDate,
    endDate,
  });

  const products: ProductData[] = data?.products || [];
  const categoryRevenue: CategoryData[] = data?.categoryRevenue || [];

  // Top 10 urun bar chart data
  const top10BarData = products.slice(0, 10).map((p) => ({
    name: truncate(p.name, 25),
    value: p.totalQuantity,
  }));

  // Top 10 gelir bar data
  const top10RevenueData = products.slice(0, 10).map((p) => ({
    name: truncate(p.name, 25),
    value: p.totalRevenue,
  }));

  // Kategori pie data
  const categoryPieData = categoryRevenue.map((c) => ({
    name: c.name,
    value: c.revenue,
  }));

  // Ozet istatistikler
  const totalProducts = products.length;
  const totalQuantitySold = products.reduce(
    (sum, p) => sum + p.totalQuantity,
    0
  );
  const totalProductRevenue = products.reduce(
    (sum, p) => sum + p.totalRevenue,
    0
  );
  const avgPrice =
    products.length > 0
      ? products.reduce((sum, p) => sum + p.price, 0) / products.length
      : 0;

  // CSV verileri
  const csvHeaders = [
    "#",
    "Urun",
    "Kategori",
    "Fiyat",
    "Stok",
    "Satilan",
    "Gelir (TL)",
  ];
  const csvRows = products.map((p, i) => [
    i + 1,
    p.name,
    p.categoryName,
    p.price,
    p.stock,
    p.totalQuantity,
    p.totalRevenue,
  ]);

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

      {!isLoading && (
        <>
          {products.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground">
              Secilen tarih araliginda urun satis verisi bulunamadi.
            </div>
          ) : (
            <>
              {/* Ozet Kartlari */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  label="Satilan Urun Cesidi"
                  value={totalProducts}
                  icon={<span className="text-lg">📦</span>}
                  color="bg-blue-500/10 text-blue-600"
                />
                <StatCard
                  label="Toplam Satilan Adet"
                  value={totalQuantitySold.toLocaleString("tr-TR")}
                  icon={<span className="text-lg">🛒</span>}
                  color="bg-green-500/10 text-green-600"
                />
                <StatCard
                  label="Toplam Urun Geliri"
                  value={`${formatCurrency(totalProductRevenue)} TL`}
                  icon={<span className="text-lg">💰</span>}
                  color="bg-purple-500/10 text-purple-600"
                />
                <StatCard
                  label="Ort. Urun Fiyati"
                  value={`${formatCurrency(avgPrice)} TL`}
                  icon={<span className="text-lg">💲</span>}
                  color="bg-orange-500/10 text-orange-600"
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {top10BarData.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4">
                      En Cok Satan 10 Urun (Adet)
                    </h2>
                    <BarChartHorizontal
                      data={top10BarData}
                      height={350}
                      layout="horizontal"
                    />
                  </div>
                )}
                {categoryPieData.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4">
                      Kategori Bazli Gelir Dagilimi
                    </h2>
                    <StatusPieChart
                      data={categoryPieData}
                      height={350}
                      innerRadius={50}
                      outerRadius={110}
                    />
                  </div>
                )}
              </div>

              {/* Top 10 Gelir Bar Chart */}
              {top10RevenueData.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4">
                    En Cok Gelir Getiren 10 Urun (TL)
                  </h2>
                  <BarChartHorizontal
                    data={top10RevenueData}
                    height={350}
                    isCurrency
                    layout="horizontal"
                  />
                </div>
              )}

              {/* Urun Tablosu */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Tum Urunler ({products.length})
                  </h2>
                  <ExportCSVButton
                    headers={csvHeaders}
                    rows={csvRows}
                    filename={`urun-raporu-${startDate}-${endDate}.csv`}
                  />
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted z-10">
                      <tr className="border-b border-border">
                        <th className="text-left px-6 py-3 font-medium text-muted-foreground w-12">
                          #
                        </th>
                        <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                          Urun
                        </th>
                        <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                          Kategori
                        </th>
                        <th className="text-right px-6 py-3 font-medium text-muted-foreground">
                          Fiyat
                        </th>
                        <th className="text-right px-6 py-3 font-medium text-muted-foreground">
                          Stok
                        </th>
                        <th className="text-right px-6 py-3 font-medium text-muted-foreground">
                          Satilan
                        </th>
                        <th className="text-right px-6 py-3 font-medium text-muted-foreground">
                          Gelir (TL)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product, index) => (
                        <tr
                          key={product.id}
                          className="border-b border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-6 py-3 text-muted-foreground">
                            {index + 1}
                          </td>
                          <td className="px-6 py-3 font-medium">
                            {truncate(product.name, 40)}
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {product.categoryName}
                          </td>
                          <td className="px-6 py-3 text-right">
                            {formatCurrency(product.price)}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span
                              className={
                                product.stock <= 5
                                  ? "text-red-500 font-medium"
                                  : ""
                              }
                            >
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            {product.totalQuantity.toLocaleString("tr-TR")}
                          </td>
                          <td className="px-6 py-3 text-right font-medium">
                            {formatCurrency(product.totalRevenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
