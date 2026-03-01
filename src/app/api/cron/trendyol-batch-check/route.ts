import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getTrendyolClient,
  isTrendyolConfigured,
  checkBatchResult,
} from "@/services/marketplace/trendyol";

/** GET — Batch durum kontrolü (Her 10 dk) */
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

    // PENDING batch'leri bul (unique batchRequestId'ler)
    const pendingBatches = await prisma.trendyolProduct.findMany({
      where: {
        syncStatus: "PENDING",
        batchRequestId: { not: null },
      },
      select: { batchRequestId: true },
      distinct: ["batchRequestId"],
    });

    if (pendingBatches.length === 0) {
      return NextResponse.json({ message: "Bekleyen batch yok", checked: 0 });
    }

    const client = await getTrendyolClient();
    let totalChecked = 0;
    let totalSynced = 0;
    let totalFailed = 0;

    for (const { batchRequestId } of pendingBatches) {
      if (!batchRequestId) continue;

      try {
        const result = await checkBatchResult(client, batchRequestId);
        totalChecked++;

        if (result.status === "IN_PROGRESS") continue;

        // Batch tamamlandı — kayıtları güncelle
        const tps = await prisma.trendyolProduct.findMany({
          where: { batchRequestId },
          include: { product: { select: { barcode: true, sku: true } } },
        });

        if (result.failedItemCount === 0) {
          // Hepsi başarılı
          await prisma.trendyolProduct.updateMany({
            where: { batchRequestId },
            data: { syncStatus: "SYNCED", lastSyncedAt: new Date(), lastError: null },
          });
          totalSynced += tps.length;
        } else {
          // Detaylı kontrol
          for (const tp of tps) {
            const barcode = tp.trendyolBarcode || tp.product.barcode || tp.product.sku || "";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const matchingItem = result.items?.find((item: any) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const reqItem = item.requestItem as any;
              return reqItem?.barcode === barcode || reqItem?.stockCode === barcode;
            });

            if (matchingItem && (matchingItem.status === "FAILED" || matchingItem.failureReasons?.length)) {
              await prisma.trendyolProduct.update({
                where: { id: tp.id },
                data: {
                  syncStatus: "FAILED",
                  lastError: matchingItem.failureReasons?.join(", ") || "Bilinmeyen hata",
                },
              });
              totalFailed++;
            } else {
              await prisma.trendyolProduct.update({
                where: { id: tp.id },
                data: { syncStatus: "SYNCED", lastSyncedAt: new Date(), lastError: null },
              });
              totalSynced++;
            }
          }
        }
      } catch (err) {
        console.error(`Batch ${batchRequestId} kontrol hatası:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      checked: totalChecked,
      synced: totalSynced,
      failed: totalFailed,
    });
  } catch (error) {
    console.error("Trendyol batch check cron hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Batch kontrol başarısız" },
      { status: 500 }
    );
  }
}
