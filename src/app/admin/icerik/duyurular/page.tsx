export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import AnnouncementList from "./AnnouncementList";

export default async function AnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({ orderBy: { text: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Duyurular</h1>
        <Link href="/admin/icerik/duyurular/yeni" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm">
          + Yeni Duyuru
        </Link>
      </div>
      <AnnouncementList announcements={announcements} />
    </div>
  );
}
