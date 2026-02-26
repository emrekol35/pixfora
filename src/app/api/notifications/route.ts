import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const countOnly = searchParams.get("countOnly") === "true";

  // Sadece okunmamis bildirim sayisi (polling icin hafif endpoint)
  if (countOnly) {
    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    });
    return NextResponse.json({ unreadCount });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 401 });
  }

  const body = await request.json();

  if (body.markAllRead) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  }

  if (body.id && body.isRead !== undefined) {
    await prisma.notification.update({
      where: { id: body.id, userId: session.user.id },
      data: { isRead: body.isRead },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Gecersiz istek" }, { status: 400 });
}
