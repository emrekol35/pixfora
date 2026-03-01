"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { CategoryGridProps } from "@/themes/types";

const CARD_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-pink-500 to-rose-600",
  "from-orange-400 to-red-500",
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-indigo-600",
  "from-amber-400 to-orange-500",
  "from-fuchsia-500 to-pink-600",
  "from-cyan-500 to-blue-600",
];

export default function BoldCategoryGrid({ categories }: CategoryGridProps) {
  const t = useTranslations("home");
  const tc = useTranslations("common");

  if (categories.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-14">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
          {t("categoriesTitle")}
        </h2>
        <Link
          href="/kategori"
          className="text-sm font-bold text-violet-600 hover:text-violet-700 px-4 py-2 rounded-full bg-violet-50 hover:bg-violet-100 transition-colors"
        >
          {tc("viewAll")} &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {categories.map((cat: any, index: number) => {
          const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
          return (
            <Link
              key={cat.id}
              href={`/kategori/${cat.slug}`}
              className="group relative flex flex-col items-center justify-center p-6 rounded-2xl overflow-hidden hover:scale-105 hover:shadow-xl transition-all duration-300 min-h-[140px]"
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {cat.image ? (
                    <Image src={cat.image} alt={cat.name} width={28} height={28} className="object-contain" />
                  ) : (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-bold text-white drop-shadow-sm">
                  {cat.name}
                </span>
                <span className="text-xs text-white/70 mt-1 font-medium">
                  {tc("productCount", { count: cat._count.products })}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
