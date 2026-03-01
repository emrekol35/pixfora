"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function MinimalPromotionBanner() {
  const t = useTranslations("home");
  const tp = useTranslations("product");

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="border-t border-b border-border/50 py-12 text-center">
        <h3 className="text-xl md:text-2xl font-light italic text-foreground mb-3 tracking-tight">
          {t("freeShippingBannerTitle")}
        </h3>
        <p className="text-sm text-muted-foreground font-light mb-6 max-w-md mx-auto">
          {t("freeShippingBannerDesc")}
        </p>
        <Link
          href="/kategori"
          className="inline-block text-[11px] tracking-[0.15em] uppercase text-foreground underline underline-offset-4 decoration-[#c9a96e] hover:text-[#c9a96e] transition-colors"
        >
          {tp("buyNow")}
        </Link>
      </div>
    </section>
  );
}
