import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/admin/analytics/cleanup
// Eski tracking event'lerini temizle
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const retentionDays = body.retentionDays || 90;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Batch silme (1000'er kayit)
    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      const oldEvents = await prisma.trackingEvent.findMany({
        where: { createdAt: { lt: cutoffDate } },
        select: { id: true },
        take: 1000,
      });

      if (oldEvents.length === 0) {
        hasMore = false;
        break;
      }

      await prisma.trackingEvent.deleteMany({
        where: { id: { in: oldEvents.map((e) => e.id) } },
      });

      totalDeleted += oldEvents.length;

      if (oldEvents.length < 1000) {
        hasMore = false;
      }
    }

    return NextResponse.json({
      ok: true,
      deleted: totalDeleted,
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    console.error("Event temizleme hatasi:", error);
    return NextResponse.json(
      { error: "Temizleme basarisiz" },
      { status: 500 }
    );
  }
}
