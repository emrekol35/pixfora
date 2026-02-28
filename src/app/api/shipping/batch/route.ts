import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getShippingProvider } from "@/services/shipping";
import { sendEmail, shippingNotificationEmail } from "@/lib/email";
import { logActivity } from "@/lib/activity-log";
import { createNotification } from "@/lib/notifications";

// Gonderici bilgilerini Settings DB'den oku
async function getSenderInfo() {
  const senderSettings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          "shipping_sender_name",
          "shipping_sender_phone",
          "shipping_sender_city",
          "shipping_sender_district",
          "shipping_sender_address",
        ],
      },
    },
  });
  const map: Record<string, string> = {};
  senderSettings.forEach((s) => {
    map[s.key] = s.value;
  });

  return {
    name: map.shipping_sender_name || process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora",
    phone: map.shipping_sender_phone || "05000000000",
    city: map.shipping_sender_city || "Istanbul",
    district: map.shipping_sender_district || "Kadikoy",
    address: map.shipping_sender_address || "Depo Adresi",
  };
}

// POST - Toplu kargo olusturma
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { orderIds, provider: providerCode } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: "Siparis ID listesi gerekli" }, { status: 400 });
    }

    if (!providerCode) {
      return NextResponse.json({ error: "Kargo firmasi gerekli" }, { status: 400 });
    }

    const provider = getShippingProvider(providerCode);
    if (!provider) {
      return NextResponse.json({ error: "Gecersiz kargo firmasi" }, { status: 400 });
    }

    // Siparisleri getir
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        status: { in: ["CONFIRMED", "PROCESSING"] },
      },
      include: {
        items: { include: { product: true } },
        shippingAddress: true,
        user: true,
      },
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: "Uygun siparis bulunamadi" }, { status: 400 });
    }

    const sender = await getSenderInfo();

    let successCount = 0;
    let failedCount = 0;
    const results: Array<{ orderId: string; orderNumber: string; success: boolean; trackingNumber?: string; error?: string }> = [];

    for (const order of orders) {
      try {
        if (!order.shippingAddress) {
          results.push({ orderId: order.id, orderNumber: order.orderNumber, success: false, error: "Teslimat adresi yok" });
          failedCount++;
          continue;
        }

        // Agirlik ve desi hesapla
        let totalWeight = 0;
        let totalDesi = 0;
        for (const item of order.items) {
          totalWeight += (item.product.weight || 0.5) * item.quantity;
          totalDesi += (item.product.desi || 1) * item.quantity;
        }

        const result = await provider.createShipment({
          orderId: order.id,
          orderNumber: order.orderNumber,
          sender,
          receiver: {
            name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
            phone: order.shippingAddress.phone,
            city: order.shippingAddress.city,
            district: order.shippingAddress.district,
            address: order.shippingAddress.address,
          },
          parcels: {
            weight: Math.max(totalWeight, 0.5),
            desi: Math.max(totalDesi, 1),
            count: 1,
          },
          description: `Siparis ${order.orderNumber}`,
          isCOD: order.paymentMethod === "CASH_ON_DELIVERY",
          codAmount: order.paymentMethod === "CASH_ON_DELIVERY" ? order.total : 0,
        });

        if (result.success && result.trackingNumber) {
          const shipmentNumber = `SHP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

          await prisma.$transaction([
            prisma.order.update({
              where: { id: order.id },
              data: {
                trackingNumber: result.trackingNumber,
                shippingCompany: providerCode,
                status: "SHIPPED",
              },
            }),
            prisma.shipment.create({
              data: {
                shipmentNumber,
                orderId: order.id,
                provider: providerCode,
                trackingNumber: result.trackingNumber,
                barcode: result.barcode || null,
                status: "CREATED",
                type: "forward",
                senderName: sender.name,
                senderPhone: sender.phone,
                senderCity: sender.city,
                senderDistrict: sender.district,
                senderAddress: sender.address,
                receiverName: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
                receiverPhone: order.shippingAddress.phone,
                receiverCity: order.shippingAddress.city,
                receiverDistrict: order.shippingAddress.district,
                receiverAddress: order.shippingAddress.address,
                chargedCost: order.shippingCost,
              },
            }),
          ]);

          // E-posta
          const email = order.user?.email || order.guestEmail;
          if (email) {
            const emailData = shippingNotificationEmail({
              orderNumber: order.orderNumber,
              trackingNumber: result.trackingNumber,
              shippingCompany: providerCode,
            });
            sendEmail({ to: email, ...emailData }).catch(console.error);
          }

          // Bildirim
          if (order.userId) {
            createNotification({
              userId: order.userId,
              title: "Kargonuz Yola Cikti",
              message: `${order.orderNumber} numarali siparisleriniz kargoya verildi.`,
              type: "ORDER",
              pushUrl: `/hesabim/siparislerim/${order.id}`,
              pushCategory: "orders",
            }).catch(console.error);
          }

          results.push({ orderId: order.id, orderNumber: order.orderNumber, success: true, trackingNumber: result.trackingNumber });
          successCount++;
        } else {
          results.push({ orderId: order.id, orderNumber: order.orderNumber, success: false, error: result.errorMessage });
          failedCount++;
        }

        // Rate limit: 100ms
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err) {
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: false,
          error: err instanceof Error ? err.message : "Bilinmeyen hata",
        });
        failedCount++;
      }
    }

    // Activity log
    logActivity({
      userId: session.user.id,
      action: "batch_shipping",
      entity: "shipment",
      details: {
        provider: providerCode,
        total: orders.length,
        success: successCount,
        failed: failedCount,
      },
    }).catch(console.error);

    return NextResponse.json({
      successCount,
      failedCount,
      total: orders.length,
      results,
    });
  } catch (error) {
    console.error("Batch shipping error:", error);
    return NextResponse.json({ error: "Toplu kargo olusturma hatasi" }, { status: 500 });
  }
}
