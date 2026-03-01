"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function FooterMinimal() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-foreground text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold text-primary-light">Pixfora</Link>

          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/60">
            <Link href="/sayfa/hakkimizda" className="hover:text-white transition-colors">{t("aboutUs")}</Link>
            <Link href="/iletisim" className="hover:text-white transition-colors">{t("contactTitle")}</Link>
            <Link href="/sayfa/sss" className="hover:text-white transition-colors">{t("faq")}</Link>
            <Link href="/sayfa/gizlilik-politikasi" className="hover:text-white transition-colors">{t("privacyPolicy")}</Link>
            <Link href="/sayfa/kullanim-kosullari" className="hover:text-white transition-colors">{t("termsOfUse")}</Link>
          </nav>

          <div className="flex items-center gap-3">
            {["facebook", "instagram", "twitter"].map((name) => (
              <a key={name} href="#" aria-label={name} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-primary hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /></svg>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center text-xs text-white/40">
          <p>&copy; 2026 Pixfora. {t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
