import { prisma } from "@/lib/db";
import { cacheGet, cacheSet, cacheDeletePattern } from "@/lib/redis";

// Translation cache TTL: 5 dakika
const TRANSLATION_CACHE_TTL = 300;

// Desteklenen entity tipleri
export type TranslatableEntityType =
  | "product"
  | "category"
  | "brand"
  | "page"
  | "blogPost"
  | "slide";

// Her entity tipinin çevrilebilir alanları
export const TRANSLATABLE_FIELDS: Record<TranslatableEntityType, string[]> = {
  product: ["name", "description", "shortDesc", "seoTitle", "seoDescription", "seoKeywords"],
  category: ["name", "description", "seoTitle", "seoDescription", "seoKeywords"],
  brand: ["name", "description", "seoTitle", "seoDescription", "seoKeywords"],
  page: ["title", "content", "seoTitle", "seoDescription"],
  blogPost: ["title", "content", "excerpt", "seoTitle", "seoDescription"],
  slide: ["title", "subtitle"],
};

/**
 * Tek bir entity'nin belirtilen locale çevirilerini getirir.
 * Redis cache kullanır.
 */
export async function getEntityTranslations(
  entityType: TranslatableEntityType,
  entityId: string,
  locale: string
): Promise<Record<string, string>> {
  // Varsayılan dil (Türkçe) için çeviriye gerek yok
  if (locale === "tr") return {};

  const cacheKey = `tr:${entityType}:${entityId}:${locale}`;
  const cached = await cacheGet<Record<string, string>>(cacheKey);
  if (cached) return cached;

  const translations = await prisma.translation.findMany({
    where: { entityType, entityId, locale },
    select: { field: true, value: true },
  });

  const result: Record<string, string> = {};
  for (const t of translations) {
    result[t.field] = t.value;
  }

  await cacheSet(cacheKey, result, TRANSLATION_CACHE_TTL);
  return result;
}

/**
 * Birden fazla entity için toplu çeviri getirir.
 * Tek DB sorgusuyla tüm çevirileri alır.
 */
export async function getBulkTranslations(
  entityType: TranslatableEntityType,
  entityIds: string[],
  locale: string
): Promise<Map<string, Record<string, string>>> {
  const result = new Map<string, Record<string, string>>();
  if (locale === "tr" || entityIds.length === 0) return result;

  const cacheKey = `tr:bulk:${entityType}:${locale}:${entityIds.sort().join(",")}`;
  const cached = await cacheGet<[string, Record<string, string>][]>(cacheKey);
  if (cached) return new Map(cached);

  const translations = await prisma.translation.findMany({
    where: {
      entityType,
      entityId: { in: entityIds },
      locale,
    },
    select: { entityId: true, field: true, value: true },
  });

  for (const t of translations) {
    if (!result.has(t.entityId)) {
      result.set(t.entityId, {});
    }
    result.get(t.entityId)![t.field] = t.value;
  }

  await cacheSet(cacheKey, Array.from(result.entries()), TRANSLATION_CACHE_TTL);
  return result;
}

/**
 * Tek bir entity nesnesine çevirileri uygular.
 * Orijinal nesnenin kopyasını döndürür — mutasyona uğratmaz.
 */
export async function withTranslation<T extends Record<string, unknown>>(
  entity: T,
  entityType: TranslatableEntityType,
  entityId: string,
  locale: string,
  fields?: string[]
): Promise<T> {
  if (locale === "tr") return entity;

  const translations = await getEntityTranslations(entityType, entityId, locale);
  if (Object.keys(translations).length === 0) return entity;

  const translatedEntity = { ...entity };
  const fieldsToTranslate = fields || TRANSLATABLE_FIELDS[entityType];

  for (const field of fieldsToTranslate) {
    if (translations[field] && field in translatedEntity) {
      (translatedEntity as Record<string, unknown>)[field] = translations[field];
    }
  }

  return translatedEntity;
}

/**
 * Bir entity dizisine toplu çeviri uygular.
 * Tek DB sorgusuyla tüm çevirileri alır — N+1 problemi olmaz.
 */
