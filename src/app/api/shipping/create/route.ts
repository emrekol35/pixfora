import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getShippingProvider } from "@/services/shipping";
import { sendEmail, shippingNotificationEmail } from "@/lib/email";

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

    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";

    const result = await provider.createShipment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      sender: {
        name: siteName,
        phone: "05000000000",
        city: "Istanbul",
        district: "Kadikoy",
        address: "Depo Adresi",
      },
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
      // Siparisi guncelle
      await prisma.order.update({
        where: { id: orderId },
        data: {
          trackingNumber: result.trackingNumber,
          shippingCompany: providerCode,
          status: "SHIPPED",
        },
      });

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

      return NextResponse.json({
        success: true,
        trackingNumber: result.trackingNumber,
        barcode: result.barcode,
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
