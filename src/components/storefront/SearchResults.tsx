"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ProductCard from "./ProductCard";
import type { FacetData } from "@/lib/search-helpers";

interface ProductItem {
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
  avgRating?: number;
  reviewCount?: number;
}

interface SearchResultsProps {
  products: ProductItem[];
  facets: FacetData | null;
  total: number;
  page: number;
  totalPages: number;
  currentQuery: string;
  currentCategories: string[];
  currentBrands: string[];
  currentMinPrice?: number;
  currentMaxPrice?: number;
  currentInStock: boolean;
  currentSort: string;
}

export default function SearchResults({
  products,
  facets,
  total,
  page,
  totalPages,
  currentQuery,
  currentCategories,
  currentBrands,
  currentMinPrice,
  currentMaxPrice,
  currentInStock,
  currentSort,
}: SearchResultsProps) {
  const t = useTranslations("filter");
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);
  const [localMin, setLocalMin] = useState(currentMinPrice?.toString() || "");
  const [localMax, setLocalMax] = useState(currentMaxPrice?.toString() || "");

  // Aktif filtre sayısı
  const activeFilterCount =
    currentCategories.length +
    currentBrands.length +
    (currentMinPrice !== undefined || currentMaxPrice !== undefined ? 1 : 0) +
    (currentInStock ? 1 : 0);

  const buildUrl = (params: Record<string, string | undefined>): any => {
    const sp = new URLSearchParams();
    const allParams: Record<string, string | undefined> = {
      q: currentQuery,
      kategori: currentCategories.length > 0 ? currentCategories.join(",") : undefined,
      marka: currentBrands.length > 0 ? currentBrands.join(",") : undefined,
      min: currentMinPrice?.toString(),
      max: currentMaxPrice?.toString(),
      stok: currentInStock ? "1" : undefined,
      siralama: currentSort !== "ilgili" ? currentSort : undefined,
      ...params,
    };
    Object.entries(allParams).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });
    const qs = sp.toString();
    return qs ? `/arama?${qs}` : "/arama";
  };

  const toggleCategory = (slug: string) => {
    const next = currentCategories.includes(slug)
      ? currentCategories.filter((s) => s !== slug)
      : [...currentCategories, slug];
    router.push(buildUrl({ kategori: next.length > 0 ? next.join(",") : undefined, sayfa: undefined }));
  };

  const toggleBrand = (slug: string) => {
    const next = currentBrands.includes(slug)
      ? currentBrands.filter((s) => s !== slug)
      : [...currentBrands, slug];
    router.push(buildUrl({ marka: next.length > 0 ? next.join(",") : undefined, sayfa: undefined }));
  };

  const applyPrice = () => {
    router.push(
      buildUrl({
        min: localMin || undefined,
        max: localMax || undefined,
        sayfa: undefined,
      })
    );
  };

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Mobile Filter Toggle */}
      <button
        onClick={() => setFilterOpen(!filterOpen)}
        className="md:hidden flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {t("filters")} {activeFilterCount > 0 && `(${activeFilterCount})`}
      </button>

      {/* Sidebar */}
      <aside className={`w-full md:w-64 shrink-0 space-y-6 ${filterOpen ? "block" : "hidden md:block"}`}>
        {/* Aktif Filtre Çipleri */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {currentCategories.map((slug) => {
              const cat = facets?.categories.find((c) => c.slug === slug);
              return cat ? (
                <Link
                  key={slug}
                  href={buildUrl({
                    kategori: currentCategories.filter((s) => s !== slug).join(",") || undefined,
                    sayfa: undefined,
                  })}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full hover:bg-primary/20"
                >
                  {cat.name} <span className="font-bold">×</span>
                </Link>
              ) : null;
            })}
            {currentBrands.map((slug) => {
              const brand = facets?.brands.find((b) => b.slug === slug);
              return brand ? (
                <Link
                  key={slug}
                  href={buildUrl({
                    marka: currentBrands.filter((s) => s !== slug).join(",") || undefined,
                    sayfa: undefined,
                  })}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full hover:bg-primary/20"
                >
                  {brand.name} <span className="font-bold">×</span>
                </Link>
              ) : null;
            })}
            {(currentMinPrice !== undefined || currentMaxPrice !== undefined) && (
              <Link
                href={buildUrl({ min: undefined, max: undefined, sayfa: undefined })}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full hover:bg-primary/20"
              >
                {currentMinPrice || 0}₺ - {currentMaxPrice || "∞"}₺ <span className="font-bold">×</span>
              </Link>
            )}
            {currentInStock && (
              <Link
                href={buildUrl({ stok: undefined, sayfa: undefined })}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full hover:bg-primary/20"
              >
                {t("inStock")} <span className="font-bold">×</span>
              </Link>
            )}
            <Link
              href={buildUrl({
                kategori: undefined,
                marka: undefined,
                min: undefined,
                max: undefined,
                stok: undefined,
                sayfa: undefined,
              })}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              {t("clearAll")}
            </Link>
          </div>
        )}

        {/* Kategori Filtresi */}
        {facets && facets.categories.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-3">{t("category")}</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {facets.categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentCategories.includes(cat.slug)}
                    onChange={() => toggleCategory(cat.slug)}
                    className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                  />
                  <span
                    className={
                      currentCategories.includes(cat.slug)
                        ? "text-primary font-medium"
                        : "text-foreground"
                    }
                  >
                    {cat.name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">({cat.count})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Marka Filtresi */}
        {facets && facets.brands.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-3">{t("brand")}</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {facets.brands.map((brand) => (
                <label key={brand.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentBrands.includes(brand.slug)}
                    onChange={() => toggleBrand(brand.slug)}
                    className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                  />
                  <span
                    className={
                      currentBrands.includes(brand.slug)
                        ? "text-primary font-medium"
                        : "text-foreground"
                    }
                  >
                    {brand.name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">({brand.count})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Fiyat Aralığı */}
        <div>
          <h3 className="font-semibold text-sm mb-3">{t("priceRange")}</h3>
          {facets && facets.priceRange.max > 0 && (
            <p className="text-xs text-muted-foreground mb-2">
              {Math.floor(facets.priceRange.min)}₺ - {Math.ceil(facets.priceRange.max)}₺
            </p>
          )}
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyPrice()}
              className="w-full px-2 py-1.5 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-muted-foreground text-sm">-</span>
            <input
              type="number"
              placeholder="Max"
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyPrice()}
              className="w-full px-2 py-1.5 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={applyPrice}
              className="px-3 py-1.5 bg-primary text-white rounded text-sm hover:bg-primary/90 shrink-0"
            >
              {t("go")}
            </button>
          </div>
        </div>

        {/* Stok Durumu */}
        {facets && (
          <div>
            <h3 className="font-semibold text-sm mb-3">{t("stockStatus")}</h3>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={currentInStock}
                onChange={() =>
                  router.push(buildUrl({ stok: currentInStock ? undefined : "1", sayfa: undefined }))
                }
                className="rounded border-border text-primary focus:ring-primary w-4 h-4"
              />
              <span>{t("inStockOnly")}</span>
              <span className="text-xs text-muted-foreground">({facets.inStockCount})</span>
            </label>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Sort Bar */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
          <p className="text-sm text-muted-foreground">{t("resultCount", { count: total })}</p>
          <select
            value={currentSort}
            onChange={(e) => router.push(buildUrl({ siralama: e.target.value, sayfa: undefined }))}
            className="text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ilgili">{t("sortRelevant")}</option>
            <option value="newest">{t("sortNewest")}</option>
            <option value="price-asc">{t("sortPriceAsc")}</option>
            <option value="price-desc">{t("sortPriceDesc")}</option>
            <option value="name">{t("sortAZ")}</option>
            <option value="popular">{t("sortPopular")}</option>
          </select>
        </div>

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-lg font-medium mb-1">{t("noResults")}</p>
            <p className="text-sm">{t("noResultsHint")}</p>
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
                {t("previous")}
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
                {t("next")}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
