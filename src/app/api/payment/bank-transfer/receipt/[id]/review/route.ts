import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendEmail, paymentConfirmationEmail, bankTransferRejectedEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

// POST - Dekont incele (onayla / reddet)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, adminNote } = body as { action: "approve" | "reject"; adminNote?: string };

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Gecerli bir islem belirtiniz (approve/reject)" }, { status: 400 });
    }

    const receipt = await prisma.bankTransferReceipt.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: { select: { id: true, email: true } },
            payments: true,
          },
        },
      },
    });

    if (!receipt) {
      return NextResponse.json({ error: "Dekont bulunamadi" }, { status: 404 });
    }

    if (receipt.status !== "PENDING") {
      return NextResponse.json({ error: "Bu dekont zaten incelenmis" }, { status: 400 });
    }

    const order = receipt.order;

    if (action === "approve") {
      // Dekont onayla
      await prisma.bankTransferReceipt.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
          adminNote: adminNote || null,
        },
      });

      // Payment kaydi olustur/guncelle
      const existingPayment = order.payments.find((p) => p.method === "BANK_TRANSFER");
      if (existingPayment) {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: "PAID",
            provider: "dekont",
            providerData: { receiptId: id, mediaUrl: receipt.mediaUrl },
          },
        });
      } else {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            method: "BANK_TRANSFER",
            status: "PAID",
            amount: order.total,
            provider: "dekont",
            providerData: { receiptId: id, mediaUrl: receipt.mediaUrl },
          },
        });
      }

      // Siparis durumu guncelle
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
      });

      // Musteri bildirim
      const customerEmail = order.user?.email || order.guestEmail;
      if (customerEmail) {
        const emailData = paymentConfirmationEmail({
          orderNumber: order.orderNumber,
          total: order.total,
        });
        sendEmail({ to: customerEmail, ...emailData }).catch(console.error);
      }

      if (order.user?.id) {
        createNotification({
          userId: order.user.id,
          type: "order",
          title: "Odemeniz Onaylandi",
          message: `#${order.orderNumber} siparisinizin odemesi onaylandi.`,
          pushUrl: `/hesabim/siparislerim/${order.id}`,
          pushCategory: "push_orders",
        }).catch(console.error);
      }

      return NextResponse.json({ success: true, action: "approved" });
    } else {
      // Dekont reddet
      if (!adminNote) {
        return NextResponse.json({ error: "Red sebebi belirtiniz" }, { status: 400 });
      }

      await prisma.bankTransferReceipt.update({
        where: { id },
        data: {
          status: "REJECTED",
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
          adminNote,
        },
      });

      // Musteri bildirim
      const customerEmail = order.user?.email || order.guestEmail;
      if (customerEmail) {
        const emailData = bankTransferRejectedEmail({
          orderNumber: order.orderNumber,
          total: order.total,
          rejectionReason: adminNote,
        });
        sendEmail({ to: customerEmail, ...emailData }).catch(console.error);
      }

      if (order.user?.id) {
        createNotification({
          userId: order.user.id,
          type: "order",
          title: "Dekontunuz Reddedildi",
          message: `#${order.orderNumber} siparisiniz icin yuklediginiz dekont reddedildi. Lutfen tekrar yukleyiniz.`,
          pushUrl: `/hesabim/siparislerim/${order.id}`,
          pushCategory: "push_orders",
        }).catch(console.error);
      }

      return NextResponse.json({ success: true, action: "rejected" });
    }
  } catch (error) {
    console.error("Receipt review error:", error);
    return NextResponse.json({ error: "Dekont inceleme hatasi" }, { status: 500 });
  }
}
