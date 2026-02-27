import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPersonalized } from "@/services/recommendation";
import { sendEmail, recommendationEmail } from "@/lib/email";

// GET - Oneri e-postasi gonderme cron job'i
export async function GET(request: NextRequest) {
  try {
    // Cron secret dogrulama
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    // Setting kontrolu: oneri e-postalari aktif mi?
    const emailSetting = await prisma.setting.findUnique({
      where: { key: "recommendation_emails_enabled" },
    });

    if (emailSetting?.value !== "true") {
      return NextResponse.json({ message: "Oneri e-postalari devre disi", skipped: true });
    }

    // Son 7 gun icinde siparis vermis ama son 30 gunde oneri e-postasi almamis kullanicilar
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Son siparis veren kullanicilar
    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        userId: { not: null },
        status: { in: ["DELIVERED", "SHIPPED"] },
      },
      select: { userId: true },
      distinct: ["userId"],
      take: 50,
    });

    const userIds = recentOrders.map((o) => o.userId).filter(Boolean) as string[];
    if (userIds.length === 0) {
      return NextResponse.json({ message: "Oneri e-postasi gonderilecek kullanici yok", sent: 0 });
    }

    // Son 30 gunde oneri e-postasi almamis olanlari filtrele
    // ActivityLog'dan kontrol: action = "recommendation_email"
    const recentEmailLogs = await prisma.activityLog.findMany({
      where: {
        action: "recommendation_email",
        userId: { in: userIds },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { userId: true },
      distinct: ["userId"],
    });

    const alreadySentIds = new Set(recentEmailLogs.map((l) => l.userId).filter(Boolean));
    const eligibleUserIds = userIds.filter((id) => !alreadySentIds.has(id));

    if (eligibleUserIds.length === 0) {
      return NextResponse.json({ message: "Tum kullanicilara zaten e-posta gonderilmis", sent: 0 });
    }

    // Max 20 kullanici (spam korumasi)
    const targetUsers = await prisma.user.findMany({
      where: { id: { in: eligibleUserIds.slice(0, 20) } },
      select: { id: true, email: true, name: true },
    });

    let sentCount = 0;
    const errors: string[] = [];

    for (const user of targetUsers) {
      try {
        // Kisisel oneriler al
        const recommendations = await getPersonalized(user.id, 6);

        if (recommendations.length < 4) continue; // Yeterli oneri yoksa gonderme

        // E-posta gonder
        const emailData = recommendationEmail({
          userName: user.name || "Degerli Musterimiz",
          products: recommendations.slice(0, 6).map((p) => ({
            name: p.name,
            price: p.price,
            image: p.images?.[0]?.url || null,
            slug: p.slug,
          })),
        });

        const sent = await sendEmail({
          to: user.email,
          ...emailData,
        });

        if (sent) {
          sentCount++;

          // Activity log: oneri e-postasi gonderildi
          await prisma.activityLog.create({
            data: {
              userId: user.id,
              action: "recommendation_email",
              entity: "user",
              entityId: user.id,
              details: {
                productsCount: recommendations.length,
                sentAt: new Date().toISOString(),
              },
            },
          });
        }

        // Rate limit: 200ms
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (err) {
        errors.push(`${user.email}: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`);
      }
    }

    return NextResponse.json({
      message: `${sentCount} oneri e-postasi gonderildi`,
      sent: sentCount,
      total: targetUsers.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Recommendation emails cron error:", error);
    return NextResponse.json({ error: "Oneri e-postasi gonderme hatasi" }, { status: 500 });
  }
}
