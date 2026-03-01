"use client";

import Link from "next/link";
import { useHeaderLogic } from "@/themes/hooks/useHeaderLogic";
import NotificationBell from "@/components/storefront/NotificationBell";
import SearchDropdown from "@/components/storefront/SearchDropdown";
import LanguageSwitcher from "@/components/storefront/LanguageSwitcher";
import DarkModeToggle from "@/components/storefront/DarkModeToggle";
import { useTranslations } from "next-intl";

export default function ElegantHeader() {
  const t = useTranslations("header");
  const tc = useTranslations("common");
  const h = useHeaderLogic();

  return (
    <header className="sticky top-0 z-50 bg-[#1a1a1a] text-white border-b border-[#c9a96e]">
      {/* Top Bar */}
      <div className="border-b border-[#c9a96e]/20">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs tracking-wider uppercase">
          <span className="text-white/60 font-serif">{t("freeShippingBanner")}</span>
          <div className="hidden sm:flex items-center gap-6">
            <Link href="/hesabim/siparislerim" className="text-white/60 hover:text-[#c9a96e] transition-colors font-serif">
              {t("orderTracking")}
            </Link>
            <Link href="/iletisim" className="text-white/60 hover:text-[#c9a96e] transition-colors font-serif">
              {t("help")}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <span className="text-2xl md:text-3xl font-serif italic tracking-widest text-[#c9a96e]">
              Pixfora
            </span>
          </Link>

          {/* Search Bar */}
          <div ref={h.searchRef} className="hidden md:block flex-1 max-w-lg relative">
            <div className="relative">
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder-white/40 text-sm font-serif focus:outline-none focus:ring-1 focus:ring-[#c9a96e] focus:border-[#c9a96e] transition-colors"
                value={h.query}
                onChange={(e) => h.handleSearch(e.target.value)}
                onFocus={h.handleFocus}
                onKeyDown={h.handleKeyDown}
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
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

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Mobile Search */}
            <Link href="/arama" className="md:hidden p-2 text-white/60 hover:text-[#c9a96e] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            {/* Account */}
            <Link
              href={h.session?.user ? "/hesabim" : "/giris"}
              className="hidden sm:flex items-center gap-2 text-sm text-white/60 hover:text-[#c9a96e] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden lg:inline font-serif text-xs tracking-wider uppercase">
                {h.session?.user ? h.session.user.name || tc("myAccount") : tc("login")}
              </span>
            </Link>

            <DarkModeToggle />
            <NotificationBell />

            {/* Wishlist */}
            {h.session?.user && (
              <Link
                href="/hesabim/favorilerim"
                className="relative hidden sm:flex items-center text-white/60 hover:text-[#c9a96e] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {h.mounted && h.wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#c9a96e] text-[#1a1a1a] text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                    {h.wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart */}
            <button
              onClick={h.openCart}
              className="relative flex items-center gap-2 text-sm text-white/60 hover:text-[#c9a96e] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="hidden lg:inline font-serif text-xs tracking-wider uppercase">{tc("cart")}</span>
              {h.mounted && h.itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#c9a96e] text-[#1a1a1a] text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                  {h.itemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button onClick={h.toggleMobileMenu} className="md:hidden p-2 text-white/60 hover:text-[#c9a96e]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={h.mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="hidden md:block border-t border-[#c9a96e]/20">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center justify-center gap-8 py-3 text-sm">
            <li>
              <Link href="/kategori" className="font-serif tracking-wider uppercase text-white/80 hover:text-[#c9a96e] transition-colors">
                {t("allCategories")}
              </Link>
            </li>
            <li>
              <Link href="/markalar" className="font-serif tracking-wider uppercase text-white/60 hover:text-[#c9a96e] transition-colors">
                {tc("brands")}
              </Link>
            </li>
            <li>
              <Link href="/firsatlar" className="font-serif tracking-wider uppercase text-[#c9a96e] hover:text-[#c9a96e]/80 transition-colors">
                {t("deals")}
              </Link>
            </li>
            <li>
              <Link href="/yeni-urunler" className="font-serif tracking-wider uppercase text-white/60 hover:text-[#c9a96e] transition-colors">
                {t("newProducts")}
              </Link>
            </li>
            <li>
              <Link href="/cok-satanlar" className="font-serif tracking-wider uppercase text-white/60 hover:text-[#c9a96e] transition-colors">
                {t("bestSellers")}
              </Link>
            </li>
            <li>
              <Link href="/blog" className="font-serif tracking-wider uppercase text-white/60 hover:text-[#c9a96e] transition-colors">
                {t("blog")}
              </Link>
            </li>
            <li>
              <Link href="/iletisim" className="font-serif tracking-wider uppercase text-white/60 hover:text-[#c9a96e] transition-colors">
                {t("contact")}
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Menu */}
      {h.mobileMenuOpen && (
        <div className="md:hidden border-t border-[#c9a96e]/20 bg-[#1a1a1a]">
          <div className="p-4 border-b border-[#c9a96e]/10">
            <input
              type="text"
              placeholder={t("mobileSearchPlaceholder")}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder-white/40 text-sm font-serif"
              value={h.query}
              onChange={(e) => h.handleSearch(e.target.value)}
            />
          </div>
          <nav className="p-4 space-y-3">
            {[
              { href: "/kategori", label: t("allCategories") },
              { href: "/markalar", label: tc("brands") },
              { href: "/firsatlar", label: t("deals") },
              { href: "/yeni-urunler", label: t("newProducts") },
              { href: "/cok-satanlar", label: t("bestSellers") },
              { href: "/siparis-takip", label: t("orderTracking") },
              { href: h.session?.user ? "/hesabim" : "/giris", label: h.session?.user ? tc("myAccount") : tc("login") },
              { href: "/blog", label: t("blog") },
              { href: "/iletisim", label: t("contact") },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-sm font-serif tracking-wider uppercase text-white/60 hover:text-[#c9a96e] py-1 transition-colors"
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
