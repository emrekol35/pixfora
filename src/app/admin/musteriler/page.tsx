export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import CustomerList from "./CustomerList";

async function getCustomers() {
  return prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    include: {
      group: true,
      _count: { select: { orders: true } },
    },
  });
}

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Musteriler</h1>
        <span className="text-sm text-muted-foreground">{customers.length} musteri</span>
      </div>
      <CustomerList customers={customers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        groupName: c.group?.name || null,
        orderCount: c._count.orders,
        isBlacklisted: c.isBlacklisted,
        createdAt: c.createdAt.toISOString(),
      }))} />
    </div>
  );
}
