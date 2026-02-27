import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/utils";
import { isValidUUID } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Gecersiz urun ID." }, { status: 400 });
    }
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        images: { orderBy: { order: "asc" } },
        variants: true,
        variantTypes: {
          orderBy: { order: "asc" },
          include: { options: { orderBy: { order: "asc" } } },
        },
        tags: true,
        _count: { select: { reviews: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Urun bulunamadi." }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch {
    return NextResponse.json(
      { error: "Urun yuklenirken hata olustu." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Urun bulunamadi." }, { status: 404 });
    }

    let slug = existing.slug;
    if (body.name && body.name !== existing.name) {
      slug = generateSlug(body.name);
      const slugExists = await prisma.product.findFirst({
        where: { slug, id: { not: id } },
      });
      if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        slug,
        description: body.description,
        shortDesc: body.shortDesc,
        sku: body.sku,
        barcode: body.barcode,
        price: body.price !== undefined ? parseFloat(body.price) : existing.price,
        comparePrice: body.comparePrice !== undefined
          ? body.comparePrice ? parseFloat(body.comparePrice) : null
          : existing.comparePrice,
        costPrice: body.costPrice !== undefined
          ? body.costPrice ? parseFloat(body.costPrice) : null
          : existing.costPrice,
        stock: body.stock !== undefined ? parseInt(body.stock) : existing.stock,
        minQty: body.minQty !== undefined ? parseInt(body.minQty) : existing.minQty,
        maxQty: body.maxQty !== undefined
          ? body.maxQty ? parseInt(body.maxQty) : null
          : existing.maxQty,
        weight: body.weight !== undefined
          ? body.weight ? parseFloat(body.weight) : null
          : existing.weight,
        isActive: body.isActive ?? existing.isActive,
        isFeatured: body.isFeatured ?? existing.isFeatured,
        membersOnly: body.membersOnly ?? existing.membersOnly,
        categoryId: body.categoryId !== undefined ? body.categoryId || null : existing.categoryId,
        brandId: body.brandId !== undefined ? body.brandId || null : existing.brandId,
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
        seoKeywords: body.seoKeywords,
      },
      include: {
        images: true,
        variants: true,
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(product);
  } catch {
    return NextResponse.json(
      { error: "Urun guncellenirken hata olustu." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: "Urun silindi." });
  } catch {
    return NextResponse.json(
      { error: "Urun silinirken hata olustu." },
      { status: 500 }
    );
  }
}
