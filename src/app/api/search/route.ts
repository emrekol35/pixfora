import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";
import {
  parseSearchParams,
  buildBaseSearchWhere,
  buildFilteredSearchWhere,
  buildSearchOrderBy,
  resolveCategorySlugs,
  resolveBrandSlugs,
  computeFacets,
} from "@/lib/search-helpers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sp: Record<string, string | undefined> = {};
    searchParams.forEach((value, key) => {
      sp[key] = value;
    });

    const filters = parseSearchParams(sp);

    if (filters.q.length < 2) {
      return NextResponse.json({ products: [], total: 0, page: 1, totalPages: 0, facets: null });
    }

    const skip = (filters.page - 1) * filters.limit;

    // Slug'ları ID'lere çevir
    const [categoryIds, brandIds] = await Promise.all([
      resolveCategorySlugs(filters.categories),
      resolveBrandSlugs(filters.brands),
    ]);

    // Base where (facetler için) ve Filtered where (sonuçlar için)
    const baseWhere = buildBaseSearchWhere(filters.q);
    const filteredWhere = buildFilteredSearchWhere(baseWhere, categoryIds, brandIds, filters);
    const orderBy = buildSearchOrderBy(filters.sort);

    // Facet cache kontrolü
    const facetCacheKey = `search:facets:${filters.q.toLowerCase()}`;
    let facets = await cacheGet<Awaited<ReturnType<typeof computeFacets>>>(facetCacheKey);

    // Paralel sorgular: products + total + facets (gerekirse)
    const [products, total, computedFacets] = await Promise.all([
      prisma.product.findMany({
        where: filteredWhere,
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true } },
        },
        orderBy,
        take: filters.limit,
        skip,
      }),
      prisma.product.count({ where: filteredWhere }),
      facets ? null : computeFacets(baseWhere),
    ]);

    if (!facets && computedFacets) {
      facets = computedFacets;
      await cacheSet(facetCacheKey, facets, 60);
    }

    const mapped = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      comparePrice: p.comparePrice,
      image: p.images[0]?.url || null,
      category: p.category?.name || null,
      brand: p.brand?.name || null,
      stock: p.stock,
    }));

    return NextResponse.json({
      products: mapped,
      total,
      page: filters.page,
      totalPages: Math.ceil(total / filters.limit),
      facets,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Arama hatasi" }, { status: 500 });
  }
}
