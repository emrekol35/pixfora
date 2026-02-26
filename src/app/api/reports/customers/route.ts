import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - En iyi musteriler raporu
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    // Kullanici bazinda gruplama (null userId filtrele)
    const groupedOrders = await prisma.order.groupBy({
      by: ["userId"],
      _count: { id: true },
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: limit,
      where: { userId: { not: null } },
    });

    const userIds = groupedOrders
      .map((item) => item.userId)
      .filter((id): id is string => id !== null);

    // Kullanici bilgilerini getir
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    // Kullanici haritasi olustur
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Sonuclari birlestir
    const customers = groupedOrders.map((item) => {
      const user = item.userId ? userMap.get(item.userId) : null;
      return {
        id: item.userId,
        name: user?.name || "",
        email: user?.email || "",
        orderCount: item._count.id,
        totalSpent: item._sum.total || 0,
      };
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Customer report error:", error);
    return NextResponse.json(
      { error: "Musteri raporu alinamadi" },
      { status: 500 }
    );
  }
}
