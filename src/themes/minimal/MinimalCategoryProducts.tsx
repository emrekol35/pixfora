"use client";

import { useTranslations } from "next-intl";
import ProductCard from "@/components/storefront/ProductCard";
import { Link } from "@/i18n/navigation";
import {
  useCategoryLogic,
  type CategoryProductsProps,
} from "@/themes/hooks/useCategoryLogic";

export default function MinimalCategoryProducts(props: CategoryProductsProps) {
  const t = useTranslations("filter");
  const h = useCategoryLogic(props);

  return (
    <div className="flex flex-col md:flex-row gap-12">
      {/* Mobile Filter Toggle */}
      <button
        onClick={h.toggleFilter}
        className="md:hidden flex items-center justify-center gap-2 px-4 py-2.5 border border-[#e5e5e5] text-[10px] tracking-[0.2em] uppercase text-[#1a1a1a]"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {t("filters")} {h.activeFilterCount > 0 && `(${h.activeFilterCount})`}
      </button>

      {/* Sidebar Filters */}
      <aside className={`w-full md:w-52 shrink-0 space-y-8 ${h.filterOpen ? "block" : "hidden md:block"}`}>
        {/* Active Filter Chips */}
        {h.hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pb-6 border-b border-[#e5e5e5]">
            {h.currentBrands.map((slug) => {
              const brand = h.brands.find((b) => b.slug === slug);
              return brand ? (
                <Link
                  key={slug}
                  href={h.buildUrl({ marka: h.currentBrands.filter((s) => s !== slug).join(",") || undefined, sayfa: undefined })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#1a1a1a] text-[#1a1a1a] text-[10px] tracking-[0.1em] uppercase hover:bg-[#1a1a1a] hover:text-white transition-colors"
                >
                  {brand.name} <span>&times;</span>
                </Link>
              ) : null;
            })}
            {(h.minPrice !== undefined || h.maxPrice !== undefined) && (
              <Link
                href={h.buildUrl({ min: undefined, max: undefined, sayfa: undefined })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#1a1a1a] text-[#1a1a1a] text-[10px] tracking-[0.1em] uppercase hover:bg-[#1a1a1a] hover:text-white transition-colors"
              >
                {h.minPrice || 0}&#8378; - {h.maxPrice || "\u221E"}&#8378; <span>&times;</span>
              </Link>
            )}
            {h.currentInStock && (
              <Link
                href={h.buildUrl({ stok: undefined, sayfa: undefined })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#1a1a1a] text-[#1a1a1a] text-[10px] tracking-[0.1em] uppercase hover:bg-[#1a1a1a] hover:text-white transition-colors"
              >
                {t("inStock")} <span>&times;</span>
              </Link>
            )}
            <Link
              href={h.buildUrl({ marka: undefined, min: undefined, max: undefined, stok: undefined, sayfa: undefined })}
              className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground hover:text-[#c9a96e] transition-colors underline underline-offset-2"
            >
              {t("clearAll")}
            </Link>
          </div>
        )}

        {/* Brand Filter */}
        {h.brands.length > 0 && (
          <div>
            <h3 className="text-[10px] tracking-[0.25em] uppercase text-[#1a1a1a] font-medium mb-4">
              {t("brand")}
            </h3>
            <div className="space-y-2.5 max-h-48 overflow-y-auto">
              {h.brands.map((brand) => (
                <label key={brand.slug} className="flex items-center gap-2.5 text-sm cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={h.currentBrands.includes(brand.slug)}
                    onChange={() => h.toggleBrand(brand.slug)}
                    className="rounded-none border-[#e5e5e5] text-[#1a1a1a] focus:ring-[#c9a96e] w-3.5 h-3.5"
                  />
                  <span className={`text-xs tracking-wide ${
                    h.currentBrands.includes(brand.slug) ? "text-[#1a1a1a] font-medium" : "text-muted-foreground group-hover:text-[#1a1a1a]"
                  } transition-colors`}>
                    {brand.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 ml-auto">({brand.count})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Price Filter */}
        <div>
          <h3 className="text-[10px] tracking-[0.25em] uppercase text-[#1a1a1a] font-medium mb-4">
            {t("priceRange")}
          </h3>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {h.pricePresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => h.selectPreset(preset)}
                className={`text-[10px] tracking-wide px-2.5 py-1.5 border transition-all ${
                  h.isPresetActive(preset)
                    ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                    : "border-[#e5e5e5] text-muted-foreground hover:border-[#1a1a1a] hover:text-[#1a1a1a]"
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
              className="w-full px-3 py-2 border border-[#e5e5e5] text-xs tracking-wide focus:outline-none focus:border-[#c9a96e] transition-colors bg-transparent"
            />
            <span className="text-muted-foreground/40 text-xs">&ndash;</span>
            <input
              type="number"
              placeholder="Max"
              value={h.localMax}
              onChange={(e) => h.setLocalMax(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && h.applyPrice()}
              className="w-full px-3 py-2 border border-[#e5e5e5] text-xs tracking-wide focus:outline-none focus:border-[#c9a96e] transition-colors bg-transparent"
            />
            <button
              onClick={h.applyPrice}
              className="px-3 py-2 bg-[#1a1a1a] text-white text-[10px] tracking-[0.1em] uppercase shrink-0 hover:bg-[#333] transition-colors"
            >
              {t("go")}
            </button>
          </div>
        </div>

        {/* Stock Filter */}
        <div>
          <h3 className="text-[10px] tracking-[0.25em] uppercase text-[#1a1a1a] font-medium mb-4">
            {t("stockStatus")}
          </h3>
          <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
            <input
              type="checkbox"
              checked={h.currentInStock}
              onChange={h.toggleStock}
              className="rounded-none border-[#e5e5e5] text-[#1a1a1a] focus:ring-[#c9a96e] w-3.5 h-3.5"
            />
            <span className="text-xs tracking-wide text-muted-foreground group-hover:text-[#1a1a1a] transition-colors">
              {t("inStockOnly")}
            </span>
            <span className="text-[10px] text-muted-foreground/60">({h.inStockCount})</span>
          </label>
        </div>
      </aside>

      {/* Products Grid */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e5e5e5]">
          <p className="text-xs tracking-wide text-muted-foreground">
            {t("productCount", { count: h.total })}
          </p>
          <select
            value={h.currentSort}
            onChange={(e) => h.changeSort(e.target.value)}
            className="text-xs tracking-wide border border-[#e5e5e5] px-3 py-2 focus:outline-none focus:border-[#c9a96e] transition-colors bg-transparent appearance-none cursor-pointer"
          >
            <option value="newest">{t("sortNewest")}</option>
            <option value="price-asc">{t("sortPriceAsc")}</option>
            <option value="price-desc">{t("sortPriceDesc")}</option>
            <option value="name">{t("sortAZ")}</option>
            <option value="popular">{t("sortPopular")}</option>
          </select>
        </div>

        {h.products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-6">
            {h.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <svg className="w-12 h-12 mx-auto mb-4 text-muted-foreground/20" fill="none" stroke="currentColor" strokeWidth={0.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm">{t("noProducts")}</p>
          </div>
        )}

        {/* Pagination */}
        {h.totalPages > 1 && (
          <div className="flex items-center justify-center gap-6 mt-12">
            {h.page > 1 && (
              <Link
                href={h.buildUrl({ sayfa: String(h.page - 1) })}
                className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-[#1a1a1a] transition-colors"
              >
                {t("previous")}
              </Link>
            )}
            <div className="flex items-center gap-1">
              {h.getPageNumbers().map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showDots = prev && p - prev > 1;
                return (
                  <span key={p} className="flex items-center gap-1">
                    {showDots && <span className="text-muted-foreground/40 px-1">&hellip;</span>}
                    <Link
                      href={h.buildUrl({ sayfa: String(p) })}
                      className={`w-8 h-8 flex items-center justify-center text-xs tracking-wide transition-all ${
                        p === h.page
                          ? "text-[#1a1a1a] border-b border-[#c9a96e]"
                          : "text-muted-foreground hover:text-[#1a1a1a]"
                      }`}
                    >
                      {p}
                    </Link>
                  </span>
                );
              })}
            </div>
            {h.page < h.totalPages && (
              <Link
                href={h.buildUrl({ sayfa: String(h.page + 1) })}
                className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-[#1a1a1a] transition-colors"
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
