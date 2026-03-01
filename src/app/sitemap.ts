import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.AUTH_URL || "https://pixfora.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Statik rotalar (TR + EN alternates)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
      alternates: { languages: { tr: BASE_URL, en: `${BASE_URL}/en` } },
    },
    {
      url: `${BASE_URL}/kategori`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
      alternates: { languages: { tr: `${BASE_URL}/kategori`, en: `${BASE_URL}/en/category` } },
    },
    {
      url: `${BASE_URL}/markalar`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: { tr: `${BASE_URL}/markalar`, en: `${BASE_URL}/en/brands` } },
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: { tr: `${BASE_URL}/blog`, en: `${BASE_URL}/en/blog` } },
    },
    {
      url: `${BASE_URL}/iletisim`,
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: { languages: { tr: `${BASE_URL}/iletisim`, en: `${BASE_URL}/en/contact` } },
    },
    {
      url: `${BASE_URL}/cok-satanlar`,
      changeFrequency: "daily",
      priority: 0.7,
      alternates: { languages: { tr: `${BASE_URL}/cok-satanlar`, en: `${BASE_URL}/en/best-sellers` } },
    },
    {
      url: `${BASE_URL}/firsatlar`,
      changeFrequency: "daily",
      priority: 0.7,
      alternates: { languages: { tr: `${BASE_URL}/firsatlar`, en: `${BASE_URL}/en/deals` } },
    },
    {
      url: `${BASE_URL}/yeni-urunler`,
      changeFrequency: "daily",
      priority: 0.7,
      alternates: { languages: { tr: `${BASE_URL}/yeni-urunler`, en: `${BASE_URL}/en/new-arrivals` } },
    },
  ];

  // Paralel DB sorgulari
  const [products, categories, brands, blogPosts, pages] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.page.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/urun/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.9,
    alternates: {
      languages: {
        tr: `${BASE_URL}/urun/${p.slug}`,
        en: `${BASE_URL}/en/product/${p.slug}`,
      },
    },
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/kategori/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
    alternates: {
      languages: {
        tr: `${BASE_URL}/kategori/${c.slug}`,
        en: `${BASE_URL}/en/category/${c.slug}`,
      },
    },
  }));

  const brandRoutes: MetadataRoute.Sitemap = brands.map((b) => ({
    url: `${BASE_URL}/marka/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
    alternates: {
      languages: {
        tr: `${BASE_URL}/marka/${b.slug}`,
        en: `${BASE_URL}/en/brand/${b.slug}`,
      },
    },
  }));

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((bp) => ({
    url: `${BASE_URL}/blog/${bp.slug}`,
    lastModified: bp.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
    alternates: {
      languages: {
        tr: `${BASE_URL}/blog/${bp.slug}`,
        en: `${BASE_URL}/en/blog/${bp.slug}`,
      },
    },
  }));

  const pageRoutes: MetadataRoute.Sitemap = pages.map((pg) => ({
    url: `${BASE_URL}/sayfa/${pg.slug}`,
    lastModified: pg.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
    alternates: {
      languages: {
        tr: `${BASE_URL}/sayfa/${pg.slug}`,
        en: `${BASE_URL}/en/page/${pg.slug}`,
      },
    },
  }));

  return [
    ...staticRoutes,
    ...productRoutes,
    ...categoryRoutes,
    ...brandRoutes,
    ...blogRoutes,
    ...pageRoutes,
  ];
}
