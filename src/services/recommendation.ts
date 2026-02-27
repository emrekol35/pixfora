import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";
import { addRatingToProducts, productListInclude } from "@/lib/product-helpers";

// Standart product tipi (ProductCard ile uyumlu)
type RecommendedProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  minQty: number;
  maxQty: number | null;
  isFeatured: boolean;
  salesCount: number;
  images: { url: string; alt: string | null }[];
  category: { name: string } | null;
  brand: { name: string } | null;
  avgRating: number;
  reviewCount: number;
};

// ============================================================
// BOUGHT TOGETHER — Birlikte Sik Alinan Urunler
// ============================================================
export async function getBoughtTogether(
  productId: string,
  limit = 4
): Promise<RecommendedProduct[]> {
  const cacheKey = `rec:bought-together:${productId}`;
  const cached = await cacheGet<RecommendedProduct[]>(cacheKey);
  if (cached) return cached;

  try {
    // 1. Admin'in elle girdigi complementary products
    const complementaryData = await prisma.complementaryProduct.findMany({
      where: { mainProductId: productId },
      select: { compProductId: true },
    });
    const adminIds = complementaryData.map((c) => c.compProductId);

    // 2. Co-purchase analizi: ayni sipariste birlikte alinan urunler
    // productId'nin bulundugu DELIVERED siparislerdeki diger urunleri say
    const coProducts = await prisma.$queryRaw<
      { productId: string; count: bigint }[]
    >`
      SELECT oi2."product_id" as "productId", COUNT(DISTINCT oi2."order_id") as count
      FROM "order_items" oi1
      JOIN "order_items" oi2 ON oi1."order_id" = oi2."order_id"
      JOIN "orders" o ON oi1."order_id" = o.id
      WHERE oi1."product_id" = ${productId}
        AND oi2."product_id" != ${productId}
        AND o.status IN ('DELIVERED', 'SHIPPED', 'PROCESSING', 'CONFIRMED')
      GROUP BY oi2."product_id"
      ORDER BY count DESC
      LIMIT ${limit * 2}
    `;

    const coIds = coProducts.map((c) => c.productId);

    // Admin ID'leri once, sonra co-purchase ID'leri
    const allIds = [...new Set([...adminIds, ...coIds])];
    if (allIds.length === 0) {
      await cacheSet(cacheKey, [], 600);
      return [];
    }

    // Urunleri getir
    const products = await prisma.product.findMany({
      where: {
        id: { in: allIds },
        isActive: true,
      },
      include: productListInclude,
      take: limit * 2,
    });

    // Admin oncelikli siralama
    const enriched = addRatingToProducts(products) as RecommendedProduct[];
    const sorted = enriched.sort((a, b) => {
      const aIsAdmin = adminIds.includes(a.id) ? 0 : 1;
      const bIsAdmin = adminIds.includes(b.id) ? 0 : 1;
      if (aIsAdmin !== bIsAdmin) return aIsAdmin - bIsAdmin;
      // Co-purchase sirasina gore
      const aIdx = coIds.indexOf(a.id);
      const bIdx = coIds.indexOf(b.id);
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });

    const result = sorted.slice(0, limit);
    await cacheSet(cacheKey, result, 600); // 10 dk
    return result;
  } catch (error) {
    console.error("getBoughtTogether error:", error);
    return [];
  }
}

