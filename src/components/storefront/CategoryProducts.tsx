"use client";

import { useRouter } from "next/navigation";
import ProductCard from "./ProductCard";
import Link from "next/link";

interface CategoryProductsProps {
  products: {
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
  }[];
  brands: { name: string; slug: string }[];
  total: number;
  page: number;
  totalPages: number;
  currentSort: string;
  categorySlug: string;
  currentBrand?: string;
  minPrice?: number;
  maxPrice?: number;
}

export default function CategoryProducts({
  products,
  brands,
  total,
  page,
  totalPages,
  currentSort,
  categorySlug,
  currentBrand,
  minPrice,
  maxPrice,
}: CategoryProductsProps) {
  const router = useRouter();

  const buildUrl = (params: Record<string, string | undefined>) => {
    const base = `/kategori/${categorySlug}`;
    const sp = new URLSearchParams();
    const allParams = {
      siralama: currentSort !== "newest" ? currentSort : undefined,
      marka: currentBrand,
      min: minPrice?.toString(),
      max: maxPrice?.toString(),
      ...params,
    };
    Object.entries(allParams).forEach(([k, v]) => {
      if (v && v !== "newest") sp.set(k, v);
    });
    const qs = sp.toString();
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <aside className="w-full md:w-56 shrink-0 space-y-6">
        {/* Brand Filter */}
        {brands.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-3">Marka</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push(buildUrl({ marka: undefined }))}
                className={`block text-sm ${!currentBrand ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
              >
                Tumu
              </button>
              {brands.map((brand) => (
                <button
                  key={brand.slug}
                  onClick={() => router.push(buildUrl({ marka: brand.slug }))}
                  className={`block text-sm ${currentBrand === brand.slug ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {brand.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price Filter */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Fiyat Araligi</h3>
          <div className="space-y-2">
            {[
              { label: "Tumu", min: undefined, max: undefined },
              { label: "0 - 100 ₺", min: "0", max: "100" },
              { label: "100 - 500 ₺", min: "100", max: "500" },
              { label: "500 - 1000 ₺", min: "500", max: "1000" },
              { label: "1000 ₺+", min: "1000", max: undefined },
            ].map((range) => (
              <button
                key={range.label}
                onClick={() => router.push(buildUrl({ min: range.min, max: range.max, sayfa: undefined }))}
                className={`block text-sm ${
                  (range.min === minPrice?.toString() && range.max === maxPrice?.toString()) ||
                  (!range.min && !minPrice && !maxPrice)
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Products Grid */}
      <div className="flex-1">
        {/* Sort Bar */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
          <p className="text-sm text-muted-foreground">{total} urun</p>
          <select
            value={currentSort}
            onChange={(e) => router.push(buildUrl({ siralama: e.target.value, sayfa: undefined }))}
            className="text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="newest">En Yeni</option>
            <option value="price-asc">Fiyat (Dusuk → Yuksek)</option>
            <option value="price-desc">Fiyat (Yuksek → Dusuk)</option>
            <option value="name">A-Z</option>
            <option value="popular">Populer</option>
          </select>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <svg className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>Bu kategoride henuz urun bulunmuyor</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {page > 1 && (
              <Link
                href={buildUrl({ sayfa: String(page - 1) })}
                className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted"
              >
                ← Onceki
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showDots = prev && p - prev > 1;
                return (
                  <span key={p} className="flex items-center gap-2">
                    {showDots && <span className="text-muted-foreground">...</span>}
                    <Link
                      href={buildUrl({ sayfa: String(p) })}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${
                        p === page
                          ? "bg-primary text-white"
                          : "border border-border hover:bg-muted"
                      }`}
                    >
                      {p}
                    </Link>
                  </span>
                );
              })}
            {page < totalPages && (
              <Link
                href={buildUrl({ sayfa: String(page + 1) })}
                className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted"
              >
                Sonraki →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
