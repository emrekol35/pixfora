"use client";

import { useTranslations } from "next-intl";
import ProductCard from "@/components/storefront/ProductCard";
import { Link } from "@/i18n/navigation";
import {
  useCategoryLogic,
  type CategoryProductsProps,
} from "@/themes/hooks/useCategoryLogic";

export default function ElegantCategoryProducts(props: CategoryProductsProps) {
  const t = useTranslations("filter");
  const h = useCategoryLogic(props);

  return (
    <div className="flex flex-col md:flex-row gap-10">
      {/* Mobile Filter Toggle */}
      <button
        onClick={h.toggleFilter}
        className="md:hidden flex items-center justify-center gap-2 px-4 py-2.5 border border-[#e8e0d0] rounded-sm text-xs uppercase tracking-wider font-medium text-[#1a1a1a]"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {t("filters")} {h.activeFilterCount > 0 && `(${h.activeFilterCount})`}
      </button>

      {/* Sidebar Filters */}
      <aside className={`w-full md:w-60 shrink-0 space-y-8 ${h.filterOpen ? "block" : "hidden md:block"}`}>
        {/* Active Filter Chips */}
        {h.hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {h.currentBrands.map((slug) => {
              const brand = h.brands.find((b) => b.slug === slug);
              return brand ? (
                <Link
                  key={slug}
                  href={h.buildUrl({ marka: h.currentBrands.filter((s) => s !== slug).join(",") || undefined, sayfa: undefined })}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#c9a96e]/10 text-[#c9a96e] text-xs rounded-sm hover:bg-[#c9a96e]/20 transition-colors uppercase tracking-wider"
                >
                  {brand.name} <span className="font-bold">&times;</span>
                </Link>
              ) : null;
            })}
            {(h.minPrice !== undefined || h.maxPrice !== undefined) && (
              <Link
                href={h.buildUrl({ min: undefined, max: undefined, sayfa: undefined })}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#c9a96e]/10 text-[#c9a96e] text-xs rounded-sm hover:bg-[#c9a96e]/20 transition-colors"
              >
                {h.minPrice || 0}&#8378; - {h.maxPrice || "\u221E"}&#8378; <span className="font-bold">&times;</span>
              </Link>
            )}
            {h.currentInStock && (
              <Link
                href={h.buildUrl({ stok: undefined, sayfa: undefined })}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#c9a96e]/10 text-[#c9a96e] text-xs rounded-sm hover:bg-[#c9a96e]/20 transition-colors uppercase tracking-wider"
              >
                {t("inStock")} <span className="font-bold">&times;</span>
              </Link>
            )}
            <Link
              href={h.buildUrl({ marka: undefined, min: undefined, max: undefined, stok: undefined, sayfa: undefined })}
              className="text-xs text-[#1a1a1a]/50 hover:text-[#c9a96e] underline transition-colors"
            >
              {t("clearAll")}
            </Link>
          </div>
        )}

        {/* Brand Filter */}
        {h.brands.length > 0 && (
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1a1a1a] mb-3 pb-2 border-b border-[#e8e0d0]">
              {t("brand")}
            </h3>
            <div className="space-y-2.5 max-h-48 overflow-y-auto">
              {h.brands.map((brand) => (
                <label key={brand.slug} className="flex items-center gap-2 text-sm cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={h.currentBrands.includes(brand.slug)}
                    onChange={() => h.toggleBrand(brand.slug)}
                    className="rounded-sm border-[#e8e0d0] text-[#c9a96e] focus:ring-[#c9a96e] w-4 h-4"
                  />
                  <span className={`transition-colors ${h.currentBrands.includes(brand.slug) ? "text-[#c9a96e] font-medium" : "text-[#1a1a1a]/80 group-hover:text-[#1a1a1a]"}`}>
                    {brand.name}
                  </span>
                  <span className="text-xs text-[#1a1a1a]/40 ml-auto">({brand.count})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Price Filter */}
        <div>
          <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1a1a1a] mb-3 pb-2 border-b border-[#e8e0d0]">
            {t("priceRange")}
          </h3>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {h.pricePresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => h.selectPreset(preset)}
                className={`text-xs px-2.5 py-1 rounded-sm border transition-colors ${
                  h.isPresetActive(preset)
                    ? "bg-[#c9a96e] text-white border-[#c9a96e]"
                    : "border-[#e8e0d0] text-[#1a1a1a]/70 hover:border-[#c9a96e] hover:text-[#c9a96e]"
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
              className="w-full px-2 py-1.5 border border-[#e8e0d0] rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a96e] focus:border-[#c9a96e] bg-white"
            />
            <span className="text-[#c9a96e] text-sm">&mdash;</span>
            <input
              type="number"
              placeholder="Max"
              value={h.localMax}
              onChange={(e) => h.setLocalMax(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && h.applyPrice()}
              className="w-full px-2 py-1.5 border border-[#e8e0d0] rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-[#c9a96e] focus:border-[#c9a96e] bg-white"
            />
            <button onClick={h.applyPrice} className="px-3 py-1.5 bg-[#1a1a1a] text-white rounded-sm text-xs uppercase tracking-wider hover:bg-[#1a1a1a]/90 shrink-0 transition-colors">
              {t("go")}
            </button>
          </div>
        </div>

        {/* Stock Filter */}
        <div>
          <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1a1a1a] mb-3 pb-2 border-b border-[#e8e0d0]">
            {t("stockStatus")}
          </h3>
          <label className="flex items-center gap-2 text-sm cursor-pointer group">
            <input
              type="checkbox"
              checked={h.currentInStock}
              onChange={h.toggleStock}
              className="rounded-sm border-[#e8e0d0] text-[#c9a96e] focus:ring-[#c9a96e] w-4 h-4"
            />
            <span className="text-[#1a1a1a]/80 group-hover:text-[#1a1a1a] transition-colors">{t("inStockOnly")}</span>
            <span className="text-xs text-[#1a1a1a]/40">({h.inStockCount})</span>
          </label>
        </div>
      </aside>

      {/* Products Grid */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e8e0d0]">
          <p className="text-xs uppercase tracking-wider text-[#1a1a1a]/50">{t("productCount", { count: h.total })}</p>
          <select
            value={h.currentSort}
            onChange={(e) => h.changeSort(e.target.value)}
            className="text-sm border border-[#e8e0d0] rounded-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#c9a96e] focus:border-[#c9a96e] bg-white text-[#1a1a1a]"
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
          <div className="text-center py-20 text-[#1a1a1a]/50">
            <svg className="w-16 h-16 mx-auto mb-4 text-[#c9a96e]/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="italic">{t("noProducts")}</p>
          </div>
        )}

        {/* Pagination */}
        {h.totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-10">
            {h.page > 1 && (
              <Link
                href={h.buildUrl({ sayfa: String(h.page - 1) })}
                className="px-4 py-2 border border-[#e8e0d0] rounded-sm text-xs uppercase tracking-wider text-[#1a1a1a]/70 hover:border-[#c9a96e] hover:text-[#c9a96e] transition-colors"
              >
                {t("previous")}
              </Link>
            )}
            {h.getPageNumbers().map((p, idx, arr) => {
              const prev = arr[idx - 1];
              const showDots = prev && p - prev > 1;
              return (
                <span key={p} className="flex items-center gap-1.5">
                  {showDots && <span className="text-[#c9a96e]/50 px-1">...</span>}
                  <Link
                    href={h.buildUrl({ sayfa: String(p) })}
                    className={`w-9 h-9 flex items-center justify-center rounded-sm text-sm transition-colors ${
                      p === h.page
                        ? "bg-[#c9a96e] text-white"
                        : "border border-[#e8e0d0] text-[#1a1a1a]/70 hover:border-[#c9a96e] hover:text-[#c9a96e]"
                    }`}
                  >
                    {p}
                  </Link>
                </span>
              );
            })}
            {h.page < h.totalPages && (
              <Link
                href={h.buildUrl({ sayfa: String(h.page + 1) })}
                className="px-4 py-2 border border-[#e8e0d0] rounded-sm text-xs uppercase tracking-wider text-[#1a1a1a]/70 hover:border-[#c9a96e] hover:text-[#c9a96e] transition-colors"
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
