import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendEmail, paymentConfirmationEmail } from "@/lib/email";

// POST - Havale/EFT onaylama (admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Siparis ID gerekli" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, payments: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Siparis bulunamadi" }, { status: 404 });
    }

    if (order.paymentMethod !== "BANK_TRANSFER") {
      return NextResponse.json({ error: "Bu siparis havale/EFT ile odenmiyor" }, { status: 400 });
    }

    // Payment kaydı yoksa olustur, varsa guncelle
    const existingPayment = order.payments.find((p) => p.method === "BANK_TRANSFER");
    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: { status: "PAID" },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          method: "BANK_TRANSFER",
          status: "PAID",
          amount: order.total,
          provider: "manual",
        },
      });
    }

    // Siparis durumu guncelle
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
      },
    });

    // Musteri'ye mail gonder
    const email = order.user?.email || order.guestEmail;
    if (email) {
      const emailData = paymentConfirmationEmail({
        orderNumber: order.orderNumber,
        total: order.total,
      });
      sendEmail({ to: email, ...emailData }).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bank transfer confirm error:", error);
    return NextResponse.json({ error: "Onay islemi hatasi" }, { status: 500 });
  }
}
