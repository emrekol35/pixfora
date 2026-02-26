export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import MenuList from "./MenuList";

export default async function MenusPage() {
  const menus = await prisma.menu.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Menuler</h1>
        <Link href="/admin/icerik/menuler/yeni" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm">
          + Yeni Menu
        </Link>
      </div>
      <MenuList menus={menus.map((m) => ({
        ...m,
        itemCount: Array.isArray(m.items) ? (m.items as unknown[]).length : 0,
      }))} />
    </div>
  );
}
