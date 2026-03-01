import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  getTrendyolClient,
  createProducts,
  mapProductToTrendyol,
  type LocalProductForTrendyol,
  type TrendyolProductItem,
} from "@/services/marketplace/trendyol";

/** POST — Tüm uygun ürünleri toplu Trendyol'a aktar */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    // Uygun ürünleri bul: aktif + TrendyolProduct kaydı olan + kategori/marka eşleşmiş
    const trendyolProducts = await prisma.trendyolProduct.findMany({
      where: {
        trendyolCategoryId: { not: null },
        trendyolBrandId: { not: null },
        product: { isActive: true },
      },
      include: {
        product: {
          include: {
            images: { orderBy: { order: "asc" } },
            variants: true,
          },
        },
      },
    });

    if (trendyolProducts.length === 0) {
      return NextResponse.json(
        { error: "Aktarılacak uygun ürün bulunamadı. Önce kategori/marka eşleştirmesi yapın." },
        { status: 400 }
      );
    }

    // Map all to Trendyol items
    const allItems: TrendyolProductItem[] = [];
    const tpIds: string[] = [];

    for (const tp of trendyolProducts) {
      const p = tp.product;
      const localProduct: LocalProductForTrendyol = {
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice,
        stock: p.stock,
        weight: p.weight,
        desi: p.desi,
        hasVariants: p.hasVariants,
        images: p.images.map((img) => ({ url: img.url, order: img.order })),
        variants: p.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          barcode: v.barcode,
          price: v.price,
          stock: v.stock,
          options: (v.options as Record<string, string>) || {},
        })),
        trendyolCategoryId: tp.trendyolCategoryId!,
        trendyolBrandId: tp.trendyolBrandId!,
        attributes: tp.attributes as LocalProductForTrendyol["attributes"],
      };

      allItems.push(...mapProductToTrendyol(localProduct));
      tpIds.push(tp.id);
    }

    // Batch'ler halinde gönder (max 1000)
    const client = await getTrendyolClient();
    const batchSize = 1000;
    const batchRequestIds: string[] = [];

    for (let i = 0; i < allItems.length; i += batchSize) {
      const batch = allItems.slice(i, i + batchSize);
      const result = await createProducts(client, batch);
      batchRequestIds.push(result.batchRequestId);
    }

    // Tüm kayıtları PENDING olarak güncelle
    const mainBatchId = batchRequestIds[0];
    await prisma.trendyolProduct.updateMany({
      where: { id: { in: tpIds } },
      data: { syncStatus: "PENDING", batchRequestId: mainBatchId, lastError: null },
    });

    return NextResponse.json({
      success: true,
      batchRequestIds,
      totalProducts: trendyolProducts.length,
      totalItems: allItems.length,
    });
  } catch (error) {
    console.error("Toplu Trendyol aktarım hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Toplu aktarım başarısız" },
      { status: 500 }
    );
  }
}
