"use client";

import { useTranslations } from "next-intl";

export default function TechTrustBadges() {
  const t = useTranslations("home");

  return (
    <section className="bg-[#0a0a0a] py-12 mt-8 border-t border-b border-[#2a2a3e]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {[
            {
              icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
              title: t("trustSecureShopping"),
              desc: t("trustSecureShoppingDesc"),
              color: "#00d4ff",
            },
            {
              icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
              title: t("trustFastShipping"),
              desc: t("trustFastShippingDesc"),
              color: "#00ff88",
            },
            {
              icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
              title: t("trustEasyReturn"),
              desc: t("trustEasyReturnDesc"),
              color: "#00d4ff",
            },
            {
              icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
              title: t("trustSupport"),
              desc: t("trustSupportDesc"),
              color: "#00ff88",
            },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <div
                className="w-12 h-12 mx-auto mb-3 rounded-sm border flex items-center justify-center"
                style={{
                  borderColor: `${item.color}30`,
                  backgroundColor: `${item.color}08`,
                  boxShadow: `0 0 12px ${item.color}15`,
                }}
              >
                <svg
                  className="w-6 h-6"
                  style={{ color: item.color }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
              </div>
              <h4 className="font-semibold text-sm mb-1 text-gray-200">{item.title}</h4>
              <p className="text-xs text-gray-500 font-mono">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
