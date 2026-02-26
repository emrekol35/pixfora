export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import GroupList from "./GroupList";

export default async function GroupsPage() {
  const groups = await prisma.userGroup.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Musteri Gruplari</h1>
        <Link href="/admin/musteriler/gruplar/yeni" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm">
          + Yeni Grup
        </Link>
      </div>
      <GroupList groups={groups.map((g) => ({
        id: g.id,
        name: g.name,
        discountPercent: g.discountPercent,
        userCount: g._count.users,
      }))} />
    </div>
  );
}
