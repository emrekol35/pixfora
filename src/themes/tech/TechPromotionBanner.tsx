"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function TechPromotionBanner() {
  const t = useTranslations("home");
  const tp = useTranslations("product");

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="relative bg-[#111122] border border-[#2a2a3e] border-l-2 border-l-[#00d4ff] rounded-sm p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative">
          <h3 className="text-xl md:text-2xl font-bold text-[#00d4ff] mb-2 drop-shadow-[0_0_8px_rgba(0,212,255,0.3)]">
            {t("freeShippingBannerTitle")}
          </h3>
          <p className="text-gray-400">
            {t("freeShippingBannerDesc")}
          </p>
        </div>
        <Link
          href="/kategori"
          className="relative px-8 py-3 border border-[#00ff88] text-[#00ff88] font-mono uppercase tracking-wider text-sm hover:bg-[#00ff88] hover:text-black transition-all shadow-[0_0_10px_rgba(0,255,136,0.15)] hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] shrink-0"
        >
          {tp("buyNow")}
        </Link>
      </div>
    </section>
  );
}
