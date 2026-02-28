import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getShippingProvider } from "@/services/shipping";
import { sendEmail, shippingNotificationEmail } from "@/lib/email";
import { logActivity } from "@/lib/activity-log";
import { createNotification } from "@/lib/notifications";

// Gonderici bilgilerini Settings DB'den oku, fallback: env/hardcoded
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

// POST - Kargo gonderimi olustur (admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, provider: providerCode } = body;

    if (!orderId || !providerCode) {
      return NextResponse.json({ error: "Siparis ID ve kargo firmasi gerekli" }, { status: 400 });
    }

    const provider = getShippingProvider(providerCode);
    if (!provider) {
      return NextResponse.json({ error: "Gecersiz kargo firmasi" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        shippingAddress: true,
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Siparis bulunamadi" }, { status: 404 });
    }

    if (!order.shippingAddress) {
      return NextResponse.json({ error: "Teslimat adresi bulunamadi" }, { status: 400 });
    }

    // Toplam agirlik ve desi hesapla
    let totalWeight = 0;
    let totalDesi = 0;
    for (const item of order.items) {
      totalWeight += (item.product.weight || 0.5) * item.quantity;
      totalDesi += (item.product.desi || 1) * item.quantity;
    }

    const sender = await getSenderInfo();

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

      // Transaction: Order guncelle + Shipment olustur
      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: {
            trackingNumber: result.trackingNumber,
            shippingCompany: providerCode,
            status: "SHIPPED",
          },
        }),
        prisma.shipment.create({
          data: {
            shipmentNumber,
            orderId,
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

      // Musteri'ye mail gonder
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
          message: `${order.orderNumber} numarali siparisleriniz kargoya verildi. Takip No: ${result.trackingNumber}`,
          type: "ORDER",
          pushUrl: `/hesabim/siparislerim/${order.id}`,
          pushCategory: "orders",
        }).catch(console.error);
      }

      // Activity log
      logActivity({
        userId: session.user.id,
        action: "create",
        entity: "shipment",
        entityId: orderId,
        details: {
          orderNumber: order.orderNumber,
          provider: providerCode,
          trackingNumber: result.trackingNumber,
          shipmentNumber,
        },
      }).catch(console.error);

      return NextResponse.json({
        success: true,
        trackingNumber: result.trackingNumber,
        barcode: result.barcode,
        shipmentNumber,
      });
    }

    return NextResponse.json(
      { error: result.errorMessage || "Gonderim olusturulamadi" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Shipping create error:", error);
    return NextResponse.json({ error: "Kargo olusturma hatasi" }, { status: 500 });
  }
}
