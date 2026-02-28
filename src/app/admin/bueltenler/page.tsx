export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import NewsletterList from "./NewsletterList";

export default async function NewsletterPage() {
  const subscribers = await prisma.newsletter.findMany({ orderBy: { createdAt: "desc" } });
  const totalCount = subscribers.length;
  const confirmedCount = subscribers.filter((s) => s.isConfirmed).length;
  const pendingCount = totalCount - confirmedCount;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          E-Bulten Aboneleri
        </h1>
      </div>

      {/* Istatistikler */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Toplam Abone</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-success">{confirmedCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Onaylanan</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-warning">{pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Bekleyen</p>
        </div>
      </div>

      <NewsletterList
        subscribers={subscribers.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
          confirmedAt: s.confirmedAt?.toISOString() || null,
        }))}
      />
    </div>
  );
}
