import { prisma } from "@/lib/db";
import ReturnList from "./ReturnList";

export const dynamic = "force-dynamic";

export default async function AdminReturnsPage() {
  const returns = await prisma.return.findMany({
    include: {
      order: { select: { orderNumber: true, total: true } },
      user: { select: { name: true, email: true } },
      items: {
        include: { orderItem: { select: { name: true, price: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const stats = await prisma.return.groupBy({
    by: ["status"],
    _count: true,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Iade Yonetimi</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { key: "PENDING", label: "Beklemede", color: "bg-warning/10 text-warning" },
          { key: "APPROVED", label: "Onaylandi", color: "bg-primary/10 text-primary" },
          { key: "RECEIVED", label: "Teslim Alindi", color: "bg-blue-500/10 text-blue-600" },
          { key: "REFUNDED", label: "Iade Edildi", color: "bg-success/10 text-success" },
          { key: "REJECTED", label: "Reddedildi", color: "bg-danger/10 text-danger" },
          { key: "CANCELLED", label: "Iptal", color: "bg-muted-foreground/10 text-muted-foreground" },
        ].map((s) => {
          const count = stats.find((st) => st.status === s.key)?._count || 0;
          return (
            <div key={s.key} className={`px-3 py-2 rounded-lg ${s.color}`}>
              <p className="text-xs font-medium">{s.label}</p>
              <p className="text-lg font-bold">{count}</p>
            </div>
          );
        })}
      </div>

      <ReturnList
        returns={returns.map((r) => ({
          id: r.id,
          returnNumber: r.returnNumber,
          status: r.status,
          reason: r.reason,
          refundAmount: r.refundAmount,
          createdAt: r.createdAt.toISOString(),
          orderNumber: r.order.orderNumber,
          customerName: r.user.name,
          customerEmail: r.user.email,
          itemCount: r.items.length,
          itemNames: r.items.map((i) => i.orderItem.name).join(", "),
        }))}
      />
    </div>
  );
}
