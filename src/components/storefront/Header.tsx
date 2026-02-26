"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { useSearchStore, SearchResult } from "@/store/search";
import NotificationBell from "@/components/storefront/NotificationBell";

export default function Header() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());
  const openCart = useCartStore((s) => s.openCart);
  const wishlistCount = useWishlistStore((s) => s.getCount());

  const { query, setQuery, results, setResults, isLoading, setLoading, isOpen, openSearch, closeSearch } = useSearchStore();
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeSearch]);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (value.length < 2) {
        setResults([]);
        return;
      }

      openSearch();
      setLoading(true);

      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(value)}&limit=6`);
          const data = await res.json();
          setResults(data.products || []);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [setQuery, setResults, setLoading, openSearch]
  );

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      {/* Top Bar */}
      <div className="bg-foreground text-white text-xs py-1.5">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <span>Ucretsiz kargo 500₺ ve uzeri siparislerde!</span>
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/hesabim/siparislerim" className="hover:underline">
              Siparis Takibi
            </Link>
            <Link href="/iletisim" className="hover:underline">
              Yardim
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-primary shrink-0">
            Pixfora
          </Link>

          {/* Search Bar */}
          <div ref={searchRef} className="hidden md:block flex-1 max-w-xl relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Urun, kategori veya marka ara..."
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => query.length >= 2 && openSearch()}
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Search Dropdown */}
            {isOpen && query.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden z-50">
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Araniyor...
                  </div>
                ) : results.length > 0 ? (
                  <>
                    {results.map((item: SearchResult) => (
                      <Link
                        key={item.id}
                        href={`/urun/${item.slug}`}
                        className="flex items-center gap-3 p-3 hover:bg-muted transition-colors"
                        onClick={() => closeSearch()}
                      >
                        <div className="w-10 h-10 bg-muted rounded shrink-0 overflow-hidden">
                          {item.image && (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          {item.category && (
                            <p className="text-xs text-muted-foreground">{item.category}</p>
                          )}
                        </div>
                        <span className="text-sm font-bold text-primary shrink-0">
                          {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(item.price)}
                        </span>
                      </Link>
                    ))}
                    <Link
                      href={`/arama?q=${encodeURIComponent(query)}`}
                      className="block p-3 text-center text-sm text-primary font-medium hover:bg-muted border-t border-border"
                      onClick={() => closeSearch()}
                    >
                      Tum sonuclari gor →
                    </Link>
                  </>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Sonuc bulunamadi
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Mobile Search */}
            <Link href="/arama" className="md:hidden p-2 text-muted-foreground hover:text-foreground">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            {/* Account */}
            <Link href={session?.user ? "/hesabim" : "/giris"} className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden lg:inline">{session?.user ? session.user.name || "Hesabim" : "Giris Yap"}</span>
            </Link>

            {/* Notifications */}
            <NotificationBell />

            {/* Wishlist */}
            {session?.user && (
              <Link href="/hesabim/favorilerim" className="relative hidden sm:flex items-center text-muted-foreground hover:text-foreground">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {mounted && wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-danger text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart */}
            <button
              onClick={openCart}
              className="relative flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <span className="hidden lg:inline">Sepet</span>
              {mounted && itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center min-w-[18px] h-[18px]">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="hidden md:block border-t border-border">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-6 py-2.5 text-sm">
            <li>
              <Link href="/kategori" className="font-medium text-foreground hover:text-primary transition-colors">
                Tum Kategoriler
              </Link>
            </li>
            <li>
              <Link href="/markalar" className="text-muted-foreground hover:text-primary transition-colors">
                Markalar
              </Link>
            </li>
            <li>
              <Link href="/firsatlar" className="text-danger font-medium hover:text-danger/80 transition-colors">
                Firsatlar
              </Link>
            </li>
            <li>
              <Link href="/yeni-urunler" className="text-muted-foreground hover:text-primary transition-colors">
                Yeni Urunler
              </Link>
            </li>
            <li>
              <Link href="/cok-satanlar" className="text-muted-foreground hover:text-primary transition-colors">
                Cok Satanlar
              </Link>
            </li>
            <li>
              <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/iletisim" className="text-muted-foreground hover:text-primary transition-colors">
                Iletisim
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white">
          {/* Mobile Search */}
          <div className="p-4 border-b border-border">
            <input
              type="text"
              placeholder="Urun ara..."
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <nav className="p-4 space-y-3">
            {[
              { href: "/kategori", label: "Tum Kategoriler" },
              { href: "/markalar", label: "Markalar" },
              { href: "/firsatlar", label: "Firsatlar" },
              { href: "/yeni-urunler", label: "Yeni Urunler" },
              { href: "/cok-satanlar", label: "Cok Satanlar" },
              { href: session?.user ? "/hesabim" : "/giris", label: session?.user ? "Hesabim" : "Giris Yap" },
              { href: "/blog", label: "Blog" },
              { href: "/iletisim", label: "Iletisim" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-sm text-foreground hover:text-primary py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
