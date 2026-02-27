import { prisma } from "@/lib/db";
import { sanitizeSearchQuery } from "@/lib/validation";

// ——— Types ———

export interface SearchFilters {
  q: string;
  categories: string[]; // slugs
  brands: string[]; // slugs
  minPrice?: number;
  maxPrice?: number;
  inStockOnly: boolean;
  sort: string;
  page: number;
  limit: number;
}

export interface FacetCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface FacetBrand {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface FacetData {
  categories: FacetCategory[];
  brands: FacetBrand[];
  priceRange: { min: number; max: number };
  inStockCount: number;
}

// ——— Parse URL Params ———

export function parseSearchParams(sp: Record<string, string | string[] | undefined>): SearchFilters {
  const q = sanitizeSearchQuery(String(sp.q || ""));
  const categories = sp.kategori
    ? String(sp.kategori).split(",").filter(Boolean)
    : [];
  const brands = sp.marka
    ? String(sp.marka).split(",").filter(Boolean)
    : [];
  const minPrice = sp.min ? parseFloat(String(sp.min)) : undefined;
  const maxPrice = sp.max ? parseFloat(String(sp.max)) : undefined;
  const inStockOnly = sp.stok === "1";
  const sort = String(sp.siralama || "ilgili");
  const page = parseInt(String(sp.sayfa || "1"));
  const limit = 20;

  return { q, categories, brands, minPrice, maxPrice, inStockOnly, sort, page, limit };
}

// ——— Build Prisma Where ———

// Base where: sadece arama sorgusu + isActive (facet hesabı için)
export function buildBaseSearchWhere(query: string) {
  if (!query || query.length < 2) {
    return { isActive: true };
  }

  return {
    isActive: true,
    OR: [
      { name: { contains: query, mode: "insensitive" as const } },
      { description: { contains: query, mode: "insensitive" as const } },
      { sku: { contains: query, mode: "insensitive" as const } },
      { tags: { some: { tag: { contains: query, mode: "insensitive" as const } } } },
      { brand: { name: { contains: query, mode: "insensitive" as const } } },
      { category: { name: { contains: query, mode: "insensitive" as const } } },
    ],
  };
}

// Filtered where: tüm filtreler dahil
export function buildFilteredSearchWhere(
  baseWhere: ReturnType<typeof buildBaseSearchWhere>,
  categoryIds: string[],
  brandIds: string[],
  filters: SearchFilters
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { ...baseWhere };

  if (categoryIds.length > 0) {
    where.categoryId = { in: categoryIds };
  }

  if (brandIds.length > 0) {
    where.brandId = { in: brandIds };
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined && !isNaN(filters.minPrice)) {
      where.price.gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined && !isNaN(filters.maxPrice)) {
      where.price.lte = filters.maxPrice;
    }
  }

  if (filters.inStockOnly) {
    where.stock = { gt: 0 };
  }

  return where;
}

// ——— Build OrderBy ———

export function buildSearchOrderBy(sort: string) {
  switch (sort) {
    case "newest":
      return { createdAt: "desc" as const };
    case "price-asc":
      return { price: "asc" as const };
    case "price-desc":
      return { price: "desc" as const };
    case "name":
      return { name: "asc" as const };
    case "popular":
      return [{ salesCount: "desc" as const }, { isFeatured: "desc" as const }];
    default: // ilgili
      return [{ isFeatured: "desc" as const }, { salesCount: "desc" as const }, { name: "asc" as const }];
  }
}

// ——— Resolve Slugs to IDs ———

export async function resolveCategorySlugs(slugs: string[]): Promise<string[]> {
  if (slugs.length === 0) return [];
  const cats = await prisma.category.findMany({
    where: { slug: { in: slugs }, isActive: true },
    select: { id: true },
  });
  return cats.map((c) => c.id);
}

export async function resolveBrandSlugs(slugs: string[]): Promise<string[]> {
  if (slugs.length === 0) return [];
  const brands = await prisma.brand.findMany({
    where: { slug: { in: slugs }, isActive: true },
    select: { id: true },
  });
  return brands.map((b) => b.id);
}

// ——— Compute Facets ———

export async function computeFacets(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baseWhere: any
): Promise<FacetData> {
  const [categoryGroups, brandGroups, priceAgg, inStockCount] = await Promise.all([
    // Kategori bazlı sayılar
    prisma.product.groupBy({
      by: ["categoryId"],
      where: { ...baseWhere, categoryId: { not: null } },
      _count: { id: true },
    }),
    // Marka bazlı sayılar
    prisma.product.groupBy({
      by: ["brandId"],
      where: { ...baseWhere, brandId: { not: null } },
      _count: { id: true },
    }),
    // Fiyat aralığı
    prisma.product.aggregate({
      where: baseWhere,
      _min: { price: true },
      _max: { price: true },
    }),
    // Stokta olan ürün sayısı
    prisma.product.count({
      where: { ...baseWhere, stock: { gt: 0 } },
    }),
  ]);

  // Kategori ID'lerini isim/slug'a çevir
  const categoryIds = categoryGroups
    .filter((g) => g.categoryId)
    .map((g) => g.categoryId as string);

  const brandIds = brandGroups
    .filter((g) => g.brandId)
    .map((g) => g.brandId as string);

  const [categoryDetails, brandDetails] = await Promise.all([
    categoryIds.length > 0
      ? prisma.category.findMany({
          where: { id: { in: categoryIds }, isActive: true },
          select: { id: true, name: true, slug: true },
          orderBy: { name: "asc" },
        })
      : [],
    brandIds.length > 0
      ? prisma.brand.findMany({
          where: { id: { in: brandIds }, isActive: true },
          select: { id: true, name: true, slug: true },
          orderBy: { name: "asc" },
        })
      : [],
  ]);

  // Count map'leri oluştur
  const catCountMap = new Map(
    categoryGroups.map((g) => [g.categoryId, g._count.id])
  );
  const brandCountMap = new Map(
    brandGroups.map((g) => [g.brandId, g._count.id])
  );

  const categories: FacetCategory[] = categoryDetails.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    count: catCountMap.get(c.id) || 0,
  })).sort((a, b) => b.count - a.count);

  const brands: FacetBrand[] = brandDetails.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    count: brandCountMap.get(b.id) || 0,
  })).sort((a, b) => b.count - a.count);

  return {
    categories,
    brands,
    priceRange: {
      min: priceAgg._min.price || 0,
      max: priceAgg._max.price || 0,
    },
    inStockCount,
  };
}
