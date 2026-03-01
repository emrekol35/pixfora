"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { CategoryGridProps } from "@/themes/types";

export default function MinimalCategoryGrid({ categories }: CategoryGridProps) {
  const t = useTranslations("home");
  const tc = useTranslations("common");

  if (categories.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-lg font-light tracking-[0.1em] uppercase text-foreground">
          {t("categoriesTitle")}
        </h2>
        <Link
          href="/kategori"
          className="text-[11px] tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          {tc("viewAll")}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/kategori/${cat.slug}`}
            className="group flex items-center justify-between py-4 border-b border-border/50 hover:border-[#c9a96e] transition-colors"
          >
            <span className="text-sm font-light italic text-foreground group-hover:text-[#c9a96e] transition-colors">
              {cat.name}
            </span>
            <span className="text-[11px] text-muted-foreground tracking-wide">
              {tc("productCount", { count: cat._count.products })}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
