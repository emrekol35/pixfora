import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, lowStockAlertEmail } from "@/lib/email";

// GET - Dusuk stoklu urunleri kontrol et ve admin'e uyari gonder
export async function GET(request: NextRequest) {
  try {
    // Cron secret dogrulama
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    // Ayarlari oku
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "stock_alert_enabled",
            "stock_alert_threshold",
            "stock_alert_email",
            "last_stock_alert_at",
          ],
        },
      },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    // Stok uyarilari aktif mi?
    if (settingsMap.stock_alert_enabled !== "true") {
      return NextResponse.json({ message: "Stok uyarilari devre disi", skipped: true });
    }

    // Son 24 saatte uyari gonderilmis mi?
    const lastAlertAt = settingsMap.last_stock_alert_at;
    if (lastAlertAt) {
      const lastAlertDate = new Date(lastAlertAt);
      const hoursSinceLastAlert = (Date.now() - lastAlertDate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastAlert < 24) {
        return NextResponse.json({
          message: "Son 24 saatte zaten uyari gonderildi",
          skipped: true,
          lastAlertAt,
        });
      }
    }

    const threshold = parseInt(settingsMap.stock_alert_threshold || "5");
    const alertEmail = settingsMap.stock_alert_email;

    if (!alertEmail) {
      return NextResponse.json({ error: "Uyari e-posta adresi ayarlanmamis" }, { status: 400 });
    }

    // Dusuk stoklu aktif urunleri bul
    const lowStockProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { lte: threshold },
      },
      select: {
        name: true,
        sku: true,
        stock: true,
        slug: true,
      },
      orderBy: { stock: "asc" },
      take: 50,
    });

    if (lowStockProducts.length === 0) {
      return NextResponse.json({ message: "Dusuk stoklu urun yok", count: 0 });
    }

    // E-posta gonder
    const emailData = lowStockAlertEmail(lowStockProducts);
    await sendEmail({ to: alertEmail, ...emailData });

    // Son uyari zamanini guncelle
    await prisma.setting.upsert({
      where: { key: "last_stock_alert_at" },
      update: { value: new Date().toISOString() },
      create: { key: "last_stock_alert_at", value: new Date().toISOString(), group: "stock_alerts" },
    });

    return NextResponse.json({
      message: `${lowStockProducts.length} dusuk stoklu urun icin uyari gonderildi`,
      count: lowStockProducts.length,
      sentTo: alertEmail,
    });
  } catch (error) {
    console.error("Stock alert cron error:", error);
    return NextResponse.json({ error: "Stok uyari hatasi" }, { status: 500 });
  }
}
