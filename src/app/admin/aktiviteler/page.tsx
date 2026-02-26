export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import ActivityLogViewer from "./ActivityLogViewer";

export default async function ActivityLogPage() {
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Fetch user names for logs that have userId
  const userIds = [
    ...new Set(logs.map((l) => l.userId).filter(Boolean)),
  ] as string[];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = Object.fromEntries(
    users.map((u) => [u.id, { name: u.name, email: u.email }])
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Aktivite Loglari</h1>
      <ActivityLogViewer
        logs={logs.map((l) => ({
          id: l.id,
          userId: l.userId,
          userName: l.userId
            ? userMap[l.userId]?.name || "Bilinmeyen"
            : "Sistem",
          userEmail: l.userId ? userMap[l.userId]?.email || "" : "",
          action: l.action,
          entity: l.entity,
          entityId: l.entityId,
          details: l.details as Record<string, unknown> | null,
          createdAt: l.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
