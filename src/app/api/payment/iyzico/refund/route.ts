import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { refundPayment } from "@/services/payment/iyzico";

// POST - iyzico iade
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { paymentId, amount } = body;

    if (!paymentId || !amount) {
      return NextResponse.json({ error: "Payment ID ve tutar gerekli" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

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
        where: { id: paymentId },
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
