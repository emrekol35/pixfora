"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { CategoryGridProps } from "@/themes/types";

const GRADIENTS = [
  "from-[#1a1a1a] to-[#2d2d2d]",
  "from-[#1b4332] to-[#2d6a4f]",
  "from-[#2d2d2d] to-[#1a1a1a]",
  "from-[#3d2b1f] to-[#5c4033]",
  "from-[#1a1a2e] to-[#16213e]",
  "from-[#2d2d2d] to-[#3d3d3d]",
];

export default function ElegantCategoryGrid({ categories }: CategoryGridProps) {
  const t = useTranslations("home");
  const tc = useTranslations("common");

  if (categories.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      {/* Section Header */}
      <div className="text-center mb-12">
        <div className="w-12 h-px bg-[#c9a96e] mx-auto mb-4" />
        <h2 className="text-2xl md:text-3xl font-serif tracking-wide text-[#1a1a1a]">
          {t("categoriesTitle")}
        </h2>
        <div className="w-12 h-px bg-[#c9a96e] mx-auto mt-4" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {categories.map((cat: any, index: number) => (
          <Link
            key={cat.id}
            href={`/kategori/${cat.slug}`}
            className="group relative aspect-[4/3] overflow-hidden"
          >
            {/* Dark gradient background (placeholder for photo) */}
            <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]} transition-all duration-500`} />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all duration-500" />

            {/* Gold border on hover */}
            <div className="absolute inset-0 border border-[#c9a96e]/0 group-hover:border-[#c9a96e]/60 transition-all duration-500 m-3" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <h3 className="font-serif text-lg md:text-xl text-[#c9a96e] tracking-wider mb-1">
                {cat.name}
              </h3>
              <p className="text-xs text-white/50 font-serif italic">
                {tc("productCount", { count: cat._count.products })}
              </p>

              {/* Animated underline */}
              <div className="w-0 group-hover:w-12 h-px bg-[#c9a96e] mt-3 transition-all duration-500" />
            </div>
          </Link>
        ))}
      </div>

      {/* View All Link */}
      <div className="text-center mt-10">
        <Link
          href="/kategori"
          className="inline-block font-serif text-sm tracking-widest uppercase text-[#c9a96e] border-b border-[#c9a96e]/30 pb-1 hover:border-[#c9a96e] transition-colors"
        >
          {tc("viewAll")} &rarr;
        </Link>
      </div>
    </section>
  );
}
