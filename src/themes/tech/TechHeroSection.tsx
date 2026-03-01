"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { HeroSectionProps } from "@/themes/types";

export default function TechHeroSection({ slides }: HeroSectionProps) {
  const t = useTranslations("home");

  if (slides.length > 0) {
    return (
      <section className="relative bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] overflow-hidden">
        {/* Grid overlay effect */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight text-white drop-shadow-[0_0_20px_rgba(0,212,255,0.2)]">
              {slides[0].title || t("heroDefaultTitle")}
            </h1>
            {slides[0].subtitle && (
              <p className="text-lg text-gray-400 mb-8">{slides[0].subtitle}</p>
            )}
            {slides[0].link && (
              <Link
                href={slides[0].link}
                className="inline-block px-8 py-3 border border-[#00d4ff] text-[#00d4ff] font-mono uppercase tracking-wider text-sm hover:bg-[#00d4ff] hover:text-black transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)] hover:shadow-[0_0_25px_rgba(0,212,255,0.4)]"
              >
                {t("heroDiscover")}
              </Link>
            )}
          </div>
        </div>

        {/* Decorative neon line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/50 to-transparent" />
      </section>
    );
  }

  return (
    <section className="relative bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a] overflow-hidden">
      {/* Grid overlay effect */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 text-white drop-shadow-[0_0_20px_rgba(0,212,255,0.2)]">
          {t("heroDefaultTitle")}
        </h1>
        <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
          {t("heroDefaultSubtitle")}
        </p>
        <Link
          href="/kategori"
          className="inline-block px-8 py-3 border border-[#00d4ff] text-[#00d4ff] font-mono uppercase tracking-wider text-sm hover:bg-[#00d4ff] hover:text-black transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)] hover:shadow-[0_0_25px_rgba(0,212,255,0.4)]"
        >
          {t("heroStartShopping")}
        </Link>
      </div>

      {/* Decorative neon line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/50 to-transparent" />
    </section>
  );
}