export async function withTranslations<T extends Record<string, unknown> & { id: string }>(
  entities: T[],
  entityType: TranslatableEntityType,
  locale: string,
  fields?: string[]
): Promise<T[]> {
  if (locale === "tr" || entities.length === 0) return entities;

  const entityIds = entities.map((e) => e.id);
  const translationsMap = await getBulkTranslations(entityType, entityIds, locale);

  if (translationsMap.size === 0) return entities;

  const fieldsToTranslate = fields || TRANSLATABLE_FIELDS[entityType];

  return entities.map((entity) => {
    const translations = translationsMap.get(entity.id);
    if (!translations) return entity;

    const translated = { ...entity };
    for (const field of fieldsToTranslate) {
      if (translations[field] && field in translated) {
        (translated as Record<string, unknown>)[field] = translations[field];
      }
    }
    return translated;
  });
}

/**
 * İngilizce slug'dan entityId çözümler.
 * Önce translated_slugs tablosunda arar.
 * Bulamazsa orijinal slug'ı dener (Türkçe slug iki dil için de geçerli).
 */
export async function resolveSlug(
  entityType: TranslatableEntityType,
  slug: string,
  locale: string
): Promise<{ entityId: string; originalSlug: string } | null> {
  // Türkçe'de her zaman orijinal slug kullanılır
  if (locale === "tr") return null;

  const cacheKey = `slug:${entityType}:${locale}:${slug}`;
  const cached = await cacheGet<{ entityId: string; originalSlug: string }>(cacheKey);
  if (cached) return cached;

  const translatedSlug = await prisma.translatedSlug.findUnique({
    where: {
      entityType_locale_slug: { entityType, locale, slug },
    },
  });

  if (!translatedSlug) return null;

  // Orijinal slug'ı al
  let originalSlug = slug;
  const modelMap: Record<string, string> = {
    product: "product",
    category: "category",
    brand: "brand",
    page: "page",
    blogPost: "blogPost",
  };

  const model = modelMap[entityType];
  if (model) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entity = await (prisma as any)[model].findUnique({
      where: { id: translatedSlug.entityId },
      select: { slug: true },
    });
    if (entity) {
      originalSlug = entity.slug;
    }
  }

  const result = { entityId: translatedSlug.entityId, originalSlug };
  await cacheSet(cacheKey, result, TRANSLATION_CACHE_TTL);
  return result;
}

/**
 * Bir entity'nin çeviri slug'ını getirir.
 */
export async function getTranslatedSlug(
  entityType: TranslatableEntityType,
  entityId: string,
  locale: string
): Promise<string | null> {
  if (locale === "tr") return null;

  const cacheKey = `trslug:${entityType}:${entityId}:${locale}`;
  const cached = await cacheGet<string>(cacheKey);
  if (cached) return cached;

  const translatedSlug = await prisma.translatedSlug.findUnique({
    where: {
      entityType_entityId_locale: { entityType, entityId, locale },
    },
    select: { slug: true },
  });

  if (translatedSlug) {
    await cacheSet(cacheKey, translatedSlug.slug, TRANSLATION_CACHE_TTL);
    return translatedSlug.slug;
  }

  return null;
}

// ============================================================
// ADMIN: Çeviri Kaydetme Fonksiyonları
// ============================================================

/**
 * Tek bir çeviri alanını kaydet/güncelle.
 */
export async function upsertTranslation(
  entityType: TranslatableEntityType,
  entityId: string,
  locale: string,
  field: string,
  value: string
) {
  const result = await prisma.translation.upsert({
    where: {
      entityType_entityId_locale_field: { entityType, entityId, locale, field },
    },
    update: { value },
    create: { entityType, entityId, locale, field, value },
  });

  // Cache'i temizle
  await cacheDeletePattern(`tr:${entityType}:${entityId}:*`);
  await cacheDeletePattern(`tr:bulk:${entityType}:*`);

  return result;
}

/**
 * Bir entity'nin tüm çeviri alanlarını toplu kaydet.
 */
