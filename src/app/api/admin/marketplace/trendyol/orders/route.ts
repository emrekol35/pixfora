import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  getTrendyolClient,
  getShipmentPackages,
  mapTrendyolOrderToLocal,
} from "@/services/marketplace/trendyol";

/** GET — TrendyolOrder listesi */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0");
    const size = parseInt(searchParams.get("size") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (status) where.shipmentPackageStatus = status;
    if (search) {
      where.OR = [
        { trendyolOrderNumber: { contains: search, mode: "insensitive" } },
        { trendyolPackageId: { contains: search, mode: "insensitive" } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.trendyolOrder.findMany({
        where,
        include: {
          order: {
            select: { id: true, orderNumber: true, status: true, total: true },
          },
        },
        orderBy: { syncedAt: "desc" },
        skip: page * size,
        take: size,
      }),
      prisma.trendyolOrder.count({ where }),
    ]);

    return NextResponse.json({ orders, total, page, size });
  } catch (error) {
    console.error("Trendyol sipariş listesi hatası:", error);
    return NextResponse.json({ error: "Siparişler yüklenemedi" }, { status: 500 });
  }
}

/** POST — Trendyol'dan yeni siparişleri çek */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { startDate, endDate } = body as { startDate?: number; endDate?: number };

    const client = await getTrendyolClient();

    // Son 7 günün siparişlerini çek (varsayılan)
    const now = Date.now();
    const defaultStart = now - 7 * 24 * 60 * 60 * 1000;
    
    const params = {
      startDate: startDate || defaultStart,
      endDate: endDate || now,
      size: 50,
      page: 0,
    };

    let totalSynced = 0;
    let totalSkipped = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await getShipmentPackages(client, params);
      
      if (!response.content || response.content.length === 0) {
        hasMore = false;
        break;
      }

      for (const pkg of response.content) {
        const mapped = mapTrendyolOrderToLocal(pkg);

        // Mevcut kayıt kontrolü
        const existing = await prisma.trendyolOrder.findUnique({
          where: { trendyolOrderNumber: mapped.trendyolOrderNumber },
        });

        if (existing) {
          // Durum güncelle
          await prisma.trendyolOrder.update({
            where: { id: existing.id },
            data: {
              shipmentPackageStatus: mapped.shipmentPackageStatus,
              rawData: mapped.rawData as unknown as Prisma.InputJsonValue,
            },
          });
          totalSkipped++;
          continue;
        }

        // Yerel sipariş oluştur
        try {
          // Ürün eşleştirme (barcode/sku)
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
            // Barcode ile ürün/varyant ara
            let product = await prisma.product.findFirst({
              where: { barcode: item.barcode },
            });

            let variantId: string | undefined;

            if (!product) {
              // Varyant barcode'da ara
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
              // SKU ile ara
              product = await prisma.product.findFirst({
                where: { sku: item.merchantSku },
              });
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

          // Sipariş numarası oluştur
          const orderNumber = `TY-${mapped.trendyolOrderNumber}`;

          // Yerel sipariş oluştur
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

          // TrendyolOrder kaydı oluştur
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
          console.error(`Sipariş ${mapped.trendyolOrderNumber} kayıt hatası:`, err);
        }
      }

      // Sonraki sayfa
      if (params.page < response.totalPages - 1) {
        params.page++;
      } else {
        hasMore = false;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${totalSynced} yeni sipariş senkronize edildi, ${totalSkipped} güncellendi`,
      synced: totalSynced,
      updated: totalSkipped,
    });
  } catch (error) {
    console.error("Trendyol sipariş çekme hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sipariş çekme başarısız" },
      { status: 500 }
    );
  }
}