// ============================================================
// SIMILAR PRODUCTS — Gelismis Benzer Urunler
// ============================================================
export async function getSimilarProducts(
  productId: string,
  categoryId: string | null,
  brandId: string | null,
  tags: { id: string; tag: string }[],
  price: number,
  limit = 8
): Promise<RecommendedProduct[]> {
  const cacheKey = `rec:similar:${productId}`;
  const cached = await cacheGet<RecommendedProduct[]>(cacheKey);
  if (cached) return cached;

  try {
    const tagValues = tags.map((t) => t.tag);
    const priceMin = price * 0.7;
    const priceMax = price * 1.3;

    // Ayni kategori VEYA ayni tag'e sahip VEYA ayni markaya sahip urunleri al
    const conditions: object[] = [];
    if (categoryId) conditions.push({ categoryId });
    if (brandId) conditions.push({ brandId });
    if (tagValues.length > 0) {
      conditions.push({ tags: { some: { tag: { in: tagValues } } } });
    }

    if (conditions.length === 0) {
      // Hicbir kriter yoksa salt kategori bazli fallback
      await cacheSet(cacheKey, [], 600);
      return [];
    }

    const candidates = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: productId },
        OR: conditions,
      },
      include: {
        ...productListInclude,
        tags: { select: { tag: true } },
      },
      take: limit * 4, // Fazla al, sonra scoring ile filtrele
    });

    // Scoring
    const scored = candidates.map((p) => {
      let score = 0;

      // Ayni kategori: +3
      if (categoryId && p.categoryId === categoryId) score += 3;

      // Ayni marka: +2
      if (brandId && p.brandId === brandId) score += 2;

      // Ortak tag basina: +1
      const pTags = p.tags.map((t) => t.tag);
      const commonTags = tagValues.filter((t) => pTags.includes(t));
      score += commonTags.length;

      // Fiyat ±%30 araliginda: +1
      if (p.price >= priceMin && p.price <= priceMax) score += 1;

      // Satis sayisi > 0: +1
      if (p.salesCount > 0) score += 1;

      return { product: p, score };
    });

    // Score'a gore sirala
    scored.sort((a, b) => b.score - a.score);

    const topProducts = scored.slice(0, limit).map((s) => s.product);
    // tags'i cikar (addRatingToProducts reviews bekler)
    const enriched = addRatingToProducts(topProducts) as RecommendedProduct[];

    await cacheSet(cacheKey, enriched, 600); // 10 dk
    return enriched;
  } catch (error) {
    console.error("getSimilarProducts error:", error);
    return [];
  }
}

// ============================================================
// PERSONALIZED — Size Ozel Oneriler
// ============================================================
export async function getPersonalized(
  userId: string,
  limit = 8
): Promise<RecommendedProduct[]> {
  const cacheKey = `rec:personalized:${userId}`;
  const cached = await cacheGet<RecommendedProduct[]>(cacheKey);
  if (cached) return cached;

  try {
    // 1. Kullanicinin etkilesimde bulundugu urunleri topla
    const [orderItems, wishlists, reviews] = await Promise.all([
      prisma.orderItem.findMany({
        where: { order: { userId, status: { in: ["DELIVERED", "SHIPPED", "PROCESSING", "CONFIRMED"] } } },
        select: { productId: true },
        distinct: ["productId"],
        take: 50,
      }),
      prisma.wishlist.findMany({
        where: { userId },
        select: { productId: true },
        take: 50,
      }),
      prisma.review.findMany({
        where: { userId },
        select: { productId: true },
        take: 50,
      }),
    ]);

    const interactedIds = new Set([
      ...orderItems.map((i) => i.productId),
      ...wishlists.map((w) => w.productId),
      ...reviews.map((r) => r.productId),
    ]);

    if (interactedIds.size === 0) {
      // Hicbir etkilesim yok — trending fallback
      const trending = await getTrending(limit);
      await cacheSet(cacheKey, trending, 300);
      return trending;
    }

    // 2. Bu urunlerin kategori, marka, tag bilgilerini cikar
    const interactedProducts = await prisma.product.findMany({
      where: { id: { in: Array.from(interactedIds) } },
      select: {
        categoryId: true,
        brandId: true,
        tags: { select: { tag: true } },
      },
    });

    const categoryIds = [...new Set(interactedProducts.map((p) => p.categoryId).filter(Boolean))] as string[];
    const brandIds = [...new Set(interactedProducts.map((p) => p.brandId).filter(Boolean))] as string[];
    const tagValues = [...new Set(interactedProducts.flatMap((p) => p.tags.map((t) => t.tag)))];

    // 3. Bu kategorilerdeki / markalardaki / tag'lerdeki urunleri sorgula
    const conditions: object[] = [];
    if (categoryIds.length > 0) conditions.push({ categoryId: { in: categoryIds } });
    if (brandIds.length > 0) conditions.push({ brandId: { in: brandIds } });
    if (tagValues.length > 0) {
      conditions.push({ tags: { some: { tag: { in: tagValues } } } });
    }

    if (conditions.length === 0) {
      const trending = await getTrending(limit);
      await cacheSet(cacheKey, trending, 300);
      return trending;
    }

    const candidates = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { notIn: Array.from(interactedIds) }, // Zaten etkilesimdeki urunleri cikar
        OR: conditions,
      },
      include: productListInclude,
      orderBy: [
        { salesCount: "desc" },
        { createdAt: "desc" },
      ],
      take: limit * 2,
    });

    const enriched = addRatingToProducts(candidates) as RecommendedProduct[];
    const result = enriched.slice(0, limit);

    await cacheSet(cacheKey, result, 300); // 5 dk
    return result;
  } catch (error) {
    console.error("getPersonalized error:", error);
    return [];
  }
}

