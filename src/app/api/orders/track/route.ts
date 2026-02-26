import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getShippingProvider } from "@/services/shipping";

// POST - Herkese acik siparis takip
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderNumber, email } = body;

    if (!orderNumber || !email) {
      return NextResponse.json(
        { error: "Siparis numarasi ve e-posta gereklidir" },
        { status: 400 }
      );
    }

    // Siparis bul
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderNumber.replace("#", ""),
      },
      include: {
        user: { select: { email: true } },
        items: {
          include: {
            product: {
              include: { images: { take: 1, orderBy: { order: "asc" } } },
            },
          },
        },
        shippingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Siparis bulunamadi" },
        { status: 404 }
      );
    }

    // Email dogrulama
    const orderEmail = order.user?.email || order.guestEmail;
    if (!orderEmail || orderEmail.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "E-posta adresi eslesmiyor" },
        { status: 403 }
      );
    }

    // Kargo takip bilgisi
    let trackingEvents: { date: string; status: string; location: string; description: string }[] = [];
    if (order.trackingNumber && order.shippingCompany) {
      try {
        const provider = getShippingProvider(order.shippingCompany);
        if (provider) {
          const tracking = await provider.getTracking(order.trackingNumber);
          if (tracking.success) {
            trackingEvents = tracking.events;
          }
        }
      } catch {
        // Takip bilgisi alinamazsa devam et
      }
    }

    return NextResponse.json({
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        discount: order.discount,
        total: order.total,
        trackingNumber: order.trackingNumber,
        shippingCompany: order.shippingCompany,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        items: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          image: item.product.images[0]?.url || null,
        })),
        shippingAddress: order.shippingAddress
          ? {
              firstName: order.shippingAddress.firstName,
              lastName: order.shippingAddress.lastName,
              city: order.shippingAddress.city,
              district: order.shippingAddress.district,
            }
          : null,
      },
      trackingEvents,
    });
  } catch (error) {
    console.error("Order track error:", error);
    return NextResponse.json(
      { error: "Siparis takip hatasi" },
      { status: 500 }
    );
  }
}
