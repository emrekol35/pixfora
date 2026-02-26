export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  CONFIRMED: "Onaylandi",
  PROCESSING: "Hazirlaniyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "Iptal",
};

export default async function AccountPage() {
  const session = await auth();

  const [orderCount, addressCount, user, recentOrders] = await Promise.all([
    prisma.order.count({ where: { userId: session!.user!.id } }),
    prisma.address.count({ where: { userId: session!.user!.id } }),
    prisma.user.findUnique({
      where: { id: session!.user!.id },
      select: { createdAt: true },
    }),
    prisma.order.findMany({
      where: { userId: session!.user!.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Hosgeldiniz, {session!.user!.name}
      </h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-muted-foreground text-sm">Toplam Siparis</p>
          <p className="text-2xl font-bold">{orderCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-muted-foreground text-sm">Kayitli Adres</p>
          <p className="text-2xl font-bold">{addressCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-muted-foreground text-sm">Uye Tarihi</p>
          <p className="text-lg font-bold">
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString("tr-TR")
              : "\u2014"}
          </p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Son Siparisler</h2>
          <Link
            href="/hesabim/siparislerim"
            className="text-sm text-primary hover:underline"
          >
            Tumunu Gor
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Henuz siparisiniz yok.
          </p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/hesabim/siparislerim/${order.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">#{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.createdAt.toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">
                    {new Intl.NumberFormat("tr-TR", {
                      style: "currency",
                      currency: "TRY",
                    }).format(Number(order.total))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {STATUS_LABELS[order.status] || order.status}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
