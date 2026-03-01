"use client";

import { useTranslations } from "next-intl";

export default function MinimalTrustBadges() {
  const t = useTranslations("home");

  const items = [
    { title: t("trustSecureShopping"), desc: t("trustSecureShoppingDesc") },
    { title: t("trustFastShipping"), desc: t("trustFastShippingDesc") },
    { title: t("trustEasyReturn"), desc: t("trustEasyReturnDesc") },
    { title: t("trustSupport"), desc: t("trustSupportDesc") },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="grid grid-cols-2 md:grid-cols-4">
        {items.map((item, i) => (
          <div
            key={item.title}
            className={`py-6 md:py-0 md:px-8 text-center ${
              i < items.length - 1
                ? "border-b md:border-b-0 md:border-r border-border/50"
                : ""
            }`}
          >
            <h4 className="text-[10px] tracking-[0.2em] uppercase text-foreground mb-2">
              {item.title}
            </h4>
            <p className="text-[11px] text-muted-foreground font-light leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
