import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    if (q.length < 2) {
      return NextResponse.json({ products: [], total: 0 });
    }

    const where = {
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
        { sku: { contains: q, mode: "insensitive" as const } },
        { tags: { some: { tag: { contains: q, mode: "insensitive" as const } } } },
        { brand: { name: { contains: q, mode: "insensitive" as const } } },
        { category: { name: { contains: q, mode: "insensitive" as const } } },
      ],
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true } },
        },
        orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
        take: limit,
        skip,
      }),
      prisma.product.count({ where }),
    ]);

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
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Arama hatasi" }, { status: 500 });
  }
}
