import Link from "next/link";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";
import { addRatingToProducts } from "@/lib/product-helpers";
import HomeProducts from "@/components/storefront/HomeProducts";
import RecentlyViewed from "@/components/storefront/RecentlyViewed";
import PersonalizedRecommendations from "@/components/storefront/PersonalizedRecommendations";
import ThemedHomePage from "@/components/storefront/ThemedHomePage";
import { getTrending } from "@/services/recommendation";
import JsonLd from "@/components/seo/JsonLd";
import { getOrganizationSchema, getWebSiteSchema } from "@/lib/structured-data";
import { getTranslations, getLocale } from "next-intl/server";
import { withTranslations } from "@/lib/translations";

export const dynamic = "force-dynamic";

const CACHE_TTL = 120;

async function getHomeData(locale: string) {
  // Redis cache kontrolü (locale bazlı)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cached = await cacheGet<any>(`home:data:${locale}`);
  if (cached) return cached;

  const [featuredProducts, newProducts, categories, slides] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        category: { select: { name: true } },
        brand: { select: { name: true } },
        reviews: { where: { isApproved: true }, select: { rating: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        category: { select: { name: true } },
        brand: { select: { name: true } },
        reviews: { where: { isApproved: true }, select: { rating: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: {
        children: { where: { isActive: true }, take: 5 },
        _count: { select: { products: true } },
      },
      orderBy: { order: "asc" },
      take: 8,
    }),
    prisma.slide.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const result = {
    featuredProducts: addRatingToProducts(featuredProducts),
    newProducts: addRatingToProducts(newProducts),
    categories,
    slides,
  };

  // Çevirileri uygula
  const [trFeatured, trNew, trCategories, trSlides] = await Promise.all([
    withTranslations(result.featuredProducts, "product", locale, ["name"]),
    withTranslations(result.newProducts, "product", locale, ["name"]),
    withTranslations(result.categories, "category", locale, ["name"]),
    withTranslations(result.slides, "slide", locale, ["title", "subtitle"]),
  ]);
  result.featuredProducts = trFeatured;
  result.newProducts = trNew;
  result.categories = trCategories;
  result.slides = trSlides;

  await cacheSet(`home:data:${locale}`, result, CACHE_TTL);

  return result;
}

export default async function HomePage() {
  const locale = await getLocale();
  const [homeData, trendingProducts, th, tc] = await Promise.all([
    getHomeData(locale),
    getTrending(8),
    getTranslations("home"),
    getTranslations("common"),
  ]);
  const { featuredProducts, newProducts, categories, slides } = homeData;

  return (
    <>
      <JsonLd data={getOrganizationSchema()} />
      <JsonLd data={getWebSiteSchema()} />

      {/* Themed Sections: Hero, Categories, Promotion, Trust Badges */}
      <ThemedHomePage slides={slides} categories={categories} />

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold">{th("featuredProducts")}</h2>
            <Link href="/cok-satanlar" className="text-sm text-primary font-medium hover:underline">
              {tc("viewAll")} →
            </Link>
          </div>
          <HomeProducts products={featuredProducts} />
        </section>
      )}

      {/* New Products */}
      {newProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold">{th("newProducts")}</h2>
            <Link href="/yeni-urunler" className="text-sm text-primary font-medium hover:underline">
              {tc("viewAll")} →
            </Link>
          </div>
          <HomeProducts products={newProducts} />
        </section>
      )}

      {/* Trend Urunler */}
      {trendingProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold">{th("trendingProducts")}</h2>
            <Link href="/cok-satanlar" className="text-sm text-primary font-medium hover:underline">
              {tc("viewAll")} →
            </Link>
          </div>
          <HomeProducts products={trendingProducts} />
        </section>
      )}

      {/* Kisisel Oneriler */}
      <PersonalizedRecommendations />

      {/* Recently Viewed */}
      <RecentlyViewed />
    </>
  );
}
