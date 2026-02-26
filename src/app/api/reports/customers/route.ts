import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Musteri analizi raporu (genisletilmis)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const now = new Date();
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [
      totalUsers,
      usersWithOrders,
      groupedOrders,
      recentUsers,
    ] = await Promise.all([
      // Toplam kayitli kullanici
      prisma.user.count({ where: { role: "CUSTOMER" } }),

      // Siparis veren kullanici sayisi
      prisma.order.findMany({
        where: { userId: { not: null } },
        select: { userId: true },
        distinct: ["userId"],
      }),

      // Kullanici bazinda gruplama
      prisma.order.groupBy({
        by: ["userId"],
        _count: { id: true },
        _sum: { total: true },
        orderBy: { _sum: { total: "desc" } },
        take: limit,
        where: { userId: { not: null } },
      }),

      // Son 90 gun kayit trendi
      prisma.user.findMany({
        where: {
          role: "CUSTOMER",
          createdAt: { gte: ninetyDaysAgo },
        },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Kullanici bilgilerini getir
    const userIds = groupedOrders
      .map((item) => item.userId)
      .filter((id): id is string => id !== null);

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Top musteriler
    const customers = groupedOrders.map((item) => {
      const user = item.userId ? userMap.get(item.userId) : null;
      return {
        id: item.userId,
        name: user?.name || "",
        email: user?.email || "",
        orderCount: item._count.id,
        totalSpent: item._sum.total || 0,
        avgOrder:
          item._count.id > 0
            ? (item._sum.total || 0) / item._count.id
            : 0,
      };
    });

    // Segmentasyon
    const uniqueOrderUsers = usersWithOrders.length;
    const repeatCustomers = groupedOrders.filter(
      (g) => g._count.id >= 2
    ).length;
    const highValueCustomers = groupedOrders.filter(
      (g) => (g._sum.total || 0) >= 1000
    ).length;

    // Kayit trendi (son 90 gun, gunluk)
    const registrationMap = new Map<string, number>();
    for (const u of recentUsers) {
      const date = u.createdAt.toISOString().split("T")[0];
      registrationMap.set(date, (registrationMap.get(date) || 0) + 1);
    }

    const registrationTrend = Array.from(registrationMap.entries())
      .map(([date, count]) => ({ date, revenue: count, orders: count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Siparis frekans dagilimi
    const frequencyMap = new Map<string, number>();
    for (const g of groupedOrders) {
      const count = g._count.id;
      let bucket: string;
      if (count === 1) bucket = "1 Siparis";
      else if (count <= 3) bucket = "2-3 Siparis";
      else if (count <= 5) bucket = "4-5 Siparis";
      else if (count <= 10) bucket = "6-10 Siparis";
      else bucket = "10+ Siparis";

      frequencyMap.set(bucket, (frequencyMap.get(bucket) || 0) + 1);
    }

    const orderFrequency = [
      "1 Siparis",
      "2-3 Siparis",
      "4-5 Siparis",
      "6-10 Siparis",
      "10+ Siparis",
    ]
      .filter((b) => frequencyMap.has(b))
      .map((b) => ({ name: b, value: frequencyMap.get(b) || 0 }));

    return NextResponse.json({
      stats: {
        totalUsers,
        usersWithOrders: uniqueOrderUsers,
        repeatCustomers,
        highValueCustomers,
        orderPercentage:
          totalUsers > 0
            ? Math.round((uniqueOrderUsers / totalUsers) * 100)
            : 0,
        repeatPercentage:
          uniqueOrderUsers > 0
            ? Math.round((repeatCustomers / uniqueOrderUsers) * 100)
            : 0,
      },
      customers,
      registrationTrend,
      orderFrequency,
    });
  } catch (error) {
    console.error("Customer report error:", error);
    return NextResponse.json(
      { error: "Musteri raporu alinamadi" },
      { status: 500 }
    );
  }
}
