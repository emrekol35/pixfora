import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.AUTH_URL || "https://pixfora.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/hesabim/",
          "/sepet",
          "/odeme",
          "/odeme-basarisiz",
          "/siparis-basarili",
          "/giris",
          "/kayit",
          "/karsilastir",
          // English equivalents
          "/en/my-account/",
          "/en/cart",
          "/en/checkout",
          "/en/payment-failed",
          "/en/order-success",
          "/en/login",
          "/en/register",
          "/en/compare",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
