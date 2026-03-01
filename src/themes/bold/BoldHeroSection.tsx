"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { HeroSectionProps } from "@/themes/types";

export default function BoldHeroSection({ slides }: HeroSectionProps) {
  const t = useTranslations("home");

  if (slides.length > 0) {
    return (
      <section className="relative bg-gradient-to-br from-violet-600 via-purple-500 to-pink-500 text-white overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-pink-400/20 rounded-full translate-x-1/3 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-orange-400/15 rounded-full translate-y-1/2 blur-2xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight tracking-tight drop-shadow-lg">
              {slides[0].title || t("heroDefaultTitle")}
            </h1>
            {slides[0].subtitle && (
              <p className="text-lg md:text-xl text-white/80 mb-10 max-w-xl leading-relaxed">
                {slides[0].subtitle}
              </p>
            )}
            {slides[0].link && (
              <Link
                href={slides[0].link}
                className="inline-block px-10 py-4 bg-white text-violet-700 font-extrabold text-lg rounded-full hover:bg-white/90 hover:scale-105 hover:shadow-2xl transition-all duration-300 shadow-xl"
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
    <section className="relative bg-gradient-to-br from-violet-600 via-purple-500 to-pink-500 text-white overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-pink-400/20 rounded-full translate-x-1/3 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-orange-400/15 rounded-full translate-y-1/2 blur-2xl" />
      <div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full blur-xl" />
      <div className="absolute bottom-10 left-10 w-32 h-32 bg-violet-400/20 rounded-full blur-2xl" />

      <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32 text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight drop-shadow-lg">
          {t("heroDefaultTitle")}
        </h1>
        <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
          {t("heroDefaultSubtitle")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/kategori"
            className="inline-block px-10 py-4 bg-white text-violet-700 font-extrabold text-lg rounded-full hover:bg-white/90 hover:scale-105 hover:shadow-2xl transition-all duration-300 shadow-xl"
          >
            {t("heroStartShopping")}
          </Link>
          <Link
            href="/firsatlar"
            className="inline-block px-10 py-4 bg-transparent text-white font-bold text-lg rounded-full border-2 border-white/50 hover:bg-white/10 hover:border-white hover:scale-105 transition-all duration-300"
          >
            {t("deals")}
          </Link>
        </div>
      </div>
    </section>
  );
}
