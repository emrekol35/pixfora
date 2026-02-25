import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { complete3DPayment } from "@/services/payment/iyzico";
import { sendEmail, orderConfirmationEmail } from "@/lib/email";

// POST - iyzico 3D Secure callback
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const status = formData.get("status") as string;
    const paymentId = formData.get("paymentId") as string;
    const conversationId = formData.get("conversationId") as string;
    const mdStatus = formData.get("mdStatus") as string;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // 3D dogrulama basarisiz
    if (status !== "success" || !["1", "2", "3", "4"].includes(mdStatus)) {
      // conversationId = orderId
      if (conversationId) {
        const payment = await prisma.payment.findFirst({
          where: { orderId: conversationId, provider: "iyzico" },
          orderBy: { createdAt: "desc" },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: "FAILED" },
          });
          await prisma.order.update({
            where: { id: conversationId },
            data: { paymentStatus: "FAILED" },
          });
        }
      }

      return NextResponse.redirect(`${siteUrl}/odeme-basarisiz?reason=3d_failed`);
    }

    // 3D dogrulama basarili, odemeyi tamamla
    const result = await complete3DPayment(paymentId);

    if (result.success) {
      // Payment guncelle
      const payment = await prisma.payment.findFirst({
        where: { orderId: conversationId, provider: "iyzico" },
        orderBy: { createdAt: "desc" },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "PAID",
            transactionId: result.paymentId,
            providerData: {
              paymentId: result.paymentId || "",
              conversationId: result.conversationId || "",
              fraudStatus: result.fraudStatus || "",
              paidPrice: result.paidPrice || "",
            } satisfies Prisma.InputJsonValue,
          },
        });
      }

      // Siparis durumunu guncelle
      const order = await prisma.order.update({
        where: { id: conversationId },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
        },
        include: {
          items: true,
          user: true,
        },
      });

      // Onay maili gonder
      const email = order.user?.email || order.guestEmail;
      if (email) {
        const emailData = orderConfirmationEmail({
          orderNumber: order.orderNumber,
          total: order.total,
          items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
          paymentMethod: order.paymentMethod,
        });
        sendEmail({ to: email, ...emailData }).catch(console.error);
      }

      return NextResponse.redirect(`${siteUrl}/siparis-basarili?no=${order.orderNumber}`);
    }

    // Odeme tamamlama hatasi
    const payment = await prisma.payment.findFirst({
      where: { orderId: conversationId, provider: "iyzico" },
      orderBy: { createdAt: "desc" },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", providerData: { error: result.errorMessage || "Unknown error" } satisfies Prisma.InputJsonValue },
      });
      await prisma.order.update({
        where: { id: conversationId },
        data: { paymentStatus: "FAILED" },
      });
    }

    return NextResponse.redirect(`${siteUrl}/odeme-basarisiz?reason=payment_failed`);
  } catch (error) {
    console.error("iyzico callback error:", error);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    return NextResponse.redirect(`${siteUrl}/odeme-basarisiz?reason=system_error`);
  }
}
