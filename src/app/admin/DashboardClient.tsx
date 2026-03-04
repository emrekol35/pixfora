"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useDashboardStats } from "@/hooks/useReportData";
import { formatCurrency, percentChange } from "@/lib/utils";
import StatCard from "@/components/admin/StatCard";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  PAYMENT_LABELS,
  CHART_COLORS,
} from "@/components/admin/charts/ChartColors";

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
  const [conversionRate, setConversionRate] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics/funnel")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((json) => {
        if (json?.funnel?.length >= 2) {
          const first = json.funnel[0]?.visitors || 0;
          const last = json.funnel[json.funnel.length - 1]?.visitors || 0;
          setConversionRate(first > 0 ? (last / first) * 100 : 0);
        }
      })
      .catch(() => {});
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Uyari skeleton */}
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 bg-muted rounded-full w-44 animate-pulse" />
          ))}
        </div>
        {/* Bugun skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="h-3 bg-muted rounded w-20 mb-3" />
              <div className="h-7 bg-muted rounded w-28" />
            </div>
          ))}
        </div>
        {/* Stat card skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-3" />
              <div className="h-8 bg-muted rounded w-32" />
            </div>
          ))}
        </div>
        {/* Chart skeleton */}
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

  const {
    stats,
    recentOrders,
    lowStockProducts,
    dailyRevenue,
    ordersByStatus,
    topSellingProducts,
    paymentMethodDistribution,
  } = data;

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paymentPieData = (paymentMethodDistribution || []).map((pm: any) => ({
    name: PAYMENT_LABELS[pm.method] || pm.method,
    value: pm.count,
    color:
      pm.method === "CREDIT_CARD"
        ? CHART_COLORS.primary
        : pm.method === "BANK_TRANSFER"
          ? CHART_COLORS.success
          : CHART_COLORS.warning,
  }));

  const hasAlerts =
    stats.pendingOrderCount > 0 ||
    stats.pendingShipments > 0 ||
    stats.pendingReturns > 0 ||
    lowStockProducts.length > 0;

  return (
    <div className="space-y-6">
      {/* 1. Uyari Cubugu */}
      {hasAlerts && (
        <div className="flex flex-wrap gap-3">
          {stats.pendingOrderCount > 0 && (
            <Link
              href="/admin/siparisler"
              className="flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning border border-warning/20 rounded-full text-sm font-medium hover:bg-warning/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {stats.pendingOrderCount} Onay Bekleyen Siparis
            </Link>
          )}
          {stats.pendingShipments > 0 && (
            <Link
              href="/admin/kargo"
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
              {stats.pendingShipments} Bekleyen Kargo
            </Link>
          )}
          {stats.pendingReturns > 0 && (
            <Link
              href="/admin/iadeler"
              className="flex items-center gap-2 px-4 py-2 bg-danger/10 text-danger border border-danger/20 rounded-full text-sm font-medium hover:bg-danger/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              {stats.pendingReturns} Bekleyen Iade
            </Link>
          )}
          {lowStockProducts.length > 0 && (
            <Link
              href="/admin/urunler"
              className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-full text-sm font-medium hover:bg-orange-500/20 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              {lowStockProducts.length} Dusuk Stok
            </Link>
          )}
        </div>
      )}

      {/* 2. Bugunun Ozeti */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">Bugun Gelir</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(stats.todayRevenue || 0)} TL</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">Bugun Siparis</span>
          </div>
          <p className="text-2xl font-bold">{stats.todayOrders || 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">Bugun Ziyaretci</span>
          </div>
          <p className="text-2xl font-bold">{stats.todayVisitors ?? 0}</p>
        </div>
      </div>

      {/* 3. Aylik Stat Cards (mevcut) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-xs font-medium text-muted-foreground">Donusum Orani</span>
          </div>
          <p className="text-2xl font-bold">
            {conversionRate !== null ? `%${conversionRate.toFixed(2)}` : "-"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">son 30 gun</p>
        </div>
      </div>

      {/* 4. Charts Row (mevcut) */}
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

      {/* 5. En Cok Satanlar + Odeme Yontemleri (yeni) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* En Cok Satan Urunler */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">En Cok Satan Urunler</h3>
            <Link href="/admin/raporlar/urunler" className="text-xs text-primary hover:underline">
              Detayli Rapor →
            </Link>
          </div>
          {topSellingProducts && topSellingProducts.length > 0 ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {topSellingProducts.map((p: any, i: number) => (
                <Link
                  key={p.id}
                  href={`/admin/urunler/${p.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-bold text-muted-foreground w-5 text-center">
                    {i + 1}
                  </span>
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded object-cover shrink-0"
                      unoptimized={p.image.startsWith("/uploads")}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(p.price)} TL
                    </p>
                  </div>
                  <span className="text-sm font-bold text-foreground shrink-0">
                    {p.salesCount} satis
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Henuz satis verisi yok.
            </p>
          )}
        </div>

        {/* Odeme Yontemleri */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4">Odeme Yontemleri</h3>
          {paymentPieData.length > 0 ? (
            <StatusPieChart data={paymentPieData} height={280} innerRadius={35} outerRadius={70} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Henuz odeme verisi yok.
            </p>
          )}
        </div>
      </div>

      {/* 6. Recent Orders & Low Stock (mevcut) */}
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

      {/* 7. Hizli Erisim (yeni) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/admin/urunler/yeni"
          className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-sm font-medium">Yeni Urun Ekle</span>
        </Link>
        <Link
          href="/admin/siparisler"
          className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <div className="p-2 rounded-lg bg-success/10 text-success">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <span className="text-sm font-medium">Siparisler</span>
        </Link>
        <Link
          href="/admin/raporlar"
          className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="text-sm font-medium">Raporlar</span>
        </Link>
        <Link
          href="/admin/musteriler"
          className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <div className="p-2 rounded-lg bg-warning/10 text-warning">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-sm font-medium">Musteriler</span>
        </Link>
      </div>
    </div>
  );
}
