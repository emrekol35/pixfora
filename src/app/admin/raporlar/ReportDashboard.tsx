"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useOverviewReport } from "@/hooks/useReportData";
import StatCard from "@/components/admin/StatCard";
import { formatCurrency } from "@/lib/utils";

const RevenueComparisonChart = dynamic(
  () => import("./RevenueComparisonChart"),
  { ssr: false }
);

interface KPI {
  label: string;
  value: number;
  change: number;
  isCurrency: boolean;
}

const reportLinks = [
  {
    href: "/admin/raporlar/satis",
    title: "Satis Raporu",
    description: "Gunluk, haftalik ve aylik satis istatistikleri",
    icon: "📊",
  },
  {
    href: "/admin/raporlar/urunler",
    title: "Urun Performansi",
    description: "En cok satan urunler ve gelir analizi",
    icon: "📦",
  },
  {
    href: "/admin/raporlar/musteriler",
    title: "Musteri Analizi",
    description: "Musteri segmentasyonu, trendler ve degerli musteriler",
    icon: "👥",
  },
];

const KPI_ICONS = ["💰", "📦", "📊", "👤", "🛍️", "⏳"];
const KPI_COLORS = [
  "bg-green-500/10 text-green-600",
  "bg-blue-500/10 text-blue-600",
  "bg-purple-500/10 text-purple-600",
  "bg-cyan-500/10 text-cyan-600",
  "bg-orange-500/10 text-orange-600",
  "bg-yellow-500/10 text-yellow-600",
];

export default function ReportDashboard() {
  const { data, isLoading } = useOverviewReport();

  const kpis: KPI[] = data?.kpis || [];
  const revenueComparison = data?.revenueComparison || [];
  const quickStats = data?.quickStats || {
    topProduct: "-",
    topCategory: "-",
    pendingReviews: 0,
    pendingOrders: 0,
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Yukleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Kartlari */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={
              kpi.isCurrency
                ? `${formatCurrency(kpi.value)} TL`
                : kpi.value.toLocaleString("tr-TR")
            }
            icon={<span className="text-lg">{KPI_ICONS[i] || "📌"}</span>}
            color={KPI_COLORS[i] || "bg-gray-500/10 text-gray-600"}
            trend={
              kpi.change !== 0
                ? { value: Math.abs(kpi.change), isPositive: kpi.change > 0 }
                : undefined
            }
          />
        ))}
      </div>

      {/* Gelir Karsilastirma */}
      {revenueComparison.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            Gelir Karsilastirmasi (Bu Donem vs Onceki Donem)
          </h2>
          <RevenueComparisonChart data={revenueComparison} />
        </div>
      )}

      {/* Hizli Bilgiler */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">
            En Cok Satan Urun
          </p>
          <p className="text-sm font-semibold truncate" title={quickStats.topProduct}>
            {quickStats.topProduct}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Top Kategori</p>
          <p className="text-sm font-semibold">{quickStats.topCategory}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">
            Bekleyen Yorum
          </p>
          <p className="text-sm font-semibold">{quickStats.pendingReviews}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">
            Bekleyen Siparis
          </p>
          <p className="text-sm font-semibold">{quickStats.pendingOrders}</p>
        </div>
      </div>

      {/* Rapor Linkleri */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Detayli Raporlar</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <div className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-colors cursor-pointer h-full">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{link.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold">{link.title}</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      {link.description}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-lg mt-1">
                    &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
