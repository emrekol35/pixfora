"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { HeroSectionProps } from "@/themes/types";

export default function DefaultHeroSection({ slides }: HeroSectionProps) {
  const t = useTranslations("home");

  if (slides.length > 0) {
    return (
      <section className="relative bg-gradient-to-r from-primary to-primary-dark text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              {slides[0].title || t("heroDefaultTitle")}
            </h1>
            {slides[0].subtitle && (
              <p className="text-lg text-white/80 mb-8">{slides[0].subtitle}</p>
            )}
            {slides[0].link && (
              <Link
                href={slides[0].link}
                className="inline-block px-8 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors"
              >
                {t("heroDiscover")}
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-r from-primary to-primary-dark text-white">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          {t("heroDefaultTitle")}
        </h1>
        <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
          {t("heroDefaultSubtitle")}
        </p>
        <Link
          href="/kategori"
          className="inline-block px-8 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors"
        >
          {t("heroStartShopping")}
        </Link>
      </div>
    </section>
  );
}
