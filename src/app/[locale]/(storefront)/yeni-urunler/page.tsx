export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import { addRatingToProducts } from "@/lib/product-helpers";
import type { Metadata } from "next";
import HomeProducts from "@/components/storefront/HomeProducts";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "Yeni Urunler",
  description: "En yeni urunlerimizi kesfedin",
  alternates: { canonical: "/yeni-urunler" },
};

interface Props {
  searchParams: Promise<{ sayfa?: string; siralama?: string }>;
}

export default async function NewProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = parseInt(sp.sayfa || "1");
  const sort = sp.siralama || "newest";
  const limit = 20;
  const skip = (page - 1) * limit;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const where = {
    isActive: true,
    createdAt: { gte: thirtyDaysAgo },
  };

  type OrderBy = { createdAt?: "asc" | "desc"; price?: "asc" | "desc"; name?: "asc" | "desc" };
  let orderBy: OrderBy;
  switch (sort) {
    case "price-asc":
      orderBy = { price: "asc" };
      break;
    case "price-desc":
      orderBy = { price: "desc" };
      break;
    case "name":
      orderBy = { name: "asc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
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
    { value: "newest", label: "En Yeni" },
    { value: "price-asc", label: "Fiyat (Artan)" },
    { value: "price-desc", label: "Fiyat (Azalan)" },
    { value: "name", label: "Isme Gore (A-Z)" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="text-sm mb-6">
        <ol className="flex items-center gap-2 text-muted-foreground">
          <li><Link href="/" className="hover:text-primary">Anasayfa</Link></li>
          <li>/</li>
          <li className="text-foreground font-medium">Yeni Urunler</li>
        </ol>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Yeni Urunler</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} yeni urun</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Siralama:</label>
          <div className="flex gap-1 flex-wrap">
            {sortOptions.map((opt) => (
              <Link
                key={opt.value}
                href={`/yeni-urunler?siralama=${opt.value}${page > 1 ? `&sayfa=1` : ""}`}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium mb-1">Henuz yeni urun eklenmemis</p>
          <p className="text-sm">Son 30 gunde eklenen urunler burada gorunecek.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Link
              href={`/yeni-urunler?siralama=${sort}&sayfa=${page - 1}`}
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
              href={`/yeni-urunler?siralama=${sort}&sayfa=${page + 1}`}
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
