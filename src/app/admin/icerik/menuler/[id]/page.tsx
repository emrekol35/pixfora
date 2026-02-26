export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import MenuEditor from "../MenuEditor";

interface MenuItem {
  label: string;
  href: string;
  children: { label: string; href: string }[];
}

export default async function EditMenuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const menu = await prisma.menu.findUnique({ where: { id } });
  if (!menu) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Menu Duzenle</h1>
      <MenuEditor menu={{
        id: menu.id,
        name: menu.name,
        location: menu.location,
        items: (menu.items as unknown as MenuItem[]) || [],
      }} />
    </div>
  );
}
