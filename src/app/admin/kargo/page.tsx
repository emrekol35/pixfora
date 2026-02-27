import { prisma } from "@/lib/db";
import ShipmentList from "./ShipmentList";

export const dynamic = "force-dynamic";

export default async function AdminShipmentsPage() {
  const shipments = await prisma.shipment.findMany({
    include: {
      order: {
        select: {
          orderNumber: true,
          total: true,
          userId: true,
          user: { select: { name: true, email: true } },
          guestName: true,
          guestEmail: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const stats = await prisma.shipment.groupBy({
    by: ["status"],
    _count: true,
  });

  const statsMap: Record<string, number> = {};
  stats.forEach((s) => {
    statsMap[s.status] = s._count;
  });

  const total = Object.values(statsMap).reduce((a, b) => a + b, 0);

  const statCards = [
    { label: "Toplam", value: total, color: "text-foreground" },
    { label: "Olusturuldu", value: statsMap.CREATED || 0, color: "text-primary" },
    { label: "Yolda", value: (statsMap.PICKED_UP || 0) + (statsMap.IN_TRANSIT || 0), color: "text-warning" },
    { label: "Dagitimda", value: statsMap.OUT_FOR_DELIVERY || 0, color: "text-info" },
    { label: "Teslim Edildi", value: statsMap.DELIVERED || 0, color: "text-success" },
    { label: "Sorunlu", value: (statsMap.RETURNED || 0) + (statsMap.FAILED || 0), color: "text-danger" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Kargo Yonetimi</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <ShipmentList
        shipments={shipments.map((s) => ({
          id: s.id,
          shipmentNumber: s.shipmentNumber,
          provider: s.provider,
          trackingNumber: s.trackingNumber,
          status: s.status,
          type: s.type,
          chargedCost: s.chargedCost,
          createdAt: s.createdAt.toISOString(),
          order: {
            orderNumber: s.order.orderNumber,
            total: s.order.total,
            customerName: s.order.user?.name || s.order.guestName || "-",
            customerEmail: s.order.user?.email || s.order.guestEmail || "",
          },
        }))}
      />
    </div>
  );
}
