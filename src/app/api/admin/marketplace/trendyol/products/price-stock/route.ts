import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  getTrendyolClient,
  updatePriceAndInventory,
  type TrendyolPriceStockItem,
} from "@/services/marketplace/trendyol";

/** POST — Fiyat & stok güncelle */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { productIds } = body as { productIds?: string[] };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { syncStatus: "SYNCED" };
    if (productIds && productIds.length > 0) {
      where.productId = { in: productIds };
    }

    const tps = await prisma.trendyolProduct.findMany({
      where,
      include: {
        product: {
          select: { barcode: true, sku: true, price: true, comparePrice: true, stock: true },
          include: { variants: { select: { barcode: true, sku: true, price: true, stock: true } } },
        },
      },
    });

    if (tps.length === 0) {
      return NextResponse.json({ error: "Güncellenecek senkronize ürün bulunamadı" }, { status: 400 });
    }

    const items: TrendyolPriceStockItem[] = [];

    for (const tp of tps) {
      const p = tp.product;

      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          const barcode = v.barcode || v.sku || "";
          const variantPrice = v.price ?? p.price;
          const listPrice = p.comparePrice && p.comparePrice > variantPrice ? p.comparePrice : variantPrice;
          if (barcode) {
            items.push({ barcode, quantity: v.stock, salePrice: variantPrice, listPrice });
          }
        }
      } else {
        const barcode = p.barcode || p.sku || "";
        const listPrice = p.comparePrice && p.comparePrice > p.price ? p.comparePrice : p.price;
        if (barcode) {
          items.push({ barcode, quantity: p.stock, salePrice: p.price, listPrice });
        }
      }
    }

    if (items.length === 0) {
      return NextResponse.json({ error: "Barkod bilgisi olan ürün bulunamadı" }, { status: 400 });
    }

    // Batch'ler halinde gönder
    const client = await getTrendyolClient();
    const batchSize = 1000;
    const batchRequestIds: string[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const result = await updatePriceAndInventory(client, batch);
      batchRequestIds.push(result.batchRequestId);
    }

    return NextResponse.json({
      success: true,
      batchRequestIds,
      count: items.length,
    });
  } catch (error) {
    console.error("Fiyat/stok güncelleme hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fiyat/stok güncellemesi başarısız" },
      { status: 500 }
    );
  }
}