export async function upsertTranslations(
  entityType: TranslatableEntityType,
  entityId: string,
  locale: string,
  translations: Record<string, string>
) {
  const operations = Object.entries(translations)
    .filter(([, value]) => value.trim() !== "")
    .map(([field, value]) =>
      prisma.translation.upsert({
        where: {
          entityType_entityId_locale_field: { entityType, entityId, locale, field },
        },
        update: { value },
        create: { entityType, entityId, locale, field, value },
      })
    );

  // Boş değerleri sil
  const deleteFields = Object.entries(translations)
    .filter(([, value]) => value.trim() === "")
    .map(([field]) => field);

  const deleteOps = deleteFields.length > 0
    ? [
        prisma.translation.deleteMany({
          where: { entityType, entityId, locale, field: { in: deleteFields } },
        }),
      ]
    : [];

  await prisma.$transaction([...operations, ...deleteOps]);

  // Cache'i temizle
  await cacheDeletePattern(`tr:${entityType}:${entityId}:*`);
  await cacheDeletePattern(`tr:bulk:${entityType}:*`);
  // Home page cache de temizle çünkü ürün/kategori adları değişmiş olabilir
  await cacheDeletePattern("home:*");
}

/**
 * Çeviri slug'ını kaydet/güncelle.
 */
export async function upsertTranslatedSlug(
  entityType: TranslatableEntityType,
  entityId: string,
  locale: string,
  slug: string
) {
  const result = await prisma.translatedSlug.upsert({
    where: {
      entityType_entityId_locale: { entityType, entityId, locale },
    },
    update: { slug },
    create: { entityType, entityId, locale, slug },
  });

  // Cache'i temizle
  await cacheDeletePattern(`slug:${entityType}:*`);
  await cacheDeletePattern(`trslug:${entityType}:${entityId}:*`);

  return result;
}

/**
 * Bir entity'nin tüm çevirilerini sil.
 */
export async function deleteEntityTranslations(
  entityType: TranslatableEntityType,
  entityId: string
) {
  await prisma.$transaction([
    prisma.translation.deleteMany({ where: { entityType, entityId } }),
    prisma.translatedSlug.deleteMany({ where: { entityType, entityId } }),
  ]);

  // Cache'i temizle
  await cacheDeletePattern(`tr:${entityType}:${entityId}:*`);
  await cacheDeletePattern(`tr:bulk:${entityType}:*`);
  await cacheDeletePattern(`slug:${entityType}:*`);
  await cacheDeletePattern(`trslug:${entityType}:${entityId}:*`);
  await cacheDeletePattern("home:*");
}

// ============================================================
// ADMIN: Çeviri İstatistikleri
// ============================================================

/**
 * Çeviri istatistiklerini getir: Her entity tipi için toplam kayıt ve çevrilmiş kayıt sayısı.
 */
export async function getTranslationStats(locale: string = "en") {
  const [
    productCount,
    categoryCount,
    brandCount,
    pageCount,
    blogPostCount,
    slideCount,
    translatedProducts,
    translatedCategories,
    translatedBrands,
    translatedPages,
    translatedBlogPosts,
    translatedSlides,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.brand.count({ where: { isActive: true } }),
    prisma.page.count({ where: { isActive: true } }),
    prisma.blogPost.count({ where: { isActive: true } }),
    prisma.slide.count({ where: { isActive: true } }),
    // Çevirilmiş entity sayıları (en az 1 alanı çevrilmiş)
    prisma.translation.groupBy({
      by: ["entityId"],
      where: { entityType: "product", locale },
      _count: true,
    }),
    prisma.translation.groupBy({
      by: ["entityId"],
      where: { entityType: "category", locale },
      _count: true,
    }),
    prisma.translation.groupBy({
      by: ["entityId"],
      where: { entityType: "brand", locale },
      _count: true,
    }),
    prisma.translation.groupBy({
      by: ["entityId"],
      where: { entityType: "page", locale },
      _count: true,
    }),
    prisma.translation.groupBy({
      by: ["entityId"],
      where: { entityType: "blogPost", locale },
      _count: true,
    }),
    prisma.translation.groupBy({
      by: ["entityId"],
      where: { entityType: "slide", locale },
      _count: true,
    }),
  ]);

  return [
    { type: "product" as const, label: "Ürünler", total: productCount, translated: translatedProducts.length },
    { type: "category" as const, label: "Kategoriler", total: categoryCount, translated: translatedCategories.length },
    { type: "brand" as const, label: "Markalar", total: brandCount, translated: translatedBrands.length },
    { type: "page" as const, label: "Sayfalar", total: pageCount, translated: translatedPages.length },
    { type: "blogPost" as const, label: "Blog Yazıları", total: blogPostCount, translated: translatedBlogPosts.length },
    { type: "slide" as const, label: "Slider", total: slideCount, translated: translatedSlides.length },
  ];
}
