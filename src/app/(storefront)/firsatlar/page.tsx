export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { addRatingToProducts } from "@/lib/product-helpers";
import type { Metadata } from "next";
import HomeProducts from "@/components/storefront/HomeProducts";

export const metadata: Metadata = {
  title: "Firsatlar",
  description: "Indirimli urunler ve ozel firsatlar",
};

interface Props {
  searchParams: Promise<{ sayfa?: string; siralama?: string }>;
}

export default async function DealsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = parseInt(sp.sayfa || "1");
  const sort = sp.siralama || "newest";
  const limit = 20;
  const skip = (page - 1) * limit;

  let orderByClause: Prisma.Sql;
  switch (sort) {
    case "price-asc":
      orderByClause = Prisma.sql`price ASC`;
      break;
    case "price-desc":
      orderByClause = Prisma.sql`price DESC`;
      break;
    case "discount":
      orderByClause = Prisma.sql`(compare_price - price) / compare_price DESC`;
      break;
    default:
      orderByClause = Prisma.sql`created_at DESC`;
  }

  const rawIds = await prisma.$queryRaw<{ id: string }[]>(
    Prisma.sql`SELECT id FROM products WHERE is_active = true AND compare_price IS NOT NULL AND compare_price > price ORDER BY ${orderByClause} LIMIT ${limit} OFFSET ${skip}`
  );

  const rawCount = await prisma.$queryRaw<[{ count: bigint }]>(
    Prisma.sql`SELECT COUNT(*) as count FROM products WHERE is_active = true AND compare_price IS NOT NULL AND compare_price > price`
  );

  const ids = rawIds.map((p) => p.id);
  const total = Number(rawCount[0].count);
  const totalPages = Math.ceil(total / limit);

  const products = ids.length > 0
    ? await prisma.product.findMany({
        where: { id: { in: ids } },
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
          category: { select: { name: true } },
          brand: { select: { name: true } },
          reviews: { where: { isApproved: true }, select: { rating: true } },
        },
      })
    : [];

  // Re-sort to match raw query order
  const productMap = new Map(products.map((p) => [p.id, p]));
  const sortedProducts = ids.map((id) => productMap.get(id)!).filter(Boolean);

  const sortOptions = [
    { value: "newest", label: "En Yeni" },
    { value: "price-asc", label: "Fiyat (Artan)" },
    { value: "price-desc", label: "Fiyat (Azalan)" },
    { value: "discount", label: "En Yuksek Indirim" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="text-sm mb-6">
        <ol className="flex items-center gap-2 text-muted-foreground">
          <li><Link href="/" className="hover:text-primary">Anasayfa</Link></li>
          <li>/</li>
          <li className="text-foreground font-medium">Firsatlar</li>
        </ol>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Firsatlar</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} indirimli urun</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Siralama:</label>
          <div className="flex gap-1 flex-wrap">
            {sortOptions.map((opt) => (
              <Link
                key={opt.value}
                href={`/firsatlar?siralama=${opt.value}${page > 1 ? `&sayfa=1` : ""}`}
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

      {sortedProducts.length > 0 ? (
        <HomeProducts products={addRatingToProducts(sortedProducts)} />
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6h.008v.008H6V6z" />
          </svg>
          <p className="text-lg font-medium mb-1">Henuz indirimli urun yok</p>
          <p className="text-sm">Firsatlar icin tekrar kontrol edin.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Link
              href={`/firsatlar?siralama=${sort}&sayfa=${page - 1}`}
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
              href={`/firsatlar?siralama=${sort}&sayfa=${page + 1}`}
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
