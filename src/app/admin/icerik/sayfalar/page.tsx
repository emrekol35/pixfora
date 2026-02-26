export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import PageList from "./PageList";

async function getPages() {
  return prisma.page.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
}

export default async function PagesPage() {
  const pages = await getPages();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sayfalar</h1>
        <Link
          href="/admin/icerik/sayfalar/yeni"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          + Yeni Sayfa
        </Link>
      </div>
      <PageList pages={pages.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))} />
    </div>
  );
}
