export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import PopupList from "./PopupList";

export default async function PopupsPage() {
  const popups = await prisma.popup.findMany({ orderBy: { title: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pop-uplar</h1>
        <Link href="/admin/icerik/popuplar/yeni" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm">
          + Yeni Pop-up
        </Link>
      </div>
      <PopupList popups={popups} />
    </div>
  );
}
