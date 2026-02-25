import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const brandId = searchParams.get("brandId");
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          images: { orderBy: { order: "asc" }, take: 1 },
          _count: { select: { variants: true, reviews: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Urunler yuklenirken hata olustu." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      shortDesc,
      sku,
      barcode,
      price,
      comparePrice,
      costPrice,
      stock,
      minQty,
      maxQty,
      weight,
      isActive,
      isFeatured,
      membersOnly,
      categoryId,
      brandId,
      seoTitle,
      seoDescription,
      seoKeywords,
      images,
      variants,
      variantTypes,
      tags,
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: "Urun adi ve fiyat zorunludur." },
        { status: 400 }
      );
    }

    let slug = generateSlug(name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        shortDesc,
        sku,
        barcode,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        stock: parseInt(stock) || 0,
        minQty: parseInt(minQty) || 1,
        maxQty: maxQty ? parseInt(maxQty) : null,
        weight: weight ? parseFloat(weight) : null,
        isActive: isActive ?? true,
        isFeatured: isFeatured ?? false,
        membersOnly: membersOnly ?? false,
        hasVariants: !!(variants && variants.length > 0),
        categoryId: categoryId || null,
        brandId: brandId || null,
        seoTitle,
        seoDescription,
        seoKeywords,
        images: images?.length
          ? {
              create: images.map(
                (img: { url: string; alt?: string }, index: number) => ({
                  url: img.url,
                  alt: img.alt || "",
                  order: index,
                })
              ),
            }
          : undefined,
        variantTypes: variantTypes?.length
          ? {
              create: variantTypes.map(
                (
                  vt: { name: string; options: string[] },
                  index: number
                ) => ({
                  name: vt.name,
                  order: index,
                  options: {
                    create: vt.options.map((opt: string, optIndex: number) => ({
                      value: opt,
                      order: optIndex,
                    })),
                  },
                })
              ),
            }
          : undefined,
        variants: variants?.length
          ? {
              create: variants.map(
                (v: {
                  sku?: string;
                  barcode?: string;
                  price?: number;
                  stock?: number;
                  options: Record<string, string>;
                }) => ({
                  sku: v.sku,
                  barcode: v.barcode,
                  price: v.price,
                  stock: v.stock || 0,
                  options: v.options,
                })
              ),
            }
          : undefined,
        tags: tags?.length
          ? {
              create: tags.map((tag: string) => ({ tag })),
            }
          : undefined,
      },
      include: {
        images: true,
        variants: true,
        variantTypes: { include: { options: true } },
        tags: true,
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Product create error:", error);
    return NextResponse.json(
      { error: "Urun olusturulurken hata olustu." },
      { status: 500 }
    );
  }
}
