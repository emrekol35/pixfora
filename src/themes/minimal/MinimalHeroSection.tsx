"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { HeroSectionProps } from "@/themes/types";

export default function MinimalHeroSection({ slides }: HeroSectionProps) {
  const t = useTranslations("home");

  const title =
    slides.length > 0 && slides[0].title
      ? slides[0].title
      : t("heroDefaultTitle");
  const subtitle =
    slides.length > 0 && slides[0].subtitle
      ? slides[0].subtitle
      : t("heroDefaultSubtitle");
  const link =
    slides.length > 0 && slides[0].link ? slides[0].link : "/kategori";

  return (
    <section className="bg-background">
      <div className="max-w-7xl mx-auto px-4 py-24 md:py-32 text-center">
        <h1 className="text-4xl md:text-6xl font-light tracking-tight text-foreground mb-6 leading-[1.1]">
          {title}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto mb-10 font-light leading-relaxed">
          {subtitle}
        </p>
        <Link
          href={link}
          className="inline-block px-10 py-3 border border-foreground text-[11px] tracking-[0.2em] uppercase text-foreground hover:bg-foreground hover:text-background transition-colors duration-300"
        >
          {t("heroDiscover")}
        </Link>
      </div>
    </section>
  );
}
