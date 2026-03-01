import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  getHepsiburadaClient,
  getOrders,
  mapHepsiburadaOrderToLocal,
} from "@/services/marketplace/hepsiburada";

/** GET — HepsiburadaOrder listesi */
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
    if (status) where.orderStatus = status;
    if (search) {
      where.OR = [
        { hbOrderNumber: { contains: search, mode: "insensitive" } },
        { hbPackageNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.hepsiburadaOrder.findMany({
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
      prisma.hepsiburadaOrder.count({ where }),
    ]);

    return NextResponse.json({ orders, total, page, size });
  } catch (error) {
    console.error("Hepsiburada sipariş listesi hatası:", error);
    return NextResponse.json({ error: "Siparişler yüklenemedi" }, { status: 500 });
  }
}

/** POST — Hepsiburada'dan yeni siparişleri çek */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const client = await getHepsiburadaClient();

    // Siparişleri çek
    const hbOrders = await getOrders(client, { limit: 50 });

    let totalSynced = 0;
    let totalUpdated = 0;

    for (const hbOrder of hbOrders) {
      const mapped = mapHepsiburadaOrderToLocal(hbOrder);

      // Mevcut kayıt kontrolü
      const existing = await prisma.hepsiburadaOrder.findUnique({
        where: { hbOrderNumber: mapped.hbOrderNumber },
      });

      if (existing) {
        await prisma.hepsiburadaOrder.update({
          where: { id: existing.id },
          data: {
            orderStatus: mapped.orderStatus,
            rawData: mapped.rawData as unknown as Prisma.InputJsonValue,
          },
        });
        totalUpdated++;
        continue;
      }

      // Yerel sipariş oluştur
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
          // MerchantSku/barcode ile ürün ara
          let product = await prisma.product.findFirst({
            where: { sku: item.merchantSku },
          });

          let variantId: string | undefined;

          if (!product) {
            const variant = await prisma.productVariant.findFirst({
              where: { sku: item.merchantSku },
              include: { product: true },
            });
            if (variant) {
              product = variant.product;
              variantId = variant.id;
            }
          }

          if (!product) {
            product = await prisma.product.findFirst({
              where: { barcode: item.merchantSku },
            });
          }

          orderItems.push({
            productId: product?.id || "",
            variantId,
            name: item.productName,
            sku: item.merchantSku,
            price: item.unitPrice,
            quantity: item.quantity,
            total: item.totalPrice,
          });
        }

        const orderNumber = `HB-${mapped.hbOrderNumber}`;
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
              guestPhone: mapped.shippingAddress.phone,
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

        await prisma.hepsiburadaOrder.create({
          data: {
            orderId,
            hbOrderNumber: mapped.hbOrderNumber,
            hbPackageNumber: mapped.hbPackageNumber,
            orderStatus: mapped.orderStatus,
            rawData: mapped.rawData as unknown as Prisma.InputJsonValue,
          },
        });

        totalSynced++;
      } catch (err) {
        console.error(`Sipariş ${mapped.hbOrderNumber} kayıt hatası:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${totalSynced} yeni sipariş senkronize edildi, ${totalUpdated} güncellendi`,
      synced: totalSynced,
      updated: totalUpdated,
    });
  } catch (error) {
    console.error("Hepsiburada sipariş çekme hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sipariş çekme başarısız" },
      { status: 500 }
    );
  }
}
