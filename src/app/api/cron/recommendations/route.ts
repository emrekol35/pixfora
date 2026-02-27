import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getTrending,
  getBoughtTogether,
  getPersonalized,
} from "@/services/recommendation";

// GET - Oneri on-hesaplama cron job'i
export async function GET(request: NextRequest) {
  try {
    // Cron secret dogrulama
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const results = {
      trending: false,
      boughtTogetherCount: 0,
      personalizedCount: 0,
      errors: [] as string[],
    };

    // 1. Trending cache'ini guncelle
    try {
      await getTrending(8);
      results.trending = true;
    } catch (err) {
      results.errors.push(`Trending: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`);
    }

    // 2. En cok satan 50 urun icin bought-together cache'ini guncelle
    try {
      const topProducts = await prisma.product.findMany({
        where: { isActive: true, salesCount: { gt: 0 } },
        select: { id: true },
        orderBy: { salesCount: "desc" },
        take: 50,
      });

      for (const product of topProducts) {
        try {
          await getBoughtTogether(product.id, 4);
          results.boughtTogetherCount++;
        } catch {
          // Tek urun hatasi tumu durdurmamali
        }
        // Rate limit: 50ms
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch (err) {
      results.errors.push(`BoughtTogether: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`);
    }

    // 3. Son 30 gunde siparis vermis aktif kullanicilar icin personalized cache
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const activeUsers = await prisma.order.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          userId: { not: null },
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
        select: { userId: true },
        distinct: ["userId"],
        take: 100,
      });

      for (const order of activeUsers) {
        if (!order.userId) continue;
        try {
          await getPersonalized(order.userId, 8);
          results.personalizedCount++;
        } catch {
          // Tek kullanici hatasi tumu durdurmamali
        }
        // Rate limit: 50ms
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch (err) {
      results.errors.push(`Personalized: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`);
    }

    return NextResponse.json({
      message: "Oneri on-hesaplama tamamlandi",
      trending: results.trending ? "guncellendi" : "basarisiz",
      boughtTogether: results.boughtTogetherCount,
      personalized: results.personalizedCount,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error("Recommendations cron error:", error);
    return NextResponse.json({ error: "Oneri on-hesaplama hatasi" }, { status: 500 });
  }
}
