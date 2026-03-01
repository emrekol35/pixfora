import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["tr", "en"],
  defaultLocale: "tr",
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/kategori": {
      tr: "/kategori",
      en: "/category",
    },
    "/kategori/[slug]": {
      tr: "/kategori/[slug]",
      en: "/category/[slug]",
    },
    "/urun/[slug]": {
      tr: "/urun/[slug]",
      en: "/product/[slug]",
    },
    "/sepet": {
      tr: "/sepet",
      en: "/cart",
    },
    "/odeme": {
      tr: "/odeme",
      en: "/checkout",
    },
    "/odeme-basarisiz": {
      tr: "/odeme-basarisiz",
      en: "/payment-failed",
    },
    "/hesabim": {
      tr: "/hesabim",
      en: "/my-account",
    },
    "/hesabim/siparislerim": {
      tr: "/hesabim/siparislerim",
      en: "/my-account/orders",
    },
    "/hesabim/siparislerim/[id]": {
      tr: "/hesabim/siparislerim/[id]",
      en: "/my-account/orders/[id]",
    },
    "/hesabim/siparislerim/[id]/iade": {
      tr: "/hesabim/siparislerim/[id]/iade",
      en: "/my-account/orders/[id]/return",
    },
    "/hesabim/iadelerim": {
      tr: "/hesabim/iadelerim",
      en: "/my-account/returns",
    },
    "/hesabim/iadelerim/[id]": {
      tr: "/hesabim/iadelerim/[id]",
      en: "/my-account/returns/[id]",
    },
    "/hesabim/adreslerim": {
      tr: "/hesabim/adreslerim",
      en: "/my-account/addresses",
    },
    "/hesabim/favorilerim": {
      tr: "/hesabim/favorilerim",
      en: "/my-account/wishlist",
    },
    "/hesabim/profil": {
      tr: "/hesabim/profil",
      en: "/my-account/profile",
    },
    "/hesabim/bildirimler": {
      tr: "/hesabim/bildirimler",
      en: "/my-account/notifications",
    },
    "/hesabim/bildirim-tercihleri": {
      tr: "/hesabim/bildirim-tercihleri",
      en: "/my-account/notification-preferences",
    },
    "/giris": {
      tr: "/giris",
      en: "/login",
    },
    "/kayit": {
      tr: "/kayit",
      en: "/register",
    },
    "/iletisim": {
      tr: "/iletisim",
      en: "/contact",
    },
    "/arama": {
      tr: "/arama",
      en: "/search",
    },
    "/blog": "/blog",
    "/blog/[slug]": "/blog/[slug]",
    "/markalar": {
      tr: "/markalar",
      en: "/brands",
    },
    "/marka/[slug]": {
      tr: "/marka/[slug]",
      en: "/brand/[slug]",
    },
    "/firsatlar": {
      tr: "/firsatlar",
      en: "/deals",
    },
    "/cok-satanlar": {
      tr: "/cok-satanlar",
      en: "/best-sellers",
    },
    "/yeni-urunler": {
      tr: "/yeni-urunler",
      en: "/new-arrivals",
    },
    "/sayfa/[slug]": {
      tr: "/sayfa/[slug]",
      en: "/page/[slug]",
    },
    "/karsilastir": {
      tr: "/karsilastir",
      en: "/compare",
    },
    "/siparis-takip": {
      tr: "/siparis-takip",
      en: "/order-tracking",
    },
    "/siparis-basarili": {
      tr: "/siparis-basarili",
      en: "/order-success",
    },
    "/bulten/onayla": {
      tr: "/bulten/onayla",
      en: "/newsletter/confirm",
    },
    "/bulten/abonelikten-cik": {
      tr: "/bulten/abonelikten-cik",
      en: "/newsletter/unsubscribe",
    },
  },
});

export type Pathnames = keyof typeof routing.pathnames;
export type Locale = (typeof routing.locales)[number];
