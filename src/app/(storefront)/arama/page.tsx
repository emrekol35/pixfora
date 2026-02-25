import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import HomeProducts from "@/components/storefront/HomeProducts";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string; sayfa?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  return {
    title: sp.q ? `"${sp.q}" icin arama sonuclari` : "Arama",
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const query = sp.q || "";
  const page = parseInt(sp.sayfa || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  let products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice: number | null;
    stock: number;
    minQty: number;
    maxQty: number | null;
    isFeatured: boolean;
    images: { url: string; alt: string | null }[];
    category: { name: string } | null;
    brand: { name: string } | null;
  }[] = [];
  let total = 0;

  if (query.length >= 2) {
    const where = {
      isActive: true,
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { description: { contains: query, mode: "insensitive" as const } },
        { sku: { contains: query, mode: "insensitive" as const } },
        { tags: { some: { tag: { contains: query, mode: "insensitive" as const } } } },
        { brand: { name: { contains: query, mode: "insensitive" as const } } },
        { category: { name: { contains: query, mode: "insensitive" as const } } },
      ],
    };

    [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
          category: { select: { name: true } },
          brand: { select: { name: true } },
        },
        orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
        take: limit,
        skip,
      }),
      prisma.product.count({ where }),
    ]);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="text-sm mb-6">
        <ol className="flex items-center gap-2 text-muted-foreground">
          <li><Link href="/" className="hover:text-primary">Anasayfa</Link></li>
          <li>/</li>
          <li className="text-foreground font-medium">Arama</li>
        </ol>
      </nav>

      <h1 className="text-2xl font-bold mb-2">
        {query ? `"${query}" icin arama sonuclari` : "Urun Ara"}
      </h1>
      {query && (
        <p className="text-sm text-muted-foreground mb-8">{total} sonuc bulundu</p>
      )}

      {!query && (
        <div className="max-w-xl mt-8">
          <form action="/arama" method="GET" className="flex gap-2">
            <input
              type="text"
              name="q"
              placeholder="Urun, kategori veya marka ara..."
              className="flex-1 px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              autoFocus
            />
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark"
            >
              Ara
            </button>
          </form>
        </div>
      )}

      {query && products.length > 0 && (
        <>
          <HomeProducts products={products} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {page > 1 && (
                <Link
                  href={`/arama?q=${encodeURIComponent(query)}&sayfa=${page - 1}`}
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
                  href={`/arama?q=${encodeURIComponent(query)}&sayfa=${page + 1}`}
                  className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted"
                >
                  Sonraki →
                </Link>
              )}
            </div>
          )}
        </>
      )}

      {query && products.length === 0 && (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h2 className="text-lg font-medium text-muted-foreground mb-2">
            Sonuc bulunamadi
          </h2>
          <p className="text-sm text-muted-foreground">
            Farkli anahtar kelimeler ile tekrar deneyin.
          </p>
        </div>
      )}
    </div>
  );
}
