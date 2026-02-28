import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { broadcastPush } from "@/lib/push";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { title, message, url } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Baslik ve mesaj zorunlu" },
        { status: 400 }
      );
    }

    const sentCount = await broadcastPush({
      title,
      body: message,
      url: url || "/",
      tag: "admin-broadcast",
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id!,
        action: "push_broadcast",
        entity: "push_notification",
        entityId: "broadcast",
        details: { title, message, url, sentCount },
      },
    });

    return NextResponse.json({
      message: `${sentCount} aboneye push bildirim gonderildi`,
      sentCount,
    });
  } catch (error) {
    console.error("Admin push send error:", error);
    return NextResponse.json(
      { error: "Push bildirim gonderilemedi" },
      { status: 500 }
    );
  }
}
