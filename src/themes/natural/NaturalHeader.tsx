"use client";

import Link from "next/link";
import { useHeaderLogic } from "@/themes/hooks/useHeaderLogic";
import NotificationBell from "@/components/storefront/NotificationBell";
import SearchDropdown from "@/components/storefront/SearchDropdown";
import LanguageSwitcher from "@/components/storefront/LanguageSwitcher";
import DarkModeToggle from "@/components/storefront/DarkModeToggle";
import { useTranslations } from "next-intl";

export default function NaturalHeader() {
  const t = useTranslations("header");
  const tc = useTranslations("common");
  const h = useHeaderLogic();

  return (
    <header className="sticky top-0 z-50 bg-[#fefae0] border-b border-[#d4c9a8]">
      {/* Top Bar */}
      <div className="bg-[#2d6a4f] text-white text-xs py-1.5">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            {/* Leaf icon */}
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
            </svg>
            {t("freeShippingBanner")}
          </span>
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/hesabim/siparislerim" className="hover:underline">{t("orderTracking")}</Link>
            <Link href="/iletisim" className="hover:underline">{t("help")}</Link>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo with leaf */}
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-[#2d6a4f] shrink-0">
            <svg className="w-7 h-7 text-[#40916c]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
            </svg>
            Pixfora
          </Link>

          {/* Search Bar */}
          <div ref={h.searchRef} className="hidden md:block flex-1 max-w-xl relative">
            <div className="relative">
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                className="w-full pl-10 pr-4 py-2.5 border border-[#d4c9a8] rounded-full text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/30 focus:border-[#2d6a4f] placeholder:text-[#5c4033]/50 transition-colors"
                value={h.query}
                onChange={(e) => h.handleSearch(e.target.value)}
                onFocus={h.handleFocus}
                onKeyDown={h.handleKeyDown}
              />
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c4033]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {h.isOpen && <SearchDropdown query={h.query} suggestions={h.suggestions} isLoading={h.isLoading} recentSearches={[]} onClose={h.closeSearch} />}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Link href="/arama" className="md:hidden p-2 text-[#5c4033] hover:text-[#2d6a4f]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </Link>
            <Link href={h.session?.user ? "/hesabim" : "/giris"} className="hidden sm:flex items-center gap-1.5 text-sm text-[#5c4033] hover:text-[#2d6a4f] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <span className="hidden lg:inline">{h.session?.user ? h.session.user.name || tc("myAccount") : tc("login")}</span>
            </Link>
            <DarkModeToggle />
            <NotificationBell />
            {h.session?.user && (
              <Link href="/hesabim/favorilerim" className="relative hidden sm:flex items-center text-[#5c4033] hover:text-[#2d6a4f] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                {h.mounted && h.wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#2d6a4f] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">{h.wishlistCount}</span>
                )}
              </Link>
            )}
            <button onClick={h.openCart} className="relative flex items-center gap-1.5 text-sm text-[#5c4033] hover:text-[#2d6a4f] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
              <span className="hidden lg:inline">{tc("cart")}</span>
              {h.mounted && h.itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#2d6a4f] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">{h.itemCount}</span>
              )}
            </button>
            <button onClick={h.toggleMobileMenu} className="md:hidden p-2 text-[#5c4033]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={h.mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="hidden md:block border-t border-[#d4c9a8]">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-6 py-2.5 text-sm">
            <li><Link href="/kategori" className="font-medium text-[#2d6a4f] hover:text-[#40916c] transition-colors">{t("allCategories")}</Link></li>
            <li><Link href="/markalar" className="text-[#5c4033] hover:text-[#2d6a4f] transition-colors">{tc("brands")}</Link></li>
            <li><Link href="/firsatlar" className="text-[#2d6a4f] font-medium hover:text-[#40916c] transition-colors">{t("deals")}</Link></li>
            <li><Link href="/yeni-urunler" className="text-[#5c4033] hover:text-[#2d6a4f] transition-colors">{t("newProducts")}</Link></li>
            <li><Link href="/cok-satanlar" className="text-[#5c4033] hover:text-[#2d6a4f] transition-colors">{t("bestSellers")}</Link></li>
            <li><Link href="/blog" className="text-[#5c4033] hover:text-[#2d6a4f] transition-colors">{t("blog")}</Link></li>
            <li><Link href="/iletisim" className="text-[#5c4033] hover:text-[#2d6a4f] transition-colors">{t("contact")}</Link></li>
          </ul>
        </div>
      </nav>

      {/* Mobile Menu */}
      {h.mobileMenuOpen && (
        <div className="md:hidden border-t border-[#d4c9a8] bg-[#fefae0]">
          <div className="p-4 border-b border-[#d4c9a8]">
            <input type="text" placeholder={t("mobileSearchPlaceholder")} className="w-full pl-10 pr-4 py-2.5 border border-[#d4c9a8] rounded-full text-sm bg-white/80" value={h.query} onChange={(e) => h.handleSearch(e.target.value)} />
          </div>
          <nav className="p-4 space-y-3">
            {[
              { href: "/kategori", label: t("allCategories") }, { href: "/markalar", label: tc("brands") },
              { href: "/firsatlar", label: t("deals") }, { href: "/yeni-urunler", label: t("newProducts") },
              { href: "/cok-satanlar", label: t("bestSellers") }, { href: "/siparis-takip", label: t("orderTracking") },
              { href: h.session?.user ? "/hesabim" : "/giris", label: h.session?.user ? tc("myAccount") : tc("login") },
              { href: "/blog", label: t("blog") }, { href: "/iletisim", label: t("contact") },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="block text-sm text-[#5c4033] hover:text-[#2d6a4f] py-1" onClick={h.closeMobileMenu}>{item.label}</Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
