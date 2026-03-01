"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function BoldPromotionBanner() {
  const t = useTranslations("home");
  const tp = useTranslations("product");

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="relative bg-gradient-to-r from-orange-500 via-pink-500 to-violet-500 rounded-3xl p-8 md:p-14 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-3 leading-tight">
              {t("freeShippingBannerTitle")}
            </h3>
            <p className="text-white/80 text-sm md:text-base max-w-lg">
              {t("freeShippingBannerDesc")}
            </p>
          </div>
          <Link
            href="/kategori"
            className="px-10 py-4 bg-white text-orange-600 font-extrabold text-lg rounded-full hover:bg-white/90 hover:scale-105 hover:shadow-2xl transition-all duration-300 shadow-xl shrink-0"
          >
            {tp("buyNow")}
          </Link>
        </div>
      </div>
    </section>
  );
}
