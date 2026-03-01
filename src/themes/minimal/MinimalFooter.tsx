"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function MinimalFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-24 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-[11px] tracking-[0.1em] uppercase text-muted-foreground">
            &copy; 2026 Pixfora. {t("copyright")}
          </p>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6">
            <Link
              href="/sayfa/hakkimizda"
              className="text-[11px] tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("aboutUs")}
            </Link>
            <Link
              href="/iletisim"
              className="text-[11px] tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("contactTitle")}
            </Link>
            <Link
              href="/sayfa/gizlilik-politikasi"
              className="text-[11px] tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("privacyPolicy")}
            </Link>
            <Link
              href="/sayfa/kullanim-kosullari"
              className="text-[11px] tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("termsOfUse")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
