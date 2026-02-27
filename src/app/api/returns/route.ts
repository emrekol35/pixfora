import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateReturnNumber, canRequestReturn, calculateRefundAmount } from "@/lib/return-helpers";
import { createNotification } from "@/lib/notifications";
import { sendEmail, returnRequestEmail } from "@/lib/email";
import { logActivity } from "@/lib/activity-log";

// POST - Iade talebi olustur
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Giris yapmaniz gerekiyor" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, items, reason, note } = body;

    if (!orderId || !items || !Array.isArray(items) || items.length === 0 || !reason) {
      return NextResponse.json(
        { error: "Siparis, urun(ler) ve iade nedeni zorunludur" },
        { status: 400 }
      );
    }

    // Siparisi bul
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: { select: { name: true, email: true } },
        returns: { where: { status: { notIn: ["CANCELLED", "REJECTED"] } } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Siparis bulunamadi" }, { status: 404 });
    }

    // Yetki — siparis sahibi mi
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    // Iade edilebilirlik kontrolu
    const check = canRequestReturn(order);
    if (!check.allowed) {
      return NextResponse.json({ error: check.reason }, { status: 400 });
    }

    // Aktif iade talebi var mi
    if (order.returns.length > 0) {
      return NextResponse.json(
        { error: "Bu siparis icin zaten aktif bir iade talebi mevcut" },
        { status: 400 }
      );
    }

    // Kalem validasyonu
    for (const item of items) {
      const orderItem = order.items.find((oi) => oi.id === item.orderItemId);
      if (!orderItem) {
        return NextResponse.json(
          { error: `Gecersiz siparis kalemi: ${item.orderItemId}` },
          { status: 400 }
        );
      }
      if (!item.quantity || item.quantity < 1 || item.quantity > orderItem.quantity) {
        return NextResponse.json(
          { error: `${orderItem.name} icin gecersiz miktar` },
          { status: 400 }
        );
      }
    }

    // Iade tutari hesapla
    const refundItems = items.map((item: { orderItemId: string; quantity: number; reason?: string }) => {
      const orderItem = order.items.find((oi) => oi.id === item.orderItemId)!;
      return { price: orderItem.price, quantity: item.quantity };
    });
    const refundAmount = calculateRefundAmount(refundItems);

    // Iade numarasi uret
    const returnNumber = await generateReturnNumber();

    // Return + ReturnItem kayitlarini olustur
    const returnRecord = await prisma.return.create({
      data: {
        returnNumber,
        orderId,
        userId: session.user.id,
        reason,
        note: note || null,
        refundAmount,
        items: {
          create: items.map((item: { orderItemId: string; quantity: number; reason?: string }) => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
            reason: item.reason || null,
          })),
        },
      },
      include: {
        items: {
          include: { orderItem: true },
        },
      },
    });

    // Admin'e bildirim gonder
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    for (const admin of admins) {
      createNotification({
        userId: admin.id,
        type: "return",
        title: "Yeni Iade Talebi",
        message: `#${returnNumber} numarali iade talebi olusturuldu. Siparis: #${order.orderNumber}`,
      }).catch(console.error);
    }

    // Musteriye e-posta gonder
    const customerEmail = order.user?.email;
    if (customerEmail) {
      const emailData = returnRequestEmail({
        orderNumber: order.orderNumber,
        returnNumber,
        refundAmount,
        items: returnRecord.items.map((ri) => ({
          name: ri.orderItem.name,
          quantity: ri.quantity,
          price: ri.orderItem.price,
        })),
      });
      sendEmail({ to: customerEmail, ...emailData }).catch(console.error);
    }

    // Activity log
    logActivity({
      userId: session.user.id,
      action: "return_requested",
      entity: "return",
      entityId: returnRecord.id,
      details: { returnNumber, orderId, refundAmount },
    }).catch(console.error);

    return NextResponse.json(returnRecord, { status: 201 });
  } catch (error) {
    console.error("Return create error:", error);
    return NextResponse.json({ error: "Iade talebi olusturulamadi" }, { status: 500 });
  }
}

// GET - Iade listesi
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Giris yapmaniz gerekiyor" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("sayfa") || "1");
    const limit = 20;
    const skip = (page - 1) * limit;

    const isAdmin = session.user.role === "ADMIN";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (!isAdmin) {
      where.userId = session.user.id;
    }
    if (status) {
      where.status = status;
    }

    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where,
        include: {
          order: { select: { orderNumber: true, total: true } },
          user: { select: { name: true, email: true } },
          items: {
            include: { orderItem: { select: { name: true, price: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.return.count({ where }),
    ]);

    return NextResponse.json({
      returns,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Returns list error:", error);
    return NextResponse.json({ error: "Iade listesi alinamadi" }, { status: 500 });
  }
}
