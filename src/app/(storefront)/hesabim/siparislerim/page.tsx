export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import OrderHistory from "@/components/storefront/OrderHistory";

export default async function OrdersPage() {
  const session = await auth();

  const orders = await prisma.order.findMany({
    where: { userId: session!.user!.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              images: { take: 1, select: { url: true } },
            },
          },
        },
      },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Siparislerim</h1>
      <OrderHistory
        orders={orders.map((o) => ({
          ...o,
          total: Number(o.total),
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
          items: o.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            price: Number(item.price),
            productName: item.product.name,
            productSlug: item.product.slug,
            productImage: item.product.images[0]?.url || null,
          })),
        }))}
      />
    </div>
  );
}
