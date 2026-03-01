import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  getTrendyolClient,
  createProducts,
  mapProductToTrendyol,
  type LocalProductForTrendyol,
} from "@/services/marketplace/trendyol";

/** GET — TrendyolProduct listesi */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0");
    const size = parseInt(searchParams.get("size") || "20");
    const syncStatus = searchParams.get("syncStatus") as string | null;
    const search = searchParams.get("search") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (syncStatus) where.syncStatus = syncStatus;
    if (search) {
      where.product = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      prisma.trendyolProduct.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              barcode: true,
              price: true,
              comparePrice: true,
              stock: true,
              isActive: true,
              images: { select: { url: true }, take: 1, orderBy: { order: "asc" } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: page * size,
        take: size,
      }),
      prisma.trendyolProduct.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, size });
  } catch (error) {
    console.error("Trendyol ürün listesi hatası:", error);
    return NextResponse.json({ error: "Ürünler yüklenemedi" }, { status: 500 });
  }
}

/** POST — Seçili ürünleri Trendyol'a aktar */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { productIds } = body as { productIds: string[] };

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "productIds dizisi gerekli" }, { status: 400 });
    }

    // Ürünleri yükle
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: {
        images: { orderBy: { order: "asc" } },
        variants: true,
        trendyolProduct: true,
      },
    });

    if (products.length === 0) {
      return NextResponse.json({ error: "Aktarılacak aktif ürün bulunamadı" }, { status: 400 });
    }

    // TrendyolProduct kaydı olmayanları kontrol et ve oluştur
    const trendyolItems: import("@/services/marketplace/trendyol").TrendyolProductItem[] = [];
    const trendyolProductIds: string[] = [];

    for (const product of products) {
      let tp = product.trendyolProduct;

      if (!tp) {
        return NextResponse.json(
          { error: `"${product.name}" ürünü için Trendyol kategori/marka eşleştirmesi yapılmamış` },
          { status: 400 }
        );
      }

      if (!tp.trendyolCategoryId || !tp.trendyolBrandId) {
        return NextResponse.json(
          { error: `"${product.name}" ürünü için Trendyol kategori veya marka seçilmemiş` },
          { status: 400 }
        );
      }

      const localProduct: LocalProductForTrendyol = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        description: product.description,
        price: product.price,
        comparePrice: product.comparePrice,
        stock: product.stock,
        weight: product.weight,
        desi: product.desi,
        hasVariants: product.hasVariants,
        images: product.images.map((img) => ({ url: img.url, order: img.order })),
        variants: product.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          barcode: v.barcode,
          price: v.price,
          stock: v.stock,
          options: (v.options as Record<string, string>) || {},
        })),
        trendyolCategoryId: tp.trendyolCategoryId,
        trendyolBrandId: tp.trendyolBrandId,
        attributes: tp.attributes as LocalProductForTrendyol["attributes"],
      };

      trendyolItems.push(...mapProductToTrendyol(localProduct));
      trendyolProductIds.push(tp.id);
    }

    // Trendyol API'ye gönder (max 1000)
    const client = await getTrendyolClient();
    const batchSize = 1000;
    const batchRequestIds: string[] = [];

    for (let i = 0; i < trendyolItems.length; i += batchSize) {
      const batch = trendyolItems.slice(i, i + batchSize);
      const result = await createProducts(client, batch);
      batchRequestIds.push(result.batchRequestId);
    }

    // TrendyolProduct kayıtlarını güncelle
    const mainBatchId = batchRequestIds[0];
    await prisma.trendyolProduct.updateMany({
      where: { id: { in: trendyolProductIds } },
      data: {
        syncStatus: "PENDING",
        batchRequestId: mainBatchId,
        lastError: null,
      },
    });

    return NextResponse.json({
      success: true,
      batchRequestIds,
      productCount: products.length,
      itemCount: trendyolItems.length,
    });
  } catch (error) {
    console.error("Trendyol ürün aktarım hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ürün aktarımı başarısız" },
      { status: 500 }
    );
  }
}
