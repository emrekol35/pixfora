export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import AnnouncementForm from "../AnnouncementForm";

export default async function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Duyuru Duzenle</h1>
      <AnnouncementForm announcement={announcement} />
    </div>
  );
}
