"use client";

import Link from "next/link";
import { useHeaderLogic } from "@/themes/hooks/useHeaderLogic";
import NotificationBell from "@/components/storefront/NotificationBell";
import SearchDropdown from "@/components/storefront/SearchDropdown";
import LanguageSwitcher from "@/components/storefront/LanguageSwitcher";
import DarkModeToggle from "@/components/storefront/DarkModeToggle";
import { useTranslations } from "next-intl";

export default function BoldHeader() {
  const t = useTranslations("header");
  const tc = useTranslations("common");
  const h = useHeaderLogic();

  return (
    <header className="sticky top-0 z-50">
      {/* Top Bar - Gradient */}
      <div className="bg-gradient-to-r from-violet-700 via-purple-600 to-pink-500 text-white text-xs py-2">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <span className="font-semibold tracking-wide">{t("freeShippingBanner")}</span>
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/hesabim/siparislerim" className="hover:text-white/80 transition-colors font-medium">
              {t("orderTracking")}
            </Link>
            <Link href="/iletisim" className="hover:text-white/80 transition-colors font-medium">
              {t("help")}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-gradient-to-r from-violet-600 to-pink-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md shrink-0">
              Pixfora
            </Link>

            {/* Search Bar */}
            <div ref={h.searchRef} className="hidden md:block flex-1 max-w-xl relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  className="w-full pl-12 pr-4 py-3 rounded-full text-sm bg-white/95 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg"
                  value={h.query}
                  onChange={(e) => h.handleSearch(e.target.value)}
                  onFocus={h.handleFocus}
                  onKeyDown={h.handleKeyDown}
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
            <div className="flex items-center gap-2">
              {/* Mobile search */}
              <Link
                href="/arama"
                className="md:hidden p-2.5 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>

              {/* Account */}
              <Link
                href={h.session?.user ? "/hesabim" : "/giris"}
                className="hidden sm:flex items-center gap-1.5 text-sm text-white/90 hover:text-white px-3 py-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden lg:inline font-medium">
                  {h.session?.user ? h.session.user.name || tc("myAccount") : tc("login")}
                </span>
              </Link>

              <DarkModeToggle />
              <NotificationBell />

              {/* Wishlist */}
              {h.session?.user && (
                <Link
                  href="/hesabim/favorilerim"
                  className="relative hidden sm:flex items-center text-white/90 hover:text-white p-2.5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {h.mounted && h.wishlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-orange-400 text-white text-[10px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center shadow-md">
                      {h.wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Cart - Big pill button */}
              <button
                onClick={h.openCart}
                className="relative flex items-center gap-2 text-sm font-bold text-violet-700 bg-white px-5 py-2.5 rounded-full hover:bg-white/90 hover:scale-105 transition-all shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                <span className="hidden lg:inline">{tc("cart")}</span>
                {h.mounted && h.itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-[10px] font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center shadow-md">
                    {h.itemCount}
                  </span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={h.toggleMobileMenu}
                className="md:hidden p-2.5 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d={h.mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="hidden md:block bg-white/95 backdrop-blur-sm border-b border-purple-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-1 py-2">
            {[
              { href: "/kategori", label: t("allCategories"), bold: true },
              { href: "/markalar", label: tc("brands") },
              { href: "/firsatlar", label: t("deals"), highlight: true },
              { href: "/yeni-urunler", label: t("newProducts") },
              { href: "/cok-satanlar", label: t("bestSellers") },
              { href: "/blog", label: t("blog") },
              { href: "/iletisim", label: t("contact") },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    item.highlight
                      ? "text-pink-600 bg-pink-50 hover:bg-pink-100"
                      : item.bold
                        ? "text-violet-700 font-bold hover:bg-violet-50"
                        : "text-gray-600 hover:bg-violet-50 hover:text-violet-700"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Menu */}
      {h.mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-purple-100 shadow-xl">
          {/* Mobile search */}
          <div className="p-4 bg-gradient-to-r from-violet-50 to-pink-50">
            <div className="relative">
              <input
                type="text"
                placeholder={t("mobileSearchPlaceholder")}
                className="w-full pl-10 pr-4 py-3 rounded-full text-sm border-2 border-violet-200 focus:border-violet-400 focus:outline-none"
                value={h.query}
                onChange={(e) => h.handleSearch(e.target.value)}
              />
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <nav className="p-4 space-y-1">
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
                className="block text-sm font-medium text-gray-700 hover:text-violet-600 hover:bg-violet-50 px-4 py-2.5 rounded-xl transition-colors"
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
