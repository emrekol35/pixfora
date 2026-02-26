import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, abandonedCartEmail } from "@/lib/email";

// GET - Terk edilen sepetleri kontrol et ve kurtarma e-postasi gonder
export async function GET(request: NextRequest) {
  try {
    // Cron secret dogrulama
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    // 2+ saat once guncellenen, sahipli ve bildirim gonderilmemis sepetleri bul
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    // Sepetinde urun olan kullanicilari bul (2+ saat once guncellenmis, son 3 gunde bildirim gonderilmemis)
    const abandonedCarts = await prisma.cartItem.findMany({
      where: {
        userId: { not: null },
        updatedAt: { lte: twoHoursAgo },
        OR: [
          { lastNotifiedAt: null },
          { lastNotifiedAt: { lte: threeDaysAgo } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: {
          select: {
            name: true,
            price: true,
            isActive: true,
            images: { take: 1, select: { url: true } },
          },
        },
      },
    });

    // Kullaniciya gore grupla
    const userCarts = new Map<string, {
      userId: string;
      name: string;
      email: string;
      cartItemIds: string[];
      items: { name: string; price: number; image: string | null }[];
    }>();

    for (const item of abandonedCarts) {
      if (!item.user?.email || !item.product.isActive) continue;

      const userId = item.userId!;
      if (!userCarts.has(userId)) {
        userCarts.set(userId, {
          userId,
          name: item.user.name || "",
          email: item.user.email,
          cartItemIds: [],
          items: [],
        });
      }

      const cart = userCarts.get(userId)!;
      cart.cartItemIds.push(item.id);
      cart.items.push({
        name: item.product.name,
        price: Number(item.product.price),
        image: item.product.images[0]?.url || null,
      });
    }

    let sentCount = 0;

    for (const cart of userCarts.values()) {
      // Kullanicinin arada siparis verip vermedigini kontrol et
      const recentOrder = await prisma.order.findFirst({
        where: {
          userId: cart.userId,
          createdAt: { gte: twoHoursAgo },
        },
      });

      // Siparis verdiyse atla
      if (recentOrder) continue;

      // Kurtarma e-postasi gonder
      const emailData = abandonedCartEmail({
        name: cart.name,
        items: cart.items,
      });

      const sent = await sendEmail({ to: cart.email, ...emailData });

      if (sent) {
        // Son bildirim zamanini guncelle
        await prisma.cartItem.updateMany({
          where: { id: { in: cart.cartItemIds } },
          data: { lastNotifiedAt: new Date() },
        });
        sentCount++;
      }
    }

    return NextResponse.json({
      message: `${sentCount} kullaniciya sepet kurtarma e-postasi gonderildi`,
      totalUsers: userCarts.size,
      sentCount,
    });
  } catch (error) {
    console.error("Abandoned cart cron error:", error);
    return NextResponse.json({ error: "Sepet kurtarma hatasi" }, { status: 500 });
  }
}
