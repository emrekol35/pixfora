"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useSearchStore } from "@/store/search";
import SearchDropdown from "@/components/storefront/SearchDropdown";
import DarkModeToggle from "@/components/storefront/DarkModeToggle";
import { useTranslations } from "next-intl";

export default function HeaderMinimal() {
  const t = useTranslations("header");
  const tc = useTranslations("common");
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());
  const openCart = useCartStore((s) => s.openCart);
  const wishlistCount = useWishlistStore((s) => s.getCount());

  const {
    query, setQuery, suggestions, setSuggestions,
    isLoading, setLoading, isOpen, openSearch, closeSearch,
    recentSearches, addRecentSearch,
  } = useSearchStore();
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) { closeSearch(); setSearchOpen(false); }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeSearch]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) { setSuggestions(null); if (value.length === 0 && recentSearches.length > 0) openSearch(); return; }
    openSearch(); setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try { const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(value)}`); setSuggestions(await res.json()); }
      catch { setSuggestions(null); } finally { setLoading(false); }
    }, 300);
  }, [setQuery, setSuggestions, setLoading, openSearch, recentSearches.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.length >= 2) { e.preventDefault(); addRecentSearch(query); closeSearch(); setSearchOpen(false); router.push(`/arama?q=${encodeURIComponent(query)}`); }
  }, [query, addRecentSearch, closeSearch, router]);

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      {/* Single row — no top bar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-primary shrink-0">Pixfora</Link>

          {/* Nav links — desktop */}
          <nav className="hidden lg:flex items-center gap-6 text-sm">
            <Link href="/kategori" className="font-medium text-foreground hover:text-primary transition-colors">{t("allCategories")}</Link>
            <Link href="/firsatlar" className="text-danger font-medium hover:text-danger/80 transition-colors">{t("deals")}</Link>
            <Link href="/yeni-urunler" className="text-muted-foreground hover:text-primary transition-colors">{t("newProducts")}</Link>
            <Link href="/cok-satanlar" className="text-muted-foreground hover:text-primary transition-colors">{t("bestSellers")}</Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search toggle */}
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <DarkModeToggle />

            {/* Account */}
            <Link href={session?.user ? "/hesabim" : "/giris"} className="hidden sm:flex p-2 text-muted-foreground hover:text-foreground">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>

            {/* Wishlist */}
            {session?.user && (
              <Link href="/hesabim/favorilerim" className="relative hidden sm:flex p-2 text-muted-foreground hover:text-foreground">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {mounted && wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-danger text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center">{wishlistCount}</span>
                )}
              </Link>
            )}

            {/* Cart */}
            <button onClick={openCart} className="relative p-2 text-muted-foreground hover:text-foreground">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {mounted && itemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-primary text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center">{itemCount}</span>
              )}
            </button>

            {/* Mobile menu */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-muted-foreground">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {searchOpen && (
        <div className="border-t border-border bg-background" ref={searchRef}>
          <div className="max-w-7xl mx-auto px-4 py-3 relative">
            <input type="text" placeholder={t("searchPlaceholder")} autoFocus
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
              value={query} onChange={(e) => handleSearch(e.target.value)} onKeyDown={handleKeyDown} />
            <svg className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {isOpen && <SearchDropdown query={query} suggestions={suggestions} isLoading={isLoading} recentSearches={recentSearches} onClose={() => { closeSearch(); setSearchOpen(false); }} />}
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="p-4 space-y-3">
            {[
              { href: "/kategori", label: t("allCategories") }, { href: "/markalar", label: tc("brands") },
              { href: "/firsatlar", label: t("deals") }, { href: "/yeni-urunler", label: t("newProducts") },
              { href: "/cok-satanlar", label: t("bestSellers") }, { href: "/siparis-takip", label: t("orderTracking") },
              { href: session?.user ? "/hesabim" : "/giris", label: session?.user ? tc("myAccount") : tc("login") },
              { href: "/blog", label: t("blog") }, { href: "/iletisim", label: t("contact") },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="block text-sm text-foreground hover:text-primary py-1" onClick={() => setMobileMenuOpen(false)}>{item.label}</Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
