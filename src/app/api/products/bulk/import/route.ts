import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";
import { logActivity } from "@/lib/activity-log";

// POST - Toplu urun import (batch)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { products } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "Urun listesi bos veya gecersiz" },
        { status: 400 }
      );
    }

    if (products.length > 50) {
      return NextResponse.json(
        { error: "Tek seferde en fazla 50 urun gonderilebilir" },
        { status: 400 }
      );
    }

    let created = 0;
    const errors: string[] = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      try {
        // Zorunlu alan kontrolu
        if (!product.name?.trim()) {
          errors.push(`Satir ${i + 1}: Urun adi zorunludur`);
          continue;
        }

        const price = parseFloat(product.price);
        if (isNaN(price) || price < 0) {
          errors.push(`Satir ${i + 1}: Gecersiz fiyat`);
          continue;
        }

        // Slug olustur
        let slug = generateSlug(product.name);

        // Slug benzersizlik kontrolu
        const existingSlug = await prisma.product.findFirst({
          where: { slug },
          select: { id: true },
        });

        if (existingSlug) {
          slug = `${slug}-${Date.now()}-${i}`;
        }

        // SKU benzersizlik kontrolu
        if (product.sku) {
          const existingSku = await prisma.product.findFirst({
            where: { sku: product.sku },
            select: { id: true },
          });

          if (existingSku) {
            errors.push(
              `Satir ${i + 1}: SKU "${product.sku}" zaten mevcut, atlanıyor`
            );
            continue;
          }
        }

        // Urun olustur
        await prisma.product.create({
          data: {
            name: product.name.trim(),
            slug,
            sku: product.sku || null,
            barcode: product.barcode || null,
            price,
            comparePrice: product.compareAtPrice
              ? parseFloat(product.compareAtPrice)
              : null,
            costPrice: product.costPrice
              ? parseFloat(product.costPrice)
              : null,
            stock: product.stock ? parseInt(product.stock, 10) : 0,
            categoryId: product.categoryId || null,
            brandId: product.brandId || null,
            description: product.description || null,
            shortDesc: product.shortDescription || product.shortDesc || null,
            isActive:
              product.isActive !== undefined ? Boolean(product.isActive) : true,
            isFeatured:
              product.isFeatured !== undefined
                ? Boolean(product.isFeatured)
                : false,
            tags: product.tags || null,
            seoTitle: product.seoTitle || null,
            seoDescription: product.seoDescription || null,
          },
        });

        created++;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Bilinmeyen hata";
        errors.push(`Satir ${i + 1} (${product.name || "?"}): ${message}`);
      }
    }

    // Aktivite kaydi
    await logActivity({
      userId: session.user.id,
      action: "BULK_IMPORT",
      entity: "product",
      details: {
        totalSent: products.length,
        created,
        errorCount: errors.length,
      },
    });

    return NextResponse.json({ created, errors });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json(
      { error: "Toplu import sirasinda hata olustu" },
      { status: 500 }
    );
  }
}
