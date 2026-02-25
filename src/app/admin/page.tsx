export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";

async function getStats() {
  const [productCount, orderCount, customerCount, categoryCount] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.category.count(),
    ]);

  return { productCount, orderCount, customerCount, categoryCount };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    {
      title: "Toplam Urun",
      value: stats.productCount,
      color: "bg-blue-500",
    },
    {
      title: "Toplam Siparis",
      value: stats.orderCount,
      color: "bg-green-500",
    },
    {
      title: "Toplam Musteri",
      value: stats.customerCount,
      color: "bg-purple-500",
    },
    {
      title: "Kategori",
      value: stats.categoryCount,
      color: "bg-orange-500",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-card rounded-xl border border-border p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
              <div
                className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-white text-xl`}
              >
                {card.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Son Siparisler</h2>
          <p className="text-muted-foreground text-sm">
            Henuz siparis bulunmuyor.
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Stok Uyarilari</h2>
          <p className="text-muted-foreground text-sm">
            Dusuk stoklu urun bulunmuyor.
          </p>
        </div>
      </div>
    </div>
  );
}
