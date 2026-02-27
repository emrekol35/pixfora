import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getShippingProvider } from "@/services/shipping";
import { logActivity } from "@/lib/activity-log";

// Gonderici bilgilerini Settings DB'den oku (depo adresi)
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

// POST - Iade kargo etiketi olustur
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { returnId, provider: providerCode } = body;

    if (!returnId || !providerCode) {
      return NextResponse.json({ error: "Iade ID ve kargo firmasi gerekli" }, { status: 400 });
    }

    const provider = getShippingProvider(providerCode);
    if (!provider) {
      return NextResponse.json({ error: "Gecersiz kargo firmasi" }, { status: 400 });
    }

    // Iade bilgilerini getir
    const returnData = await prisma.return.findUnique({
      where: { id: returnId },
      include: {
        order: {
          include: {
            shippingAddress: true,
            user: true,
            items: { include: { product: true } },
          },
        },
        items: { include: { orderItem: true } },
      },
    });

    if (!returnData) {
      return NextResponse.json({ error: "Iade bulunamadi" }, { status: 404 });
    }

    if (returnData.status !== "APPROVED") {
      return NextResponse.json({ error: "Sadece onaylanmis iadeler icin etiket olusturulabilir" }, { status: 400 });
    }

    if (!returnData.order.shippingAddress) {
      return NextResponse.json({ error: "Siparis teslimat adresi bulunamadi" }, { status: 400 });
    }

    const storeAddress = await getSenderInfo();
    const customerAddress = returnData.order.shippingAddress;

    // Iade kargo: Musteri gonderici, depo alici (ters adres)
    // Iade edilen urunlerin agirligini hesapla
    let totalWeight = 0;
    let totalDesi = 0;
    for (const returnItem of returnData.items) {
      const orderItem = returnData.order.items.find((oi) => oi.id === returnItem.orderItemId);
      if (orderItem) {
        totalWeight += (orderItem.product.weight || 0.5) * returnItem.quantity;
        totalDesi += (orderItem.product.desi || 1) * returnItem.quantity;
      }
    }

    const result = await provider.createShipment({
      orderId: returnData.order.id,
      orderNumber: `IADE-${returnData.returnNumber}`,
      sender: {
        name: `${customerAddress.firstName} ${customerAddress.lastName}`,
        phone: customerAddress.phone,
        city: customerAddress.city,
        district: customerAddress.district,
        address: customerAddress.address,
      },
      receiver: {
        name: storeAddress.name,
        phone: storeAddress.phone,
        city: storeAddress.city,
        district: storeAddress.district,
        address: storeAddress.address,
      },
      parcels: {
        weight: Math.max(totalWeight, 0.5),
        desi: Math.max(totalDesi, 1),
        count: 1,
      },
      description: `Iade ${returnData.returnNumber}`,
    });

    if (result.success && result.trackingNumber) {
      const shipmentNumber = `SHP-RT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      await prisma.shipment.create({
        data: {
          shipmentNumber,
          orderId: returnData.order.id,
          provider: providerCode,
          trackingNumber: result.trackingNumber,
          barcode: result.barcode || null,
          status: "CREATED",
          type: "return",
          returnId: returnData.id,
          senderName: `${customerAddress.firstName} ${customerAddress.lastName}`,
          senderPhone: customerAddress.phone,
          senderCity: customerAddress.city,
          senderDistrict: customerAddress.district,
          senderAddress: customerAddress.address,
          receiverName: storeAddress.name,
          receiverPhone: storeAddress.phone,
          receiverCity: storeAddress.city,
          receiverDistrict: storeAddress.district,
          receiverAddress: storeAddress.address,
        },
      });

      // Activity log
      logActivity({
        userId: session.user.id,
        action: "create_return_label",
        entity: "shipment",
        entityId: returnData.id,
        details: {
          returnNumber: returnData.returnNumber,
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
      { error: result.errorMessage || "Iade kargo etiketi olusturulamadi" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Return label error:", error);
    return NextResponse.json({ error: "Iade kargo etiketi olusturma hatasi" }, { status: 500 });
  }
}
