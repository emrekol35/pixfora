export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import AutomationDashboard from "./AutomationDashboard";

export default async function AutomationPage() {
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

  // Dusuk stoklu urun sayisi
  const threshold = parseInt(settingsMap.stock_alert_threshold || "5");
  const lowStockCount = await prisma.product.count({
    where: { isActive: true, stock: { lte: threshold } },
  });

  // Terk edilen sepet sayisi (2+ saat once guncellenmis)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const abandonedCartUsers = await prisma.cartItem.groupBy({
    by: ["userId"],
    where: {
      userId: { not: null },
      updatedAt: { lte: twoHoursAgo },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Otomasyon</h1>
        <p className="text-muted-foreground">
          Zamanlanmis gorevleri yonetin ve manuel olarak tetikleyiniz.
        </p>
      </div>

      <AutomationDashboard
        stockAlertEnabled={settingsMap.stock_alert_enabled === "true"}
        stockAlertThreshold={threshold}
        stockAlertEmail={settingsMap.stock_alert_email || ""}
        lastStockAlertAt={settingsMap.last_stock_alert_at || null}
        lowStockCount={lowStockCount}
        abandonedCartUserCount={abandonedCartUsers.length}
      />
    </div>
  );
}
