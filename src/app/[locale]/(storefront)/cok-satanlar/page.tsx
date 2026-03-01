export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import { addRatingToProducts } from "@/lib/product-helpers";
import type { Metadata } from "next";
import HomeProducts from "@/components/storefront/HomeProducts";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "Cok Satanlar",
  description: "En cok satan urunlerimiz",
  alternates: { canonical: "/cok-satanlar" },
};

interface Props {
  searchParams: Promise<{ sayfa?: string; siralama?: string }>;
}

export default async function BestSellersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = parseInt(sp.sayfa || "1");
  const sort = sp.siralama || "best-selling";
  const limit = 20;
  const skip = (page - 1) * limit;

  const where = {
    isActive: true,
    salesCount: { gt: 0 },
  };

  type OrderBy = { salesCount?: "asc" | "desc"; createdAt?: "asc" | "desc"; price?: "asc" | "desc"; name?: "asc" | "desc" };
  let orderBy: OrderBy;
  switch (sort) {
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "price-asc":
      orderBy = { price: "asc" };
      break;
    case "price-desc":
      orderBy = { price: "desc" };
      break;
    default:
      orderBy = { salesCount: "desc" };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        category: { select: { name: true } },
        brand: { select: { name: true } },
        reviews: { where: { isApproved: true }, select: { rating: true } },
      },
      orderBy,
      take: limit,
      skip,
    }),
    prisma.product.count({ where }),
  ]);

  // i18n: DB çevirilerini uygula
  const locale = await getLocale();
  if (locale !== "tr") {
    const { getBulkTranslations } = await import("@/lib/translations");
    const translations = await getBulkTranslations("product", products.map(p => p.id), locale);
    for (const product of products) {
      const tr = translations.get(product.id);
      if (tr?.name) (product as any).name = tr.name;
    }
  }

  const totalPages = Math.ceil(total / limit);

  const sortOptions = [
    { value: "best-selling", label: "Cok Satan" },
    { value: "newest", label: "En Yeni" },
    { value: "price-asc", label: "Fiyat (Artan)" },
    { value: "price-desc", label: "Fiyat (Azalan)" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="text-sm mb-6">
        <ol className="flex items-center gap-2 text-muted-foreground">
          <li><Link href="/" className="hover:text-primary">Anasayfa</Link></li>
          <li>/</li>
          <li className="text-foreground font-medium">Cok Satanlar</li>
        </ol>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Cok Satanlar</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} populer urun</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Siralama:</label>
          <div className="flex gap-1 flex-wrap">
            {sortOptions.map((opt) => (
              <Link
                key={opt.value}
                href={`/cok-satanlar?siralama=${opt.value}${page > 1 ? `&sayfa=1` : ""}`}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  sort === opt.value
                    ? "bg-primary text-white border-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {products.length > 0 ? (
        <HomeProducts products={addRatingToProducts(products)} />
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
          </svg>
          <p className="text-lg font-medium mb-1">Henuz satis verisi yok</p>
          <p className="text-sm">Cok satan urunler burada listelenecek.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Link
              href={`/cok-satanlar?siralama=${sort}&sayfa=${page - 1}`}
              className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted"
            >
              ← Onceki
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Sayfa {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/cok-satanlar?siralama=${sort}&sayfa=${page + 1}`}
              className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted"
            >
              Sonraki →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
