import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { refundPayment } from "@/services/payment/iyzico";

// POST - iyzico iade
// orderId veya paymentId kabul eder (geriye uyumluluk)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, paymentId, amount } = body;

    if ((!orderId && !paymentId) || !amount) {
      return NextResponse.json({ error: "Siparis/Odeme ID ve tutar gerekli" }, { status: 400 });
    }

    // orderId veya paymentId ile odeme bul
    let payment;
    if (orderId) {
      // orderId ile — kredi karti + odenmis payment'i bul
      payment = await prisma.payment.findFirst({
        where: {
          orderId,
          method: "CREDIT_CARD",
          status: "PAID",
        },
        include: { order: true },
      });
    } else {
      payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true },
      });
    }

    if (!payment) {
      return NextResponse.json({ error: "Odeme bulunamadi" }, { status: 404 });
    }

    if (!payment.transactionId) {
      return NextResponse.json({ error: "Islem ID bulunamadi" }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    const result = await refundPayment({
      paymentTransactionId: payment.transactionId,
      amount,
      conversationId: payment.orderId,
      ip,
    });

    if (result.success) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED" },
      });
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: "REFUNDED", status: "REFUNDED" },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: result.errorMessage || "Iade islemi basarisiz" },
      { status: 400 }
    );
  } catch (error) {
    console.error("iyzico refund error:", error);
    return NextResponse.json({ error: "Iade islemi hatasi" }, { status: 500 });
  }
}
