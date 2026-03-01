"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function DefaultPromotionBanner() {
  const t = useTranslations("home");
  const tp = useTranslations("product");

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="bg-gradient-to-r from-warning/10 to-warning/5 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
            {t("freeShippingBannerTitle")}
          </h3>
          <p className="text-muted-foreground">
            {t("freeShippingBannerDesc")}
          </p>
        </div>
        <Link
          href="/kategori"
          className="px-8 py-3 bg-warning text-white font-semibold rounded-lg hover:bg-warning/90 transition-colors shrink-0"
        >
          {tp("buyNow")}
        </Link>
      </div>
    </section>
  );
}
