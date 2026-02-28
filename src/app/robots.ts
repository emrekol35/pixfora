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
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
