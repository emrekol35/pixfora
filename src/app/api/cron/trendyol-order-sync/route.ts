import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  getTrendyolClient,
  isTrendyolConfigured,
  getShipmentPackages,
  mapTrendyolOrderToLocal,
} from "@/services/marketplace/trendyol";

/** GET — Otomatik sipariş çekme (Her 5 dk) */
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

    const client = await getTrendyolClient();
    const now = Date.now();
    // Son 1 saatin siparişlerini çek
    const startDate = now - 60 * 60 * 1000;

    let totalSynced = 0;
    let totalUpdated = 0;
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await getShipmentPackages(client, {
        startDate,
        endDate: now,
        page,
        size: 50,
      });

      if (!response.content || response.content.length === 0) {
        hasMore = false;
        break;
      }

      for (const pkg of response.content) {
        const mapped = mapTrendyolOrderToLocal(pkg);

        const existing = await prisma.trendyolOrder.findUnique({
          where: { trendyolOrderNumber: mapped.trendyolOrderNumber },
        });

        if (existing) {
          // Durum değiştiyse güncelle
          if (existing.shipmentPackageStatus !== mapped.shipmentPackageStatus) {
            await prisma.trendyolOrder.update({
              where: { id: existing.id },
              data: {
                shipmentPackageStatus: mapped.shipmentPackageStatus,
                rawData: mapped.rawData as unknown as Prisma.InputJsonValue,
              },
            });
            totalUpdated++;
          }
          continue;
        }

        // Yeni sipariş
        try {
          const orderItems: {
            productId: string;
            variantId?: string;
            name: string;
            sku: string;
            price: number;
            quantity: number;
            total: number;
          }[] = [];

          for (const item of mapped.items) {
            let product = await prisma.product.findFirst({ where: { barcode: item.barcode } });
            let variantId: string | undefined;

            if (!product) {
              const variant = await prisma.productVariant.findFirst({
                where: { barcode: item.barcode },
                include: { product: true },
              });
              if (variant) {
                product = variant.product;
                variantId = variant.id;
              }
            }

            if (!product) {
              product = await prisma.product.findFirst({ where: { sku: item.merchantSku } });
            }

            orderItems.push({
              productId: product?.id || "",
              variantId,
              name: item.productName,
              sku: item.merchantSku,
              price: item.price,
              quantity: item.quantity,
              total: item.amount,
            });
          }

          const orderNumber = `TY-${mapped.trendyolOrderNumber}`;
          const validItems = orderItems.filter((i) => i.productId);
          let orderId: string | null = null;

          if (validItems.length > 0) {
            const order = await prisma.order.create({
              data: {
                orderNumber,
                status: "CONFIRMED",
                paymentMethod: "CREDIT_CARD",
                paymentStatus: "PAID",
                subtotal: mapped.totalPrice,
                total: mapped.totalPrice,
                guestName: mapped.customerName,
                guestPhone: mapped.customerPhone,
                items: {
                  create: validItems.map((item) => ({
                    productId: item.productId,
                    variantId: item.variantId || null,
                    name: item.name,
                    sku: item.sku,
                    price: item.price,
                    quantity: item.quantity,
                    total: item.total,
                  })),
                },
              },
            });
            orderId = order.id;
          }

          await prisma.trendyolOrder.create({
            data: {
              orderId,
              trendyolOrderNumber: mapped.trendyolOrderNumber,
              trendyolPackageId: mapped.trendyolPackageId,
              shipmentPackageStatus: mapped.shipmentPackageStatus,
              rawData: mapped.rawData as unknown as Prisma.InputJsonValue,
            },
          });

          totalSynced++;
        } catch (err) {
          console.error(`Cron: Sipariş ${mapped.trendyolOrderNumber} hatası:`, err);
        }
      }

      if (page < response.totalPages - 1) {
        page++;
      } else {
        hasMore = false;
      }
    }

    return NextResponse.json({
      success: true,
      synced: totalSynced,
      updated: totalUpdated,
    });
  } catch (error) {
    console.error("Trendyol sipariş sync cron hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sipariş sync başarısız" },
      { status: 500 }
    );
  }
}
