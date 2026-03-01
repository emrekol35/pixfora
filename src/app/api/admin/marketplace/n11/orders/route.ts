import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import {
  getN11Client,
  getOrders,
  mapN11OrderToLocal,
} from "@/services/marketplace/n11";

/** GET — N11Order listesi */
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
        { n11OrderNumber: { contains: search, mode: "insensitive" } },
        { n11PackageId: { contains: search, mode: "insensitive" } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.n11Order.findMany({
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
      prisma.n11Order.count({ where }),
    ]);

    return NextResponse.json({ orders, total, page, size });
  } catch (error) {
    console.error("N11 sipariş listesi hatası:", error);
    return NextResponse.json({ error: "Siparişler yüklenemedi" }, { status: 500 });
  }
}

/** POST — N11'den yeni siparişleri çek */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const client = await getN11Client();

    // Son 15 günlük siparişleri çek
    const now = Date.now();
    const fifteenDaysAgo = now - 15 * 24 * 60 * 60 * 1000;

    const response = await getOrders(client, {
      startDate: fifteenDaysAgo,
      size: 100,
      orderByDirection: "DESC",
    });

    const packages = response.content || [];

    let totalSynced = 0;
    let totalUpdated = 0;

    for (const pkg of packages) {
      const mapped = mapN11OrderToLocal(pkg);

      // Mevcut kayıt kontrolü
      const existing = await prisma.n11Order.findUnique({
        where: { n11OrderNumber: mapped.n11OrderNumber },
      });

      if (existing) {
        await prisma.n11Order.update({
          where: { id: existing.id },
          data: {
            orderStatus: mapped.orderStatus,
            n11PackageId: mapped.n11PackageId,
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
          let product = await prisma.product.findFirst({
            where: { sku: item.stockCode },
          });

          let variantId: string | undefined;

          if (!product) {
            const variant = await prisma.productVariant.findFirst({
              where: { sku: item.stockCode },
              include: { product: true },
            });
            if (variant) {
              product = variant.product;
              variantId = variant.id;
            }
          }

          if (!product && item.barcode) {
            product = await prisma.product.findFirst({
              where: { barcode: item.barcode },
            });
          }

          orderItems.push({
            productId: product?.id || "",
            variantId,
            name: item.productName,
            sku: item.stockCode,
            price: item.unitPrice,
            quantity: item.quantity,
            total: item.totalPrice,
          });
        }

        const orderNumber = `N11-${mapped.n11OrderNumber}`;
        const validItems = orderItems.filter((i) => i.productId);

        let orderId: string | null = null;

        if (validItems.length > 0) {
          const order = await prisma.order.create({
            data: {
              orderNumber,
              status: "CONFIRMED",
              paymentMethod: "CREDIT_CARD",
              paymentStatus: "PAID",
              subtotal: mapped.totalAmount,
              total: mapped.totalAmount,
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

        await prisma.n11Order.create({
          data: {
            orderId,
            n11OrderNumber: mapped.n11OrderNumber,
            n11PackageId: mapped.n11PackageId,
            orderStatus: mapped.orderStatus,
            rawData: mapped.rawData as unknown as Prisma.InputJsonValue,
          },
        });

        totalSynced++;
      } catch (err) {
        console.error(`Sipariş ${mapped.n11OrderNumber} kayıt hatası:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${totalSynced} yeni sipariş senkronize edildi, ${totalUpdated} güncellendi`,
      synced: totalSynced,
      updated: totalUpdated,
    });
  } catch (error) {
    console.error("N11 sipariş çekme hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sipariş çekme başarısız" },
      { status: 500 }
    );
  }
}
