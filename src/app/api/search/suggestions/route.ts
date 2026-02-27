import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sanitizeSearchQuery } from "@/lib/validation";
import { cacheGet, cacheSet } from "@/lib/redis";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQ = searchParams.get("q") || "";
    const q = sanitizeSearchQuery(rawQ);

    if (q.length < 2) {
      return NextResponse.json({ products: [], categories: [], brands: [] });
    }

    // Redis cache kontrolü
    const cacheKey = `suggestions:${q.toLowerCase()}`;
    const cached = await cacheGet<{
      products: unknown[];
      categories: unknown[];
      brands: unknown[];
    }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // 3 paralel sorgu
    const [products, categories, brands] = await Promise.all([
      // Ürünler (max 5)
      prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { tags: { some: { tag: { contains: q, mode: "insensitive" } } } },
          ],
        },
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
          category: { select: { name: true } },
        },
        orderBy: [{ isFeatured: "desc" }, { salesCount: "desc" }],
        take: 5,
      }),
      // Kategoriler (max 3)
      prisma.category.findMany({
        where: {
          isActive: true,
          name: { contains: q, mode: "insensitive" },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { products: true } },
        },
        orderBy: { order: "asc" },
        take: 3,
      }),
      // Markalar (max 3)
      prisma.brand.findMany({
        where: {
          isActive: true,
          name: { contains: q, mode: "insensitive" },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
        orderBy: { name: "asc" },
        take: 3,
      }),
    ]);

    const result = {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        comparePrice: p.comparePrice,
        image: p.images[0]?.url || null,
        category: p.category?.name || null,
      })),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        productCount: c._count.products,
      })),
      brands: brands.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logo: b.logo,
      })),
    };

    // 120 saniye cache
    await cacheSet(cacheKey, result, 120);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Suggestions error:", error);
    return NextResponse.json({ products: [], categories: [], brands: [] });
  }
}
