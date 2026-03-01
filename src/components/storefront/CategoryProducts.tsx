"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import ProductCard from "./ProductCard";
import { Link } from "@/i18n/navigation";

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
    avgRating?: number;
    reviewCount?: number;
  }[];
  brands: { name: string; slug: string; count: number }[];
  total: number;
  page: number;
  totalPages: number;
  currentSort: string;
  categorySlug: string;
  currentBrands: string[];
  minPrice?: number;
  maxPrice?: number;
  currentInStock: boolean;
  inStockCount: number;
}

export default function CategoryProducts({
  products,
  brands,
  total,
  page,
  totalPages,
  currentSort,
  categorySlug,
  currentBrands,
  minPrice,
  maxPrice,
  currentInStock,
  inStockCount,
}: CategoryProductsProps) {
  const t = useTranslations("filter");
  const router = useRouter();
  const [filterOpen, setFilterOpen] = useState(false);
  const [localMin, setLocalMin] = useState(minPrice?.toString() || "");
  const [localMax, setLocalMax] = useState(maxPrice?.toString() || "");

  const activeFilterCount =
    currentBrands.length +
    (minPrice !== undefined || maxPrice !== undefined ? 1 : 0) +
    (currentInStock ? 1 : 0);

  const buildUrl = (params: Record<string, string | undefined>): any => {
    const base = `/kategori/${categorySlug}`;
    const sp = new URLSearchParams();
    const allParams: Record<string, string | undefined> = {
      siralama: currentSort !== "newest" ? currentSort : undefined,
      marka: currentBrands.length > 0 ? currentBrands.join(",") : undefined,
      min: minPrice?.toString(),
      max: maxPrice?.toString(),
      stok: currentInStock ? "1" : undefined,
      ...params,
    };
    Object.entries(allParams).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });
    const qs = sp.toString();
    return qs ? `${base}?${qs}` : base;
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

      {/* Sidebar Filters */}
      <aside className={`w-full md:w-56 shrink-0 space-y-6 ${filterOpen ? "block" : "hidden md:block"}`}>
        {/* Aktif Filtre Çipleri */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {currentBrands.map((slug) => {
              const brand = brands.find((b) => b.slug === slug);
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
            {(minPrice !== undefined || maxPrice !== undefined) && (
              <Link
                href={buildUrl({ min: undefined, max: undefined, sayfa: undefined })}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full hover:bg-primary/20"
              >
                {minPrice || 0}₺ - {maxPrice || "∞"}₺ <span className="font-bold">×</span>
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

        {/* Brand Filter - Checkboxes */}
        {brands.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-3">{t("brand")}</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {brands.map((brand) => (
                <label key={brand.slug} className="flex items-center gap-2 text-sm cursor-pointer">
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

        {/* Price Filter */}
        <div>
          <h3 className="font-semibold text-sm mb-3">{t("priceRange")}</h3>
          {/* Preset butonları */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[
              { label: t("allPrices"), min: undefined, max: undefined },
              { label: "0 - 100₺", min: "0", max: "100" },
              { label: "100 - 500₺", min: "100", max: "500" },
              { label: "500 - 1000₺", min: "500", max: "1000" },
              { label: "1000₺+", min: "1000", max: undefined },
            ].map((range) => {
              const isActive =
                (range.min === minPrice?.toString() && range.max === maxPrice?.toString()) ||
                (!range.min && !minPrice && !maxPrice);
              return (
                <button
                  key={range.label}
                  onClick={() =>
                    router.push(buildUrl({ min: range.min, max: range.max, sayfa: undefined }))
                  }
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    isActive
                      ? "bg-primary text-white border-primary"
                      : "border-border hover:border-primary hover:text-primary"
                  }`}
                >
                  {range.label}
                </button>
              );
            })}
          </div>
          {/* Özel min/max */}
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

        {/* Stock Filter */}
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
            <span className="text-xs text-muted-foreground">({inStockCount})</span>
          </label>
        </div>
      </aside>

      {/* Products Grid */}
      <div className="flex-1">
        {/* Sort Bar */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
          <p className="text-sm text-muted-foreground">{t("productCount", { count: total })}</p>
          <select
            value={currentSort}
            onChange={(e) => router.push(buildUrl({ siralama: e.target.value, sayfa: undefined }))}
            className="text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="newest">{t("sortNewest")}</option>
            <option value="price-asc">{t("sortPriceAsc")}</option>
            <option value="price-desc">{t("sortPriceDesc")}</option>
            <option value="name">{t("sortAZ")}</option>
            <option value="popular">{t("sortPopular")}</option>
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
            <p>{t("noProducts")}</p>
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
