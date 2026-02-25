import { prisma } from "@/lib/db";
import OrderList from "./OrderList";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      items: { include: { product: true } },
      user: { select: { name: true, email: true } },
      shippingAddress: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const stats = await prisma.order.groupBy({
    by: ["status"],
    _count: true,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Siparis Yonetimi</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {[
          { key: "PENDING", label: "Beklemede", color: "bg-warning/10 text-warning" },
          { key: "CONFIRMED", label: "Onaylandi", color: "bg-info/10 text-info" },
          { key: "PROCESSING", label: "Hazirlaniyor", color: "bg-primary/10 text-primary" },
          { key: "SHIPPED", label: "Kargoda", color: "bg-primary/10 text-primary" },
          { key: "DELIVERED", label: "Teslim", color: "bg-success/10 text-success" },
          { key: "CANCELLED", label: "Iptal", color: "bg-danger/10 text-danger" },
          { key: "REFUNDED", label: "Iade", color: "bg-muted-foreground/10 text-muted-foreground" },
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

      <OrderList
        orders={orders.map((o) => ({
          ...o,
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
