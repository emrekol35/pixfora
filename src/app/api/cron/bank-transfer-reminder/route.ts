import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret } from "@/lib/cron-auth";
import { sendEmail, bankTransferReminderEmail } from "@/lib/email";
import { getBankAccounts } from "@/services/payment/bank-transfer";
import { createNotification } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  try {
    // Hatirlatma suresi ayarini oku (default: 24 saat)
    const reminderSetting = await prisma.setting.findUnique({
      where: { key: "bank_transfer_reminder_hours" },
    });
    const reminderHours = parseInt(reminderSetting?.value || "24", 10);
    const cutoffDate = new Date(Date.now() - reminderHours * 60 * 60 * 1000);

    // Dekont yuklenmemis, süresi gecmis, PENDING siparisleri bul
    const pendingOrders = await prisma.order.findMany({
      where: {
        paymentMethod: "BANK_TRANSFER",
        paymentStatus: "PENDING",
        status: "PENDING",
        createdAt: { lt: cutoffDate },
        // Dekont yuklenmemis olanlar
        bankTransferReceipts: { none: {} },
        // Daha once hatirlatma gonderilmemis olanlar
        payments: {
          none: { provider: "reminder" },
        },
      },
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    if (pendingOrders.length === 0) {
      return NextResponse.json({ checked: 0, sentReminders: 0 });
    }

    const bankAccounts = await getBankAccounts();
    let sentCount = 0;

    for (const order of pendingOrders) {
      const customerEmail = order.user?.email || order.guestEmail;

      if (customerEmail) {
        // Hatirlatma maili gonder
        const emailData = bankTransferReminderEmail({
          orderNumber: order.orderNumber,
          total: order.total,
          bankAccounts,
        });
        await sendEmail({ to: customerEmail, ...emailData }).catch(console.error);

        // In-app bildirim
        if (order.user?.id) {
          createNotification({
            userId: order.user.id,
            type: "order",
            title: "Odeme Hatirlatmasi",
            message: `#${order.orderNumber} siparisiniz icin odeme bekleniyor. Dekontinizi yukleyiniz.`,
            pushUrl: `/hesabim/siparislerim/${order.id}`,
            pushCategory: "push_orders",
          }).catch(console.error);
        }

        // Hatirlatma gonderildigini isaretle (cift gonderimi onle)
        await prisma.payment.create({
          data: {
            orderId: order.id,
            method: "BANK_TRANSFER",
            status: "PENDING",
            amount: 0,
            provider: "reminder",
            providerData: { reminderSentAt: new Date().toISOString() },
          },
        });

        sentCount++;
      }
    }

    return NextResponse.json({
      checked: pendingOrders.length,
      sentReminders: sentCount,
    });
  } catch (error) {
    console.error("Bank transfer reminder error:", error);
    return NextResponse.json({ error: "Hatirlatma hatasi" }, { status: 500 });
  }
}
