"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { CategoryGridProps } from "@/themes/types";

export default function TechCategoryGrid({ categories }: CategoryGridProps) {
  const t = useTranslations("home");
  const tc = useTranslations("common");

  if (categories.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-200">
          {t("categoriesTitle")}
        </h2>
        <Link
          href="/kategori"
          className="text-sm text-[#00d4ff] font-mono uppercase tracking-wider hover:text-[#00d4ff]/80 transition-colors"
        >
          {tc("viewAll")} →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {categories.map((cat: any) => (
          <Link
            key={cat.id}
            href={`/kategori/${cat.slug}`}
            className="group flex flex-col items-center p-4 rounded-sm border border-[#2a2a3e] bg-[#111122] hover:border-[#00d4ff] hover:shadow-[0_0_12px_rgba(0,212,255,0.1)] transition-all"
          >
            <div className="w-14 h-14 rounded-sm border border-[#2a2a3e] bg-[#0a0a1a] flex items-center justify-center mb-3 group-hover:border-[#00d4ff]/50 group-hover:shadow-[0_0_8px_rgba(0,212,255,0.15)] transition-all">
              {cat.image ? (
                <Image src={cat.image} alt={cat.name} width={32} height={32} className="object-contain" />
              ) : (
                <svg className="w-6 h-6 text-[#00d4ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium text-center text-gray-300 group-hover:text-[#00d4ff] transition-colors">
              {cat.name}
            </span>
            <span className="text-[10px] text-gray-600 mt-0.5 font-mono uppercase tracking-wider">
              {tc("productCount", { count: cat._count.products })}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
