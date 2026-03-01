import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const eventType = searchParams.get("eventType");

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Ensure endDate covers the full day
    endDate.setHours(23, 59, 59, 999);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereBase: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Get all distinct event types first
    const eventTypes = await prisma.trackingEvent.groupBy({
      by: ["eventType"],
      where: whereBase,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    // For each event type, get total count, unique visitors, and 7-day trend
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const events = await Promise.all(
      eventTypes.map(async (et) => {
        const total = et._count.id;

        // Unique visitors
        const uniqueResult = await prisma.trackingEvent.groupBy({
          by: ["visitorId"],
          where: {
            ...whereBase,
            eventType: et.eventType,
          },
        });
        const uniqueVisitors = uniqueResult.length;

        // 7-day daily trend
        const trendData = [];
        for (let d = 6; d >= 0; d--) {
          const dayStart = new Date(now);
          dayStart.setDate(dayStart.getDate() - d);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(dayStart);
          dayEnd.setHours(23, 59, 59, 999);

          const dayCount = await prisma.trackingEvent.count({
            where: {
              eventType: et.eventType,
              createdAt: {
                gte: dayStart,
                lte: dayEnd,
              },
            },
          });
          trendData.push(dayCount);
        }

        return {
          eventType: et.eventType,
          total,
          uniqueVisitors,
          trend: trendData,
        };
      })
    );

    // If specific eventType requested, also return last 50 events with details
    let details;
    if (eventType) {
      const detailEvents = await prisma.trackingEvent.findMany({
        where: {
          ...whereBase,
          eventType,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          visitorId: true,
          eventType: true,
          eventData: true,
          page: true,
          createdAt: true,
          sessionId: true,
        },
      });
      details = detailEvents;
    }

    return NextResponse.json({ events, details });
  } catch (error) {
    console.error("Event analytics error:", error);
    return NextResponse.json(
      { error: "Event verileri yuklenemedi" },
      { status: 500 }
    );
  }
}
