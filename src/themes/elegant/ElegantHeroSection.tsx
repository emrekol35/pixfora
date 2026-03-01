"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { HeroSectionProps } from "@/themes/types";

export default function ElegantHeroSection({ slides }: HeroSectionProps) {
  const t = useTranslations("home");

  if (slides.length > 0) {
    return (
      <section className="relative bg-gradient-to-r from-[#1a1a1a] to-[#2d2d2d] text-white overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 border border-[#c9a96e] rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-72 h-72 border border-[#c9a96e] rounded-full translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            {/* Gold accent line */}
            <div className="w-16 h-px bg-[#c9a96e] mb-8" />

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif leading-tight mb-6 tracking-wide">
              {slides[0].title || t("heroDefaultTitle")}
            </h1>
            {slides[0].subtitle && (
              <p className="text-lg font-serif italic text-white/60 mb-10 leading-relaxed">
                {slides[0].subtitle}
              </p>
            )}
            {slides[0].link && (
              <Link
                href={slides[0].link}
                className="inline-block px-10 py-3.5 border border-[#c9a96e] text-[#c9a96e] font-serif text-sm tracking-widest uppercase hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all duration-300"
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
    <section className="bg-gradient-to-r from-[#1a1a1a] to-[#2d2d2d] text-white">
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] border border-[#c9a96e] rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32 text-center">
        {/* Gold accent line */}
        <div className="w-16 h-px bg-[#c9a96e] mx-auto mb-8" />

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif mb-6 tracking-wide">
          {t("heroDefaultTitle")}
        </h1>
        <p className="text-lg font-serif italic text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
          {t("heroDefaultSubtitle")}
        </p>
        <Link
          href="/kategori"
          className="inline-block px-10 py-3.5 border border-[#c9a96e] text-[#c9a96e] font-serif text-sm tracking-widest uppercase hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all duration-300"
        >
          {t("heroStartShopping")}
        </Link>
      </div>
    </section>
  );
}
