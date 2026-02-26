"use client";

import Link from "next/link";

interface ReportDashboardProps {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function ReportDashboard({
  totalOrders,
  totalRevenue,
  totalCustomers,
  totalProducts,
}: ReportDashboardProps) {
  const statCards = [
    {
      label: "Toplam Siparis",
      value: totalOrders.toLocaleString("tr-TR"),
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      ),
    },
    {
      label: "Toplam Ciro",
      value: `${formatCurrency(totalRevenue)} TL`,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: "Toplam Musteri",
      value: totalCustomers.toLocaleString("tr-TR"),
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      label: "Toplam Urun",
      value: totalProducts.toLocaleString("tr-TR"),
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
    },
  ];

  const reportLinks = [
    {
      href: "/admin/raporlar/satis",
      title: "Satis Raporu",
      description: "Gunluk, haftalik ve aylik satis istatistikleri",
    },
    {
      href: "/admin/raporlar/urunler",
      title: "Urun Performansi",
      description: "En cok satan urunler ve gelir analizi",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="text-muted-foreground mb-2">{card.icon}</div>
            <p className="text-muted-foreground text-sm">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Report Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{link.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {link.description}
                  </p>
                </div>
                <span className="text-muted-foreground text-xl">&rarr;</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
