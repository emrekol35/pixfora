import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";
import { addRatingToProducts } from "@/lib/product-helpers";
import HomeProducts from "@/components/storefront/HomeProducts";
import RecentlyViewed from "@/components/storefront/RecentlyViewed";
import PersonalizedRecommendations from "@/components/storefront/PersonalizedRecommendations";
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
  const [homeData, trendingProducts, th, tc, tp] = await Promise.all([
    getHomeData(locale),
    getTrending(8),
    getTranslations("home"),
    getTranslations("common"),
    getTranslations("product"),
  ]);
  const { featuredProducts, newProducts, categories, slides } = homeData;

  return (
    <>
      <JsonLd data={getOrganizationSchema()} />
      <JsonLd data={getWebSiteSchema()} />

      {/* Hero / Slider */}
      {slides.length > 0 ? (
        <section className="relative bg-gradient-to-r from-primary to-primary-dark text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                {slides[0].title || th("heroDefaultTitle")}
              </h1>
              {slides[0].subtitle && (
                <p className="text-lg text-white/80 mb-8">{slides[0].subtitle}</p>
              )}
              {slides[0].link && (
                <Link
                  href={slides[0].link}
                  className="inline-block px-8 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors"
                >
                  {th("heroDiscover")}
                </Link>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-gradient-to-r from-primary to-primary-dark text-white">
          <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {th("heroDefaultTitle")}
            </h1>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              {th("heroDefaultSubtitle")}
            </p>
            <Link
              href="/kategori"
              className="inline-block px-8 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors"
            >
              {th("heroStartShopping")}
            </Link>
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold">{th("categoriesTitle")}</h2>
            <Link href="/kategori" className="text-sm text-primary font-medium hover:underline">
              {tc("viewAll")} →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {categories.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/kategori/${cat.slug}`}
                className="group flex flex-col items-center p-4 rounded-xl border border-border hover:border-primary hover:shadow-md transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  {cat.image ? (
                    <Image src={cat.image} alt={cat.name} width={32} height={32} className="object-contain" />
                  ) : (
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-center group-hover:text-primary transition-colors">
                  {cat.name}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {tc("productCount", { count: cat._count.products })}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

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

      {/* Promotion Banner */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-warning/10 to-warning/5 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
              {th("freeShippingBannerTitle")}
            </h3>
            <p className="text-muted-foreground">
              {th("freeShippingBannerDesc")}
            </p>
          </div>
          <Link
            href="/kategori"
            className="px-8 py-3 bg-warning text-white font-semibold rounded-lg hover:bg-warning/90 transition-colors shrink-0"
          >
            {tp("buyNow")}
          </Link>
        </div>
      </section>

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

      {/* Kisisel Oneriler (giris yapmis kullanicilar icin) */}
      <PersonalizedRecommendations />

      {/* Recently Viewed */}
      <RecentlyViewed />

      {/* Trust Badges */}
      <section className="bg-muted py-12 mt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", title: th("trustSecureShopping"), desc: th("trustSecureShoppingDesc") },
              { icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", title: th("trustFastShipping"), desc: th("trustFastShippingDesc") },
              { icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", title: th("trustEasyReturn"), desc: th("trustEasyReturnDesc") },
              { icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z", title: th("trustSupport"), desc: th("trustSupportDesc") },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
