export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import PushSendForm from "./PushSendForm";

export default async function AdminPushPage() {
  const [total, withUser, guest] = await Promise.all([
    prisma.pushSubscription.count(),
    prisma.pushSubscription.count({ where: { userId: { not: null } } }),
    prisma.pushSubscription.count({ where: { userId: null } }),
  ]);

  // Son gonderilen bildirimler (Activity Log'dan)
  const recentLogs = await prisma.activityLog.findMany({
    where: { action: "push_broadcast" },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Kullanici isimlerini ayri cek
  const userIds = recentLogs.map((l) => l.userId).filter(Boolean) as string[];
  const users = userIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Push Bildirimler</h1>

      <PushSendForm stats={{ total, withUser, guest }} />

      {/* Son Gonderimler */}
      {recentLogs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Son Gonderimler</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Baslik
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Gonderen
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Ulasim
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                    Tarih
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => {
                  const details = log.details as Record<string, unknown> | null;
                  return (
                    <tr key={log.id} className="border-t border-border">
                      <td className="px-4 py-3 text-sm text-foreground">
                        {(details?.title as string) || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {log.userId ? userMap.get(log.userId) || "-" : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {(details?.sentCount as number) ?? "-"} kisi
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("tr-TR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
