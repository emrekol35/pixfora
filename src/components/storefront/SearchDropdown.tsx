"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSearchStore } from "@/store/search";
import type { SearchSuggestions } from "@/store/search";

const priceFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

interface SearchDropdownProps {
  query: string;
  suggestions: SearchSuggestions | null;
  isLoading: boolean;
  recentSearches: string[];
  onClose: () => void;
}

export default function SearchDropdown({
  query,
  suggestions,
  isLoading,
  recentSearches,
  onClose,
}: SearchDropdownProps) {
  const router = useRouter();
  const t = useTranslations("search");
  const { addRecentSearch, removeRecentSearch, clearRecentSearches, setQuery } = useSearchStore();

  const handleRecentClick = (q: string) => {
    setQuery(q);
    addRecentSearch(q);
    router.push(`/arama?q=${encodeURIComponent(q)}`);
    onClose();
  };

  const handleViewAll = () => {
    if (query.length >= 2) {
      addRecentSearch(query);
    }
    onClose();
  };

  // Query boş veya < 2 karakter: Son aramalar göster
  if (!query || query.length < 2) {
    if (recentSearches.length === 0) return null;

    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden z-50">
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t("recentSearches")}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              clearRecentSearches();
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t("clear")}
          </button>
        </div>
        {recentSearches.map((q) => (
          <div key={q} className="flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors group">
            <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <button
              onClick={() => handleRecentClick(q)}
              className="flex-1 text-sm text-left text-foreground truncate"
            >
              {q}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeRecentSearch(q);
              }}
              className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    );
  }

  // Query >= 2: Gruplandırılmış sonuçlar
  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden z-50">
        <div className="p-4 text-center text-sm text-muted-foreground">
          {t("searching")}
        </div>
      </div>
    );
  }

  const hasCategories = suggestions && suggestions.categories.length > 0;
  const hasBrands = suggestions && suggestions.brands.length > 0;
  const hasProducts = suggestions && suggestions.products.length > 0;
  const hasAny = hasCategories || hasBrands || hasProducts;

  if (!hasAny) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden z-50">
        <div className="p-4 text-center text-sm text-muted-foreground">
          {t("noResults")}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
      {/* Kategoriler */}
      {hasCategories && (
        <div>
          <div className="px-3 pt-3 pb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t("categories")}
            </span>
          </div>
          {suggestions!.categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/kategori/${cat.slug}`}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted transition-colors"
              onClick={onClose}
            >
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{cat.name}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{t("productCount", { count: cat.productCount })}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Markalar */}
      {hasBrands && (
        <div className={hasCategories ? "border-t border-border" : ""}>
          <div className="px-3 pt-3 pb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t("brands")}
            </span>
          </div>
          {suggestions!.brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/arama?q=${encodeURIComponent(query)}&marka=${brand.slug}`}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted transition-colors"
              onClick={() => {
                addRecentSearch(query);
                onClose();
              }}
            >
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <p className="text-sm font-medium truncate">{brand.name}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Ürünler */}
      {hasProducts && (
        <div className={(hasCategories || hasBrands) ? "border-t border-border" : ""}>
          <div className="px-3 pt-3 pb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t("products")}
            </span>
          </div>
          {suggestions!.products.map((product) => (
            <Link
              key={product.id}
              href={`/urun/${product.slug}`}
              className="flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors"
              onClick={onClose}
            >
              <div className="w-10 h-10 bg-muted rounded shrink-0 overflow-hidden relative">
                {product.image && (
                  <Image src={product.image} alt={product.name} fill className="object-cover" sizes="40px" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                {product.category && (
                  <p className="text-xs text-muted-foreground">{product.category}</p>
                )}
              </div>
              <span className="text-sm font-bold text-primary shrink-0">
                {priceFormatter.format(product.price)}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Tüm Sonuçları Gör */}
      <Link
        href={`/arama?q=${encodeURIComponent(query)}`}
        className="block p-3 text-center text-sm text-primary font-medium hover:bg-muted border-t border-border"
        onClick={handleViewAll}
      >
        {t("viewAllResults", { query })} →
      </Link>
    </div>
  );
}
