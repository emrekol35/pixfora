"use client";

import Link from "next/link";
import { useState } from "react";
import { useHeaderLogic } from "@/themes/hooks/useHeaderLogic";
import SearchDropdown from "@/components/storefront/SearchDropdown";
import DarkModeToggle from "@/components/storefront/DarkModeToggle";
import { useTranslations } from "next-intl";

export default function MinimalHeader() {
  const t = useTranslations("header");
  const tc = useTranslations("common");
  const h = useHeaderLogic();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background">
      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Left: hamburger (mobile) */}
          <div className="flex items-center gap-3 w-1/3">
            <button
              onClick={h.toggleMobileMenu}
              className="md:hidden p-1 text-foreground"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={h.mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>

          {/* Center: Logo */}
          <div className="flex-shrink-0 text-center">
            <Link href="/" className="text-2xl tracking-[0.2em] uppercase font-light text-foreground">
              Pixfora
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center justify-end gap-4 w-1/3">
            {/* Search Toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-1 text-foreground hover:text-[#c9a96e] transition-colors"
              aria-label={t("searchPlaceholder")}
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Account */}
            <Link
              href={h.session?.user ? "/hesabim" : "/giris"}
              className="hidden sm:block p-1 text-foreground hover:text-[#c9a96e] transition-colors"
              aria-label={h.session?.user ? tc("myAccount") : tc("login")}
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>

            <DarkModeToggle />

            {/* Cart */}
            <button
              onClick={h.openCart}
              className="relative p-1 text-foreground hover:text-[#c9a96e] transition-colors"
              aria-label={tc("cart")}
            >
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {h.mounted && h.itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-foreground text-background text-[9px] font-light rounded-full min-w-[16px] h-[16px] flex items-center justify-center">
                  {h.itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation - Desktop */}
      <nav className="hidden md:block border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center justify-center gap-8 py-3 text-[11px] tracking-[0.15em] uppercase">
            <li><Link href="/kategori" className="text-muted-foreground hover:text-foreground transition-colors">{t("allCategories")}</Link></li>
            <li><Link href="/markalar" className="text-muted-foreground hover:text-foreground transition-colors">{tc("brands")}</Link></li>
            <li><Link href="/yeni-urunler" className="text-muted-foreground hover:text-foreground transition-colors">{t("newProducts")}</Link></li>
            <li><Link href="/cok-satanlar" className="text-muted-foreground hover:text-foreground transition-colors">{t("bestSellers")}</Link></li>
            <li><Link href="/firsatlar" className="text-muted-foreground hover:text-foreground transition-colors">{t("deals")}</Link></li>
            <li><Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">{t("blog")}</Link></li>
            <li><Link href="/iletisim" className="text-muted-foreground hover:text-foreground transition-colors">{t("contact")}</Link></li>
          </ul>
        </div>
      </nav>

      {/* Border bottom */}
      <div className="border-b border-border/50" />

      {/* Expandable Search Bar */}
      {searchOpen && (
        <div className="border-b border-border/50 bg-background">
          <div ref={h.searchRef} className="max-w-xl mx-auto px-4 py-4 relative">
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              className="w-full px-0 py-2 bg-transparent border-b border-border text-sm tracking-wide focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50"
              value={h.query}
              onChange={(e) => h.handleSearch(e.target.value)}
              onFocus={h.handleFocus}
              onKeyDown={h.handleKeyDown}
              autoFocus
            />
            {h.isOpen && (
              <SearchDropdown
                query={h.query}
                suggestions={h.suggestions}
                isLoading={h.isLoading}
                recentSearches={[]}
                onClose={h.closeSearch}
              />
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {h.mobileMenuOpen && (
        <div className="md:hidden border-b border-border/50 bg-background">
          <nav className="max-w-7xl mx-auto px-4 py-6 space-y-4">
            {[
              { href: "/kategori", label: t("allCategories") },
              { href: "/markalar", label: tc("brands") },
              { href: "/yeni-urunler", label: t("newProducts") },
              { href: "/cok-satanlar", label: t("bestSellers") },
              { href: "/firsatlar", label: t("deals") },
              { href: "/blog", label: t("blog") },
              { href: "/iletisim", label: t("contact") },
              { href: h.session?.user ? "/hesabim" : "/giris", label: h.session?.user ? tc("myAccount") : tc("login") },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-[11px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                onClick={h.closeMobileMenu}
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