// ============================================================
// TRENDING — Son 7 Gunde En Cok Siparis Edilen
// ============================================================
export async function getTrending(
  limit = 8
): Promise<RecommendedProduct[]> {
  const cacheKey = "rec:trending";
  const cached = await cacheGet<RecommendedProduct[]>(cacheKey);
  if (cached) return cached;

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Son 7 gunde en cok siparis edilen urunler
    const trendingItems = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          createdAt: { gte: sevenDaysAgo },
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
      },
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: limit * 2,
    });

    if (trendingItems.length === 0) {
      // Fallback: salesCount'a gore en populer urunler
      const popular = await prisma.product.findMany({
        where: { isActive: true, salesCount: { gt: 0 } },
        include: productListInclude,
        orderBy: { salesCount: "desc" },
        take: limit,
      });
      const enriched = addRatingToProducts(popular) as RecommendedProduct[];
      await cacheSet(cacheKey, enriched, 1800);
      return enriched;
    }

    const productIds = trendingItems.map((t) => t.productId);

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
      include: productListInclude,
    });

    // OrderItem count sirasini koru
    const enriched = addRatingToProducts(products) as RecommendedProduct[];
    const sorted = enriched.sort((a, b) => {
      return productIds.indexOf(a.id) - productIds.indexOf(b.id);
    });

    const result = sorted.slice(0, limit);
    await cacheSet(cacheKey, result, 1800); // 30 dk
    return result;
  } catch (error) {
    console.error("getTrending error:", error);
    return [];
  }
}

// ============================================================
// CART RECOMMENDATIONS — Sepet Onerileri (Cross-sell)
// ============================================================
export async function getCartRecommendations(
  productIds: string[],
  limit = 4
): Promise<RecommendedProduct[]> {
  if (productIds.length === 0) return [];

  try {
    // Her sepetteki urun icin bought-together onerilerini al
    const allRecommendations: Map<string, number> = new Map();

    for (const pid of productIds.slice(0, 5)) {
      // Max 5 urun icin sorgu
      const boughtWith = await getBoughtTogether(pid, 6);
      for (const product of boughtWith) {
        if (!productIds.includes(product.id)) {
          const current = allRecommendations.get(product.id) || 0;
          allRecommendations.set(product.id, current + 1);
        }
      }
    }

    if (allRecommendations.size === 0) {
      // Fallback: trending urunler (sepettekiler haric)
      const trending = await getTrending(limit + productIds.length);
      return trending.filter((p) => !productIds.includes(p.id)).slice(0, limit);
    }

    // Frekansa gore sirala
    const sortedIds = [...allRecommendations.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
      .slice(0, limit);

    const products = await prisma.product.findMany({
      where: {
        id: { in: sortedIds },
        isActive: true,
      },
      include: productListInclude,
    });

    const enriched = addRatingToProducts(products) as RecommendedProduct[];

    // Frekans sirasini koru
    const result = enriched.sort((a, b) => {
      return sortedIds.indexOf(a.id) - sortedIds.indexOf(b.id);
    });

    return result.slice(0, limit);
  } catch (error) {
    console.error("getCartRecommendations error:", error);
    return [];
  }
}
