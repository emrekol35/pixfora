"use client";

import { useTranslations } from "next-intl";
import ProductCard from "@/components/storefront/ProductCard";
import { Link } from "@/i18n/navigation";
import {
  useCategoryLogic,
  type CategoryProductsProps,
} from "@/themes/hooks/useCategoryLogic";

export default function BoldCategoryProducts(props: CategoryProductsProps) {
  const t = useTranslations("filter");
  const h = useCategoryLogic(props);

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Mobile Filter Toggle */}
      <button
        onClick={h.toggleFilter}
        className="md:hidden flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white rounded-full text-sm font-bold shadow-lg shadow-purple-200 hover:shadow-xl transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {t("filters")} {h.activeFilterCount > 0 && `(${h.activeFilterCount})`}
      </button>

      {/* Sidebar Filters */}
      <aside className={`w-full md:w-60 shrink-0 space-y-6 ${h.filterOpen ? "block" : "hidden md:block"}`}>
        <div className="bg-white rounded-2xl border-2 border-purple-100 p-5 shadow-sm space-y-6">
          {/* Active Filter Chips */}
          {h.hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {h.currentBrands.map((slug) => {
                const brand = h.brands.find((b) => b.slug === slug);
                return brand ? (
                  <Link
                    key={slug}
                    href={h.buildUrl({ marka: h.currentBrands.filter((s) => s !== slug).join(",") || undefined, sayfa: undefined })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white text-xs font-bold rounded-full hover:shadow-lg hover:scale-105 transition-all"
                  >
                    {brand.name} <span className="font-extrabold text-sm">&times;</span>
                  </Link>
                ) : null;
              })}
              {(h.minPrice !== undefined || h.maxPrice !== undefined) && (
                <Link
                  href={h.buildUrl({ min: undefined, max: undefined, sayfa: undefined })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#f97316] to-[#ec4899] text-white text-xs font-bold rounded-full hover:shadow-lg hover:scale-105 transition-all"
                >
                  {h.minPrice || 0}&#8378; - {h.maxPrice || "\u221E"}&#8378; <span className="font-extrabold text-sm">&times;</span>
                </Link>
              )}
              {h.currentInStock && (
                <Link
                  href={h.buildUrl({ stok: undefined, sayfa: undefined })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-green-500 text-white text-xs font-bold rounded-full hover:shadow-lg hover:scale-105 transition-all"
                >
                  {t("inStock")} <span className="font-extrabold text-sm">&times;</span>
                </Link>
              )}
              <Link
                href={h.buildUrl({ marka: undefined, min: undefined, max: undefined, stok: undefined, sayfa: undefined })}
                className="text-xs text-gray-400 hover:text-[#8b5cf6] font-bold underline underline-offset-2 transition-colors"
              >
                {t("clearAll")}
              </Link>
            </div>
          )}

          {/* Brand Filter */}
          {h.brands.length > 0 && (
            <div>
              <h3 className="font-extrabold text-sm mb-3 text-gray-700 flex items-center gap-1">
                <span className="text-base">&#127991;</span> {t("brand")}
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {h.brands.map((brand) => (
                  <label key={brand.slug} className="flex items-center gap-2.5 text-sm cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={h.currentBrands.includes(brand.slug)}
                      onChange={() => h.toggleBrand(brand.slug)}
                      className="rounded-md border-2 border-purple-300 text-[#8b5cf6] focus:ring-[#8b5cf6] w-4 h-4"
                    />
                    <span className={`transition-colors ${h.currentBrands.includes(brand.slug) ? "text-[#8b5cf6] font-bold" : "text-gray-600 group-hover:text-[#8b5cf6]"}`}>
                      {brand.name}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto font-medium">({brand.count})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Price Filter */}
          <div>
            <h3 className="font-extrabold text-sm mb-3 text-gray-700 flex items-center gap-1">
              <span className="text-base">&#128176;</span> {t("priceRange")}
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {h.pricePresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => h.selectPreset(preset)}
                  className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all duration-300 ${
                    h.isPresetActive(preset)
                      ? "bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white shadow-md"
                      : "bg-purple-50 text-gray-500 border-2 border-purple-100 hover:border-[#8b5cf6] hover:text-[#8b5cf6] hover:scale-105"
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
                className="w-full px-3 py-2 border-2 border-purple-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30 focus:border-[#8b5cf6] bg-purple-50/50"
              />
              <span className="text-purple-300 font-bold">-</span>
              <input
                type="number"
                placeholder="Max"
                value={h.localMax}
                onChange={(e) => h.setLocalMax(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && h.applyPrice()}
                className="w-full px-3 py-2 border-2 border-purple-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30 focus:border-[#8b5cf6] bg-purple-50/50"
              />
              <button onClick={h.applyPrice} className="px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white rounded-full text-sm font-bold hover:shadow-lg shrink-0 transition-all hover:scale-105">
                {t("go")}
              </button>
            </div>
          </div>

          {/* Stock Filter */}
          <div>
            <h3 className="font-extrabold text-sm mb-3 text-gray-700 flex items-center gap-1">
              <span className="text-base">&#128230;</span> {t("stockStatus")}
            </h3>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer group">
              <input
                type="checkbox"
                checked={h.currentInStock}
                onChange={h.toggleStock}
                className="rounded-md border-2 border-purple-300 text-[#8b5cf6] focus:ring-[#8b5cf6] w-4 h-4"
              />
              <span className={`transition-colors ${h.currentInStock ? "text-[#8b5cf6] font-bold" : "text-gray-600 group-hover:text-[#8b5cf6]"}`}>
                {t("inStockOnly")}
              </span>
              <span className="text-xs text-gray-400 font-medium">({h.inStockCount})</span>
            </label>
          </div>
        </div>
      </aside>

      {/* Products Grid */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-purple-100">
          <p className="text-sm font-bold text-gray-500">
            {t("productCount", { count: h.total })}
          </p>
          <select
            value={h.currentSort}
            onChange={(e) => h.changeSort(e.target.value)}
            className="text-sm border-2 border-purple-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30 focus:border-[#8b5cf6] font-bold text-gray-600 bg-purple-50/50"
          >
            <option value="newest">{t("sortNewest")}</option>
            <option value="price-asc">{t("sortPriceAsc")}</option>
            <option value="price-desc">{t("sortPriceDesc")}</option>
            <option value="name">{t("sortAZ")}</option>
            <option value="popular">{t("sortPopular")}</option>
          </select>
        </div>

        {h.products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {h.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 bg-purple-50 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-400 font-bold">{t("noProducts")}</p>
          </div>
        )}

        {/* Pagination */}
        {h.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {h.page > 1 && (
              <Link
                href={h.buildUrl({ sayfa: String(h.page - 1) })}
                className="px-5 py-2.5 bg-purple-50 border-2 border-purple-200 rounded-full text-sm font-bold text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white hover:border-[#8b5cf6] hover:shadow-lg hover:scale-105 transition-all"
              >
                {t("previous")}
              </Link>
            )}
            {h.getPageNumbers().map((p, idx, arr) => {
              const prev = arr[idx - 1];
              const showDots = prev && p - prev > 1;
              return (
                <span key={p} className="flex items-center gap-2">
                  {showDots && <span className="text-purple-300 font-bold">...</span>}
                  <Link
                    href={h.buildUrl({ sayfa: String(p) })}
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                      p === h.page
                        ? "bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white shadow-lg shadow-purple-200 scale-110"
                        : "bg-purple-50 border-2 border-purple-100 text-gray-500 hover:border-[#8b5cf6] hover:text-[#8b5cf6] hover:scale-110"
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
                className="px-5 py-2.5 bg-purple-50 border-2 border-purple-200 rounded-full text-sm font-bold text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white hover:border-[#8b5cf6] hover:shadow-lg hover:scale-105 transition-all"
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
