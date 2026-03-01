"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ElegantPromotionBanner() {
  const t = useTranslations("home");
  const tp = useTranslations("product");

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="relative bg-[#1a1a1a] border border-[#c9a96e]/30 overflow-hidden">
        {/* Decorative corners */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-[#c9a96e]/40" />
        <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-[#c9a96e]/40" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b border-l border-[#c9a96e]/40" />
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-[#c9a96e]/40" />

        <div className="relative px-8 py-12 md:px-16 md:py-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <div className="w-12 h-px bg-[#c9a96e]/40 mb-4 mx-auto md:mx-0" />
            <h3 className="text-xl md:text-2xl font-serif text-[#c9a96e] tracking-wide mb-3">
              {t("freeShippingBannerTitle")}
            </h3>
            <p className="text-sm text-white/40 font-serif italic">
              {t("freeShippingBannerDesc")}
            </p>
          </div>
          <Link
            href="/kategori"
            className="px-10 py-3 border border-[#c9a96e] text-[#c9a96e] font-serif text-sm tracking-widest uppercase hover:bg-[#c9a96e] hover:text-[#1a1a1a] transition-all duration-300 shrink-0"
          >
            {tp("buyNow")}
          </Link>
        </div>
      </div>
    </section>
  );
}
