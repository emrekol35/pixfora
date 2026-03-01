"use client";

import { useTranslations } from "next-intl";

export default function BoldTrustBadges() {
  const t = useTranslations("home");

  const badges = [
    {
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      title: t("trustSecureShopping"),
      desc: t("trustSecureShoppingDesc"),
      color: "from-violet-500 to-purple-600",
      bgLight: "bg-violet-50",
    },
    {
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
      title: t("trustFastShipping"),
      desc: t("trustFastShippingDesc"),
      color: "from-pink-500 to-rose-600",
      bgLight: "bg-pink-50",
    },
    {
      icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
      title: t("trustEasyReturn"),
      desc: t("trustEasyReturnDesc"),
      color: "from-orange-400 to-orange-600",
      bgLight: "bg-orange-50",
    },
    {
      icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
      title: t("trustSupport"),
      desc: t("trustSupportDesc"),
      color: "from-emerald-500 to-teal-600",
      bgLight: "bg-emerald-50",
    },
  ];

  return (
    <section className="py-14 mt-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {badges.map((item) => (
            <div
              key={item.title}
              className={`${item.bgLight} rounded-2xl p-5 md:p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
            >
              <div className={`w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </div>
              <h4 className="font-extrabold text-sm text-gray-800 mb-1.5">{item.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
