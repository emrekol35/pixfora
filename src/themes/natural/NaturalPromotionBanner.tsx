"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NaturalPromotionBanner() {
  const t = useTranslations("home");
  const tp = useTranslations("product");

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="relative bg-[#d8f3dc] rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        {/* Decorative leaf backgrounds */}
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute -top-4 -right-4 w-40 h-40 rotate-12" fill="#2d6a4f" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
          </svg>
          <svg className="absolute -bottom-6 -left-6 w-32 h-32 -rotate-45" fill="#2d6a4f" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
          </svg>
        </div>

        <div className="relative z-10">
          <h3 className="text-xl md:text-2xl font-bold text-[#2d6a4f] mb-2">
            {t("freeShippingBannerTitle")}
          </h3>
          <p className="text-[#5c4033]/70">
            {t("freeShippingBannerDesc")}
          </p>
        </div>
        <Link
          href="/kategori"
          className="relative z-10 px-8 py-3 bg-gradient-to-r from-[#2d6a4f] to-[#40916c] text-white font-semibold rounded-full hover:from-[#1b4332] hover:to-[#2d6a4f] transition-all shrink-0 shadow-lg shadow-[#2d6a4f]/20"
        >
          {tp("buyNow")}
        </Link>
      </div>
    </section>
  );
}
