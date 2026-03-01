import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getTrendyolClient, checkBatchResult } from "@/services/marketplace/trendyol";

/** POST — Batch durumunu kontrol et */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { batchRequestId } = body as { batchRequestId: string };

    if (!batchRequestId) {
      return NextResponse.json({ error: "batchRequestId gerekli" }, { status: 400 });
    }

    const client = await getTrendyolClient();
    const result = await checkBatchResult(client, batchRequestId);

    // TrendyolProduct kayıtlarını güncelle
    if (result.status === "COMPLETED" || result.status === "SUCCESS") {
      const tps = await prisma.trendyolProduct.findMany({
        where: { batchRequestId },
        include: { product: { select: { barcode: true, sku: true } } },
      });

      for (const tp of tps) {
        const barcode = tp.trendyolBarcode || tp.product.barcode || tp.product.sku || "";
        const matchingItem = result.items?.find(
          (item: any) => {
            const reqItem = item.requestItem as any;
            return reqItem?.barcode === barcode || reqItem?.stockCode === barcode;
          }
        );

        if (matchingItem) {
          if (matchingItem.status === "SUCCESS" || matchingItem.status === "COMPLETED") {
            await prisma.trendyolProduct.update({
              where: { id: tp.id },
              data: { syncStatus: "SYNCED", lastSyncedAt: new Date(), lastError: null },
            });
          } else {
            await prisma.trendyolProduct.update({
              where: { id: tp.id },
              data: {
                syncStatus: "FAILED",
                lastError: matchingItem.failureReasons?.join(", ") || "Bilinmeyen hata",
              },
            });
          }
        } else {
          // Eşleşme bulunamadıysa, genel duruma göre güncelle
          if (result.failedItemCount === 0) {
            await prisma.trendyolProduct.update({
              where: { id: tp.id },
              data: { syncStatus: "SYNCED", lastSyncedAt: new Date(), lastError: null },
            });
          }
        }
      }
    }

    return NextResponse.json({
      batchRequestId,
      status: result.status,
      itemCount: result.itemCount,
      failedItemCount: result.failedItemCount,
      items: result.items?.slice(0, 50), // İlk 50 item
    });
  } catch (error) {
    console.error("Batch durum kontrol hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Batch durumu kontrol edilemedi" },
      { status: 500 }
    );
  }
}
