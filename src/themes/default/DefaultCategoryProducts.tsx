"use client";

import { useTranslations } from "next-intl";
import ProductCard from "@/components/storefront/ProductCard";
import { Link } from "@/i18n/navigation";
import {
  useCategoryLogic,
  type CategoryProductsProps,
} from "@/themes/hooks/useCategoryLogic";

export default function DefaultCategoryProducts(props: CategoryProductsProps) {
  const t = useTranslations("filter");
  const h = useCategoryLogic(props);

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Mobile Filter Toggle */}
      <button
        onClick={h.toggleFilter}
        className="md:hidden flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {t("filters")} {h.activeFilterCount > 0 && `(${h.activeFilterCount})`}
      </button>

      {/* Sidebar Filters */}
      <aside className={`w-full md:w-56 shrink-0 space-y-6 ${h.filterOpen ? "block" : "hidden md:block"}`}>
        {/* Active Filter Chips */}
        {h.hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {h.currentBrands.map((slug) => {
              const brand = h.brands.find((b) => b.slug === slug);
              return brand ? (
                <Link
                  key={slug}
                  href={h.buildUrl({ marka: h.currentBrands.filter((s) => s !== slug).join(",") || undefined, sayfa: undefined })}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full hover:bg-primary/20"
                >
                  {brand.name} <span className="font-bold">&times;</span>
                </Link>
              ) : null;
            })}
            {(h.minPrice !== undefined || h.maxPrice !== undefined) && (
              <Link
                href={h.buildUrl({ min: undefined, max: undefined, sayfa: undefined })}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full hover:bg-primary/20"
              >
                {h.minPrice || 0}&#8378; - {h.maxPrice || "\u221E"}&#8378; <span className="font-bold">&times;</span>
              </Link>
            )}
            {h.currentInStock && (
              <Link
                href={h.buildUrl({ stok: undefined, sayfa: undefined })}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full hover:bg-primary/20"
              >
                {t("inStock")} <span className="font-bold">&times;</span>
              </Link>
            )}
            <Link
              href={h.buildUrl({ marka: undefined, min: undefined, max: undefined, stok: undefined, sayfa: undefined })}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              {t("clearAll")}
            </Link>
          </div>
        )}

        {/* Brand Filter */}
        {h.brands.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-3">{t("brand")}</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {h.brands.map((brand) => (
                <label key={brand.slug} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={h.currentBrands.includes(brand.slug)}
                    onChange={() => h.toggleBrand(brand.slug)}
                    className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                  />
                  <span className={h.currentBrands.includes(brand.slug) ? "text-primary font-medium" : "text-foreground"}>
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
          <div className="flex flex-wrap gap-1.5 mb-3">
            {h.pricePresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => h.selectPreset(preset)}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  h.isPresetActive(preset)
                    ? "bg-primary text-white border-primary"
                    : "border-border hover:border-primary hover:text-primary"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={h.localMin}
              onChange={(e) => h.setLocalMin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && h.applyPrice()}
              className="w-full px-2 py-1.5 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-muted-foreground text-sm">-</span>
            <input
              type="number"
              placeholder="Max"
              value={h.localMax}
              onChange={(e) => h.setLocalMax(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && h.applyPrice()}
              className="w-full px-2 py-1.5 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button onClick={h.applyPrice} className="px-3 py-1.5 bg-primary text-white rounded text-sm hover:bg-primary/90 shrink-0">
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
              checked={h.currentInStock}
              onChange={h.toggleStock}
              className="rounded border-border text-primary focus:ring-primary w-4 h-4"
            />
            <span>{t("inStockOnly")}</span>
            <span className="text-xs text-muted-foreground">({h.inStockCount})</span>
          </label>
        </div>
      </aside>

      {/* Products Grid */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
          <p className="text-sm text-muted-foreground">{t("productCount", { count: h.total })}</p>
          <select
            value={h.currentSort}
            onChange={(e) => h.changeSort(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="newest">{t("sortNewest")}</option>
            <option value="price-asc">{t("sortPriceAsc")}</option>
            <option value="price-desc">{t("sortPriceDesc")}</option>
            <option value="name">{t("sortAZ")}</option>
            <option value="popular">{t("sortPopular")}</option>
          </select>
        </div>

        {h.products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {h.products.map((product) => (
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
        {h.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {h.page > 1 && (
              <Link href={h.buildUrl({ sayfa: String(h.page - 1) })} className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted">
                {t("previous")}
              </Link>
            )}
            {h.getPageNumbers().map((p, idx, arr) => {
              const prev = arr[idx - 1];
              const showDots = prev && p - prev > 1;
              return (
                <span key={p} className="flex items-center gap-2">
                  {showDots && <span className="text-muted-foreground">...</span>}
                  <Link
                    href={h.buildUrl({ sayfa: String(p) })}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${
                      p === h.page ? "bg-primary text-white" : "border border-border hover:bg-muted"
                    }`}
                  >
                    {p}
                  </Link>
                </span>
              );
            })}
            {h.page < h.totalPages && (
              <Link href={h.buildUrl({ sayfa: String(h.page + 1) })} className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted">
                {t("next")}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
