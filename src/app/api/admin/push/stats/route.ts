import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const [total, withUser, guest] = await Promise.all([
      prisma.pushSubscription.count(),
      prisma.pushSubscription.count({ where: { userId: { not: null } } }),
      prisma.pushSubscription.count({ where: { userId: null } }),
    ]);

    return NextResponse.json({
      stats: { total, withUser, guest },
    });
  } catch (error) {
    console.error("Push stats error:", error);
    return NextResponse.json({ error: "Istatistikler alinamadi" }, { status: 500 });
  }
}
