"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useDashboardStats } from "@/hooks/useReportData";
import { formatCurrency, percentChange } from "@/lib/utils";
import StatCard from "@/components/admin/StatCard";
import { STATUS_LABELS, STATUS_COLORS } from "@/components/admin/charts/ChartColors";

const RevenueLineChart = dynamic(
  () => import("@/components/admin/charts/RevenueLineChart"),
  { ssr: false }
);
const StatusPieChart = dynamic(
  () => import("@/components/admin/charts/StatusPieChart"),
  { ssr: false }
);

export default function DashboardClient() {
  const { data, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-3" />
              <div className="h-8 bg-muted rounded w-32" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 animate-pulse">
            <div className="h-[300px] bg-muted rounded" />
          </div>
          <div className="bg-card border border-border rounded-xl p-6 animate-pulse">
            <div className="h-[300px] bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-danger/10 text-danger rounded-xl p-6 text-center">
        Dashboard verileri yuklenemedi. Lutfen sayfayi yenileyin.
      </div>
    );
  }

  const { stats, recentOrders, lowStockProducts, dailyRevenue, ordersByStatus } = data;

  const revenueChange = percentChange(stats.monthlyRevenue, stats.previousMonthRevenue);
  const ordersChange = percentChange(stats.monthlyOrders, stats.previousMonthOrders);
  const customersChange = percentChange(stats.newCustomersThisMonth, stats.newCustomersLastMonth);
  const avgOrder = stats.monthlyOrders > 0 ? stats.monthlyRevenue / stats.monthlyOrders : 0;
  const prevAvgOrder = stats.previousMonthOrders > 0 ? stats.previousMonthRevenue / stats.previousMonthOrders : 0;
  const avgOrderChange = percentChange(avgOrder, prevAvgOrder);

  const statusPieData = ordersByStatus.map((s: { status: string; count: number }) => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || "#94a3b8",
  }));

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Aylik Gelir"
          value={`${formatCurrency(stats.monthlyRevenue)} TL`}
          trend={{ value: Math.abs(revenueChange), isPositive: revenueChange >= 0 }}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="bg-success/10 text-success"
        />
        <StatCard
          label="Aylik Siparis"
          value={stats.monthlyOrders}
          trend={{ value: Math.abs(ordersChange), isPositive: ordersChange >= 0 }}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          label="Yeni Musteri"
          value={stats.newCustomersThisMonth}
          trend={{ value: Math.abs(customersChange), isPositive: customersChange >= 0 }}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          color="bg-purple-500/10 text-purple-500"
        />
        <StatCard
          label="Ort. Siparis"
          value={`${formatCurrency(avgOrder)} TL`}
          trend={{ value: Math.abs(avgOrderChange), isPositive: avgOrderChange >= 0 }}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          color="bg-warning/10 text-warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4">30 Gunluk Gelir Trendi</h3>
          <RevenueLineChart data={dailyRevenue} height={300} />
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4">Siparis Durumlari</h3>
          <StatusPieChart data={statusPieData} height={300} innerRadius={40} outerRadius={80} />
        </div>
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Son Siparisler */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Son Siparisler</h3>
            <Link href="/admin/siparisler" className="text-xs text-primary hover:underline">
              Tumu →
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 font-medium">Siparis</th>
                    <th className="text-left py-2 font-medium">Musteri</th>
                    <th className="text-right py-2 font-medium">Tutar</th>
                    <th className="text-center py-2 font-medium">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o: { id: string; orderNumber: string; customerName: string; total: number; status: string; createdAt: string }) => (
                    <tr key={o.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2">
                        <Link href={`/admin/siparisler/${o.id}`} className="text-primary hover:underline">
                          #{o.orderNumber}
                        </Link>
                      </td>
                      <td className="py-2">{o.customerName}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(o.total)} TL</td>
                      <td className="py-2 text-center">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${STATUS_COLORS[o.status] || "#94a3b8"}15`,
                            color: STATUS_COLORS[o.status] || "#94a3b8",
                          }}
                        >
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Henuz siparis yok.</p>
          )}
        </div>

        {/* Dusuk Stok Uyarilari */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Dusuk Stok Uyarilari</h3>
            <Link href="/admin/urunler" className="text-xs text-primary hover:underline">
              Tumu →
            </Link>
          </div>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-2">
              {lowStockProducts.map((p: { id: string; name: string; slug: string; stock: number; price: number }) => (
                <Link
                  key={p.id}
                  href={`/admin/urunler/${p.id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm truncate flex-1">{p.name}</span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      p.stock === 0
                        ? "bg-danger/10 text-danger"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {p.stock === 0 ? "Tukendi" : `${p.stock} adet`}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Dusuk stoklu urun yok.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
