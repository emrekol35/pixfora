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

    // Bos stringleri null'a cevir (unique constraint icin)
    const cleanSku = body.sku !== undefined
      ? (typeof body.sku === "string" && body.sku.trim() ? body.sku.trim() : null)
      : existing.sku;
    const cleanBarcode = body.barcode !== undefined
      ? (typeof body.barcode === "string" && body.barcode.trim() ? body.barcode.trim() : null)
      : existing.barcode;

    const hasVariants = !!(body.variants && body.variants.length > 0);

    // Transaction ile guncelle (varyantlar dahil)
    const product = await prisma.$transaction(async (tx) => {
      // 1. Urun temel bilgilerini guncelle
      const updated = await tx.product.update({
        where: { id },
        data: {
          name: body.name ?? existing.name,
          slug,
          description: body.description,
          shortDesc: body.shortDesc,
          sku: cleanSku,
          barcode: cleanBarcode,
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
          hasVariants,
          isActive: body.isActive ?? existing.isActive,
          isFeatured: body.isFeatured ?? existing.isFeatured,
          membersOnly: body.membersOnly ?? existing.membersOnly,
          categoryId: body.categoryId !== undefined ? body.categoryId || null : existing.categoryId,
          brandId: body.brandId !== undefined ? body.brandId || null : existing.brandId,
          seoTitle: body.seoTitle,
          seoDescription: body.seoDescription,
          seoKeywords: body.seoKeywords,
        },
      });

      // 2. Resimleri guncelle (gonderilmisse)
      if (body.images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (body.images?.length) {
          await tx.productImage.createMany({
            data: body.images.map((img: { url: string; alt?: string }, index: number) => ({
              productId: id,
              url: img.url,
              alt: img.alt || "",
              order: index,
            })),
          });
        }
      }

      // 3. Varyant tiplerini guncelle (gonderilmisse)
      if (body.variantTypes !== undefined) {
        // Onceleri sil (cascade ile options da silinir)
        await tx.variantType.deleteMany({ where: { productId: id } });
        if (body.variantTypes?.length) {
          for (let i = 0; i < body.variantTypes.length; i++) {
            const vt = body.variantTypes[i];
            await tx.variantType.create({
              data: {
                productId: id,
                name: vt.name,
                order: i,
                options: {
                  create: (vt.options || []).map((opt: string, optIdx: number) => ({
                    value: opt,
                    order: optIdx,
                  })),
                },
              },
            });
          }
        }
      }

      // 4. Varyantlari guncelle (gonderilmisse)
      if (body.variants !== undefined) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        if (body.variants?.length) {
          await tx.productVariant.createMany({
            data: body.variants.map(
              (v: { sku?: string; barcode?: string; price?: number; stock?: number; options: Record<string, string> }) => ({
                productId: id,
                sku: typeof v.sku === "string" && v.sku.trim() ? v.sku.trim() : null,
                barcode: typeof v.barcode === "string" && v.barcode.trim() ? v.barcode.trim() : null,
                price: v.price ? parseFloat(String(v.price)) : null,
                stock: parseInt(String(v.stock)) || 0,
                options: v.options,
              })
            ),
          });
        }
      }

      // 5. Etiketleri guncelle (gonderilmisse)
      if (body.tags !== undefined) {
        await tx.productTag.deleteMany({ where: { productId: id } });
        const tagList = Array.isArray(body.tags)
          ? body.tags.filter((t: string) => typeof t === "string" && t.trim())
          : [];
        if (tagList.length) {
          await tx.productTag.createMany({
            data: tagList.map((tag: string) => ({ productId: id, tag })),
          });
        }
      }

      return updated;
    });

    // Guncel urunu include'larla getir
    const fullProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: "asc" } },
        variants: true,
        variantTypes: { include: { options: { orderBy: { order: "asc" } } } },
        tags: true,
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(fullProduct || product);
  } catch (error) {
    console.error("Product update error:", error);
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; meta?: { target?: string[] } };
      if (prismaError.code === "P2002") {
        const field = prismaError.meta?.target?.[0] || "alan";
        const fieldNames: Record<string, string> = {
          sku: "SKU",
          slug: "URL",
          barcode: "Barkod",
        };
        return NextResponse.json(
          { error: `${fieldNames[field] || field} degeri zaten kullanimda. Farkli bir deger girin.` },
          { status: 400 }
        );
      }
    }
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
