import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getTrendyolClient,
  isTrendyolConfigured,
  updatePriceAndInventory,
  type TrendyolPriceStockItem,
} from "@/services/marketplace/trendyol";

/** GET — Otomatik stok/fiyat senkronizasyonu (Her 15 dk) */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const configured = await isTrendyolConfigured();
    if (!configured) {
      return NextResponse.json({ message: "Trendyol entegrasyonu aktif değil" });
    }

    // SYNCED ürünleri al
    const tps = await prisma.trendyolProduct.findMany({
      where: { syncStatus: "SYNCED" },
      include: {
        product: {
          select: {
            barcode: true, sku: true, price: true, comparePrice: true, stock: true,
            variants: { select: { barcode: true, sku: true, price: true, stock: true } },
          },
        },
      },
    });

    if (tps.length === 0) {
      return NextResponse.json({ message: "Güncellenecek ürün yok", count: 0 });
    }

    const items: TrendyolPriceStockItem[] = [];

    for (const tp of tps) {
      const p = tp.product;
      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          const barcode = v.barcode || v.sku || "";
          const variantPrice = v.price ?? p.price;
          const listPrice = p.comparePrice && p.comparePrice > variantPrice ? p.comparePrice : variantPrice;
          if (barcode) items.push({ barcode, quantity: v.stock, salePrice: variantPrice, listPrice });
        }
      } else {
        const barcode = p.barcode || p.sku || "";
        const listPrice = p.comparePrice && p.comparePrice > p.price ? p.comparePrice : p.price;
        if (barcode) items.push({ barcode, quantity: p.stock, salePrice: p.price, listPrice });
      }
    }

    if (items.length === 0) {
      return NextResponse.json({ message: "Barkod bilgisi olan ürün yok", count: 0 });
    }

    const client = await getTrendyolClient();
    const batchSize = 1000;
    let totalSent = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await updatePriceAndInventory(client, batch);
      totalSent += batch.length;
    }

    // lastSyncedAt güncelle
    await prisma.trendyolProduct.updateMany({
      where: { syncStatus: "SYNCED" },
      data: { lastSyncedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: `${totalSent} ürün fiyat/stok güncellendi`,
      count: totalSent,
    });
  } catch (error) {
    console.error("Trendyol stok sync cron hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Stok sync başarısız" },
      { status: 500 }
    );
  }
}
