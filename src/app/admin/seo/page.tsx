export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import RedirectList from "./RedirectList";

async function getData() {
  const [redirects, totalProducts, missingProductSeo, totalCategories, missingCategorySeo] =
    await Promise.all([
      prisma.redirect.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.product.count(),
      prisma.product.count({ where: { seoTitle: null } }),
      prisma.category.count(),
      prisma.category.count({ where: { seoTitle: null } }),
    ]);

  return { redirects, totalProducts, missingProductSeo, totalCategories, missingCategorySeo };
}

export default async function SeoPage() {
  const { redirects, totalProducts, missingProductSeo, totalCategories, missingCategorySeo } =
    await getData();

  const stats = [
    {
      label: "Urunler",
      total: totalProducts,
      missing: missingProductSeo,
      color: missingProductSeo > 0 ? "text-warning" : "text-success",
    },
    {
      label: "Kategoriler",
      total: totalCategories,
      missing: missingCategorySeo,
      color: missingCategorySeo > 0 ? "text-warning" : "text-success",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">SEO Yonetimi</h1>

      {/* SEO Durumu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</h3>
            <p className="text-2xl font-bold">{stat.total - stat.missing} / {stat.total}</p>
            <p className={`text-sm ${stat.color}`}>
              {stat.missing > 0
                ? `${stat.missing} urun/kategori SEO basliksiz`
                : "Tum SEO alanlari dolu"}
            </p>
          </div>
        ))}
      </div>

      {/* Yonlendirmeler */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">URL Yonlendirmeleri</h2>
        <Link
          href="/admin/seo/yeni"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          + Yeni Yonlendirme
        </Link>
      </div>
      <RedirectList redirects={redirects.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }))} />
    </div>
  );
}
