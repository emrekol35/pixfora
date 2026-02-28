import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { createNotification } from "@/lib/notifications";
import { sendEmail, returnApprovedEmail, returnRejectedEmail, returnRefundedEmail } from "@/lib/email";
import { refundPayment } from "@/services/payment/iyzico";

// GET - Iade detayi
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Giris yapmaniz gerekiyor" }, { status: 401 });
    }

    const returnRecord = await prisma.return.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  include: { images: { take: 1, orderBy: { order: "asc" } } },
                },
              },
            },
            user: { select: { name: true, email: true, phone: true } },
            payments: true,
          },
        },
        user: { select: { name: true, email: true } },
        items: {
          include: {
            orderItem: {
              include: {
                product: {
                  include: { images: { take: 1, orderBy: { order: "asc" } } },
                },
              },
            },
          },
        },
      },
    });

    if (!returnRecord) {
      return NextResponse.json({ error: "Iade talebi bulunamadi" }, { status: 404 });
    }

    // Yetki — admin veya iade sahibi
    if (session.user.role !== "ADMIN" && returnRecord.userId !== session.user.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    return NextResponse.json(returnRecord);
  } catch (error) {
    console.error("Return get error:", error);
    return NextResponse.json({ error: "Iade detayi alinamadi" }, { status: 500 });
  }
}

// PUT - Iade durumu guncelle (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Giris yapmaniz gerekiyor" }, { status: 401 });
    }

    const body = await request.json();
    const { status, adminNote } = body;

    // Musteri iptal edebilir (PENDING → CANCELLED)
    const isAdmin = session.user.role === "ADMIN";

    const returnRecord = await prisma.return.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: { select: { name: true, email: true } },
            payments: true,
            items: true,
          },
        },
        items: {
          include: { orderItem: true },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!returnRecord) {
      return NextResponse.json({ error: "Iade talebi bulunamadi" }, { status: 404 });
    }

    // Musteri sadece PENDING iade'yi iptal edebilir
    if (!isAdmin) {
      if (returnRecord.userId !== session.user.id) {
        return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
      }
      if (status !== "CANCELLED" || returnRecord.status !== "PENDING") {
        return NextResponse.json({ error: "Bu islemi yapamazsiniz" }, { status: 400 });
      }
    }

    // Durum gecis kontrolu
    const validTransitions: Record<string, string[]> = {
      PENDING: ["APPROVED", "REJECTED", "CANCELLED"],
      APPROVED: ["RECEIVED", "CANCELLED"],
      RECEIVED: ["REFUNDED"],
    };

    const allowed = validTransitions[returnRecord.status];
    if (!allowed || !allowed.includes(status)) {
      return NextResponse.json(
        { error: `${returnRecord.status} durumundan ${status} durumuna gecis yapilamaz` },
        { status: 400 }
      );
    }

    // REJECTED durumunda adminNote zorunlu
    if (status === "REJECTED" && !adminNote) {
      return NextResponse.json(
        { error: "Red nedeni belirtilmelidir" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { status };
    if (adminNote !== undefined) updateData.adminNote = adminNote;

    // REFUNDED — Iyzico iade + stok geri yukleme
    if (status === "REFUNDED") {
      // Kredi karti ile odenmis mi kontrol et
      const ccPayment = returnRecord.order.payments.find(
        (p) => p.method === "CREDIT_CARD" && p.status === "PAID" && p.transactionId
      );

      if (ccPayment) {
        // Iyzico uzerinden iade
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
        const result = await refundPayment({
          paymentTransactionId: ccPayment.transactionId!,
          amount: returnRecord.refundAmount,
          conversationId: returnRecord.orderId,
          ip,
        });

        if (!result.success) {
          return NextResponse.json(
            { error: result.errorMessage || "Iyzico iade islemi basarisiz" },
            { status: 400 }
          );
        }

        // Payment durumunu guncelle
        await prisma.payment.update({
          where: { id: ccPayment.id },
          data: { status: "REFUNDED" },
        });
      }

      // Stok geri yukle
      for (const ri of returnRecord.items) {
        const oi = ri.orderItem;
        if (oi.variantId) {
          await prisma.productVariant.update({
            where: { id: oi.variantId },
            data: { stock: { increment: ri.quantity } },
          });
        }
        await prisma.product.update({
          where: { id: oi.productId },
          data: { stock: { increment: ri.quantity } },
        });
      }

      // Siparis durumunu guncelle
      await prisma.order.update({
        where: { id: returnRecord.orderId },
        data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
      });

      updateData.refundMethod = "original";
    }

    // Return guncelle
    const updated = await prisma.return.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { orderItem: true } },
        order: { select: { orderNumber: true } },
      },
    });

    // Bildirim gonder
    const customerEmail = returnRecord.user.email;
    const customerId = returnRecord.user.id;

    const STATUS_MESSAGES: Record<string, { title: string; message: string }> = {
      APPROVED: {
        title: "Iade Talebi Onaylandi",
        message: `#${returnRecord.returnNumber} numarali iade talebiniz onaylandi. Urunu bize gonderebilirsiniz.`,
      },
      REJECTED: {
        title: "Iade Talebi Reddedildi",
        message: `#${returnRecord.returnNumber} numarali iade talebiniz reddedildi. Neden: ${adminNote || "-"}`,
      },
      RECEIVED: {
        title: "Iade Urunu Teslim Alindi",
        message: `#${returnRecord.returnNumber} numarali iade talebiniz icin urun teslim alindi. Iade islemi devam ediyor.`,
      },
      REFUNDED: {
        title: "Iade Tamamlandi",
        message: `#${returnRecord.returnNumber} numarali iade icin ${returnRecord.refundAmount.toFixed(2)} TL tutarinda iade yapildi.`,
      },
      CANCELLED: {
        title: "Iade Talebi Iptal Edildi",
        message: `#${returnRecord.returnNumber} numarali iade talebi iptal edildi.`,
      },
    };

    const msg = STATUS_MESSAGES[status];
    if (msg) {
      createNotification({
        userId: customerId,
        type: "return",
        title: msg.title,
        message: msg.message,
        pushUrl: `/hesabim/iadelerim`,
        pushCategory: "orders",
      }).catch(console.error);
    }

    // E-posta gonder
    if (customerEmail) {
      const orderNumber = returnRecord.order.orderNumber;
      const returnNumber = returnRecord.returnNumber;

      if (status === "APPROVED") {
        const emailData = returnApprovedEmail({ orderNumber, returnNumber, adminNote });
        sendEmail({ to: customerEmail, ...emailData }).catch(console.error);
      } else if (status === "REJECTED") {
        const emailData = returnRejectedEmail({ orderNumber, returnNumber, reason: adminNote || "" });
        sendEmail({ to: customerEmail, ...emailData }).catch(console.error);
      } else if (status === "REFUNDED") {
        const emailData = returnRefundedEmail({
          orderNumber,
          returnNumber,
          amount: returnRecord.refundAmount,
        });
        sendEmail({ to: customerEmail, ...emailData }).catch(console.error);
      }
    }

    // Activity log
    logActivity({
      userId: session.user.id,
      action: `return_${status.toLowerCase()}`,
      entity: "return",
      entityId: id,
      details: { returnNumber: returnRecord.returnNumber, status, adminNote },
    }).catch(console.error);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Return update error:", error);
    return NextResponse.json({ error: "Iade durumu guncellenemedi" }, { status: 500 });
  }
}
