export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import CustomerDetail from "./CustomerDetail";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [customer, groups] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        group: true,
        addresses: true,
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    }),
    prisma.userGroup.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!customer) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Musteri Detay</h1>
      <CustomerDetail
        customer={{
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          groupId: customer.groupId,
          isBlacklisted: customer.isBlacklisted,
          createdAt: customer.createdAt.toISOString(),
          addresses: customer.addresses,
          orders: customer.orders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            total: o.total,
            status: o.status,
            createdAt: o.createdAt.toISOString(),
          })),
        }}
        groups={groups}
      />
    </div>
  );
}
