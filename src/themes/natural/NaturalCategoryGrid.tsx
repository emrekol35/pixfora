"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { CategoryGridProps } from "@/themes/types";

const natureGradients = [
  "from-[#2d6a4f] to-[#40916c]",
  "from-[#40916c] to-[#52b788]",
  "from-[#52b788] to-[#95d5b2]",
  "from-[#1b4332] to-[#2d6a4f]",
  "from-[#5c4033] to-[#8b6914]",
  "from-[#2d6a4f] to-[#52b788]",
];

export default function NaturalCategoryGrid({ categories }: CategoryGridProps) {
  const t = useTranslations("home");
  const tc = useTranslations("common");

  if (categories.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-[#2d6a4f] flex items-center gap-2">
          <svg className="w-6 h-6 text-[#40916c]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
          </svg>
          {t("categoriesTitle")}
        </h2>
        <Link href="/kategori" className="text-sm text-[#2d6a4f] font-medium hover:underline">
          {tc("viewAll")} →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {categories.map((cat: any, index: number) => (
          <Link
            key={cat.id}
            href={`/kategori/${cat.slug}`}
            className="group flex flex-col items-center p-4 rounded-2xl bg-[#fffdf5] border border-[#e8e0cc] hover:border-[#2d6a4f] hover:shadow-md hover:shadow-[#2d6a4f]/10 transition-all"
          >
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${natureGradients[index % natureGradients.length]} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              {cat.image ? (
                <Image src={cat.image} alt={cat.name} width={32} height={32} className="object-contain" />
              ) : (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
                </svg>
              )}
            </div>
            <span className="text-sm font-medium text-center text-[#5c4033] group-hover:text-[#2d6a4f] transition-colors">
              {cat.name}
            </span>
            <span className="text-xs text-[#5c4033]/50 mt-0.5">
              {tc("productCount", { count: cat._count.products })}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
