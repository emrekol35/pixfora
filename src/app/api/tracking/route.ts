import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// Tek event veya batch event kayit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Session'dan userId al (varsa)
    let userId: string | null = null;
    try {
      const session = await auth();
      userId = session?.user?.id || null;
    } catch {
      // Auth hatasi — anonim devam et
    }

    // Batch destegi: { events: [...] } veya tek event
    const events: Array<{
      visitorId: string;
      sessionId: string;
      eventType: string;
      eventData?: Record<string, unknown>;
      page?: string;
      referrer?: string;
      testAssignments?: Record<string, unknown>;
    }> = body.events || [body];

    // Validasyon
    const validEvents = events.filter(
      (e) =>
        e.visitorId &&
        typeof e.visitorId === "string" &&
        e.sessionId &&
        typeof e.sessionId === "string" &&
        e.eventType &&
        typeof e.eventType === "string" &&
        e.eventType.length <= 50 &&
        e.visitorId.length <= 64 &&
        e.sessionId.length <= 64
    );

    if (validEvents.length === 0) {
      return NextResponse.json(
        { error: "Gecersiz event verisi" },
        { status: 400 }
      );
    }

    // Maksimum 20 event/batch
    const batch = validEvents.slice(0, 20);

    await prisma.trackingEvent.createMany({
      data: batch.map((e) => ({
        visitorId: e.visitorId,
        userId,
        sessionId: e.sessionId,
        eventType: e.eventType,
        eventData: (e.eventData ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        page: e.page?.slice(0, 500) || null,
        referrer: e.referrer?.slice(0, 500) || null,
        testAssignments: (e.testAssignments ??
          Prisma.JsonNull) as Prisma.InputJsonValue,
      })),
    });

    return NextResponse.json({ ok: true, count: batch.length });
  } catch (error) {
    console.error("Tracking event kayit hatasi:", error);
    return NextResponse.json(
      { error: "Event kaydedilemedi" },
      { status: 500 }
    );
  }
}
