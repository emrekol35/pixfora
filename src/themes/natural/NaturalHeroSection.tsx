"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { HeroSectionProps } from "@/themes/types";

export default function NaturalHeroSection({ slides }: HeroSectionProps) {
  const t = useTranslations("home");

  if (slides.length > 0) {
    return (
      <section className="relative bg-gradient-to-r from-[#2d6a4f] to-[#40916c] text-white overflow-hidden">
        {/* Decorative leaf pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute top-4 right-10 w-32 h-32 rotate-45" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
          </svg>
          <svg className="absolute bottom-8 left-20 w-24 h-24 -rotate-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
          </svg>
          <svg className="absolute top-1/2 right-1/3 w-20 h-20 rotate-90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 rounded-full text-sm mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
              </svg>
              %100 Dogal & Organik
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              {slides[0].title || t("heroDefaultTitle")}
            </h1>
            {slides[0].subtitle && (
              <p className="text-lg text-white/80 mb-8">{slides[0].subtitle}</p>
            )}
            {slides[0].link && (
              <Link
                href={slides[0].link}
                className="inline-block px-8 py-3 bg-[#fefae0] text-[#2d6a4f] font-semibold rounded-full hover:bg-white transition-colors shadow-lg"
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
    <section className="relative bg-gradient-to-r from-[#2d6a4f] to-[#40916c] text-white overflow-hidden">
      {/* Decorative leaf pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="absolute top-4 right-10 w-32 h-32 rotate-45" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
        </svg>
        <svg className="absolute bottom-8 left-20 w-24 h-24 -rotate-12" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 rounded-full text-sm mb-6">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
          </svg>
          %100 Dogal & Organik
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          {t("heroDefaultTitle")}
        </h1>
        <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
          {t("heroDefaultSubtitle")}
        </p>
        <Link
          href="/kategori"
          className="inline-block px-8 py-3 bg-[#fefae0] text-[#2d6a4f] font-semibold rounded-full hover:bg-white transition-colors shadow-lg"
        >
          {t("heroStartShopping")}
        </Link>
      </div>
    </section>
  );
}
