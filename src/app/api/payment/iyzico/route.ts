import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { initiate3DPayment } from "@/services/payment/iyzico";
import type { PaymentRequest } from "@/services/payment/types";

// POST - iyzico 3D Secure odeme baslat
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();

    const { orderId, card, installment } = body;

    if (!orderId || !card) {
      return NextResponse.json({ error: "Siparis ID ve kart bilgileri gerekli" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { include: { category: true } } } },
        shippingAddress: true,
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Siparis bulunamadi" }, { status: 404 });
    }

    // Yetki kontrolu
    if (session?.user?.id && order.userId !== session.user.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const buyerName = order.user?.name || order.guestName || "Misafir";
    const buyerEmail = order.user?.email || order.guestEmail || "guest@pixfora.com";
    const buyerPhone = order.user?.phone || order.guestPhone || order.shippingAddress?.phone || "05000000000";

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
    const [firstName, ...lastParts] = buyerName.split(" ");
    const lastName = lastParts.join(" ") || firstName;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const paymentReq: PaymentRequest = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.total,
      buyer: {
        id: order.userId || order.id,
        name: firstName,
        surname: lastName,
        email: buyerEmail,
        phone: buyerPhone,
        ip,
        city: order.shippingAddress?.city || "Istanbul",
        address: order.shippingAddress?.address || "Adres belirtilmemis",
        zipCode: order.shippingAddress?.zipCode || undefined,
      },
      shippingAddress: {
        name: order.shippingAddress
          ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`
          : buyerName,
        city: order.shippingAddress?.city || "Istanbul",
        address: order.shippingAddress?.address || "Adres belirtilmemis",
      },
      billingAddress: {
        name: order.shippingAddress
          ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`
          : buyerName,
        city: order.shippingAddress?.city || "Istanbul",
        address: order.shippingAddress?.address || "Adres belirtilmemis",
      },
      items: order.items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.product.category?.name || "Genel",
        price: item.price,
        quantity: item.quantity,
      })),
      card: {
        holderName: card.holderName,
        number: card.number.replace(/\s/g, ""),
        expireMonth: card.expireMonth,
        expireYear: card.expireYear,
        cvc: card.cvc,
      },
      installment: installment || 1,
      callbackUrl: `${siteUrl}/api/payment/iyzico/callback`,
    };

    const result = await initiate3DPayment(paymentReq);

    if (result.success && result.htmlContent) {
      // Payment kaydı olustur
      await prisma.payment.create({
        data: {
          orderId: order.id,
          method: "CREDIT_CARD",
          status: "PENDING",
          amount: order.total,
          provider: "iyzico",
          providerData: { conversationId: result.conversationId || "" } satisfies Prisma.InputJsonValue,
        },
      });

      return NextResponse.json({
        htmlContent: result.htmlContent,
      });
    }

    return NextResponse.json(
      { error: result.errorMessage || "Odeme baslatma hatasi" },
      { status: 400 }
    );
  } catch (error) {
    console.error("iyzico payment initiate error:", error);
    return NextResponse.json({ error: "Odeme islemi basarilamadi" }, { status: 500 });
  }
}
