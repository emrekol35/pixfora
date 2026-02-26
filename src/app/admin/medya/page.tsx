export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import MediaLibrary from "./MediaLibrary";

async function getMedia() {
  return prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export default async function MediaPage() {
  const media = await getMedia();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Medya Kutuphanesi</h1>
      <MediaLibrary media={media.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      }))} />
    </div>
  );
}
