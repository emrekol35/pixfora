import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret } from "@/lib/cron-auth";
import { sendEmail, stockBackInStockEmail } from "@/lib/email";

// GET - Stok geri gelen urunler icin bildirim gonder
export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  try {
    // Bildirim gonderilmemis ve stogu > 0 olan kayitlari bul
    const notifications = await prisma.stockNotification.findMany({
      where: {
        isNotified: false,
        product: {
          stock: { gt: 0 },
          isActive: true,
        },
      },
      include: {
        user: { select: { name: true } },
        product: {
          select: {
            name: true,
            slug: true,
            price: true,
            images: { take: 1, select: { url: true } },
          },
        },
      },
      take: 100, // Batch limiti
    });

    let sentCount = 0;

    for (const notif of notifications) {
      const emailData = stockBackInStockEmail({
        name: notif.user?.name || "",
        productName: notif.product.name,
        productSlug: notif.product.slug,
        productImage: notif.product.images[0]?.url || null,
        productPrice: notif.product.price,
      });

      const sent = await sendEmail({
        to: notif.email,
        ...emailData,
      });

      if (sent) {
        await prisma.stockNotification.update({
          where: { id: notif.id },
          data: {
            isNotified: true,
            notifiedAt: new Date(),
          },
        });
        sentCount++;
      }
    }

    return NextResponse.json({
      message: `${sentCount} stok bildirimi gonderildi`,
      totalPending: notifications.length,
      sentCount,
    });
  } catch (error) {
    console.error("Stock notification cron error:", error);
    return NextResponse.json(
      { error: "Stok bildirim hatasi" },
      { status: 500 }
    );
  }
}
