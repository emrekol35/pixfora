import Link from "next/link";
import { prisma } from "@/lib/db";
import { addRatingToProducts } from "@/lib/product-helpers";
import type { Metadata } from "next";
import SearchResults from "@/components/storefront/SearchResults";
import {
  parseSearchParams,
  buildBaseSearchWhere,
  buildFilteredSearchWhere,
  buildSearchOrderBy,
  resolveCategorySlugs,
  resolveBrandSlugs,
  computeFacets,
} from "@/lib/search-helpers";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  return {
    title: sp.q ? `"${sp.q}" icin arama sonuclari` : "Arama",
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filters = parseSearchParams(sp);

  // Boş sorgu: arama formu göster
  if (!filters.q || filters.q.length < 2) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="text-sm mb-6">
          <ol className="flex items-center gap-2 text-muted-foreground">
            <li><Link href="/" className="hover:text-primary">Anasayfa</Link></li>
            <li>/</li>
            <li className="text-foreground font-medium">Arama</li>
          </ol>
        </nav>

        <h1 className="text-2xl font-bold mb-2">Urun Ara</h1>
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
      </div>
    );
  }

  const skip = (filters.page - 1) * filters.limit;

  // Slug'ları ID'lere çevir
  const [categoryIds, brandIds] = await Promise.all([
    resolveCategorySlugs(filters.categories),
    resolveBrandSlugs(filters.brands),
  ]);

  // Base where (facetler için) ve Filtered where (sonuçlar için)
  const baseWhere = buildBaseSearchWhere(filters.q);
  const filteredWhere = buildFilteredSearchWhere(baseWhere, categoryIds, brandIds, filters);
  const orderBy = buildSearchOrderBy(filters.sort);

  // Paralel: ürünler + toplam + facetler
  const [products, total, facets] = await Promise.all([
    prisma.product.findMany({
      where: filteredWhere,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        category: { select: { name: true } },
        brand: { select: { name: true } },
        reviews: { where: { isApproved: true }, select: { rating: true } },
      },
      orderBy,
      take: filters.limit,
      skip,
    }),
    prisma.product.count({ where: filteredWhere }),
    computeFacets(baseWhere),
  ]);

  const totalPages = Math.ceil(total / filters.limit);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="text-sm mb-6">
        <ol className="flex items-center gap-2 text-muted-foreground">
          <li><Link href="/" className="hover:text-primary">Anasayfa</Link></li>
          <li>/</li>
          <li className="text-foreground font-medium">Arama</li>
        </ol>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">
          &ldquo;{filters.q}&rdquo; icin arama sonuclari
        </h1>
      </div>

      <SearchResults
        products={addRatingToProducts(products)}
        facets={facets}
        total={total}
        page={filters.page}
        totalPages={totalPages}
        currentQuery={filters.q}
        currentCategories={filters.categories}
        currentBrands={filters.brands}
        currentMinPrice={filters.minPrice}
        currentMaxPrice={filters.maxPrice}
        currentInStock={filters.inStockOnly}
        currentSort={filters.sort}
      />
    </div>
  );
}
