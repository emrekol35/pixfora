import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Satis raporu (genisletilmis)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + "T23:59:59.999Z");
      }
    }

    const [totalOrders, aggregate, orders, statusGroups, paymentGroups] =
      await Promise.all([
        prisma.order.count({ where }),
        prisma.order.aggregate({
          where,
          _sum: { total: true },
        }),
        prisma.order.findMany({
          where,
          select: { createdAt: true, total: true },
        }),
        // Siparis durumu dagilimi
        prisma.order.groupBy({
          by: ["status"],
          where,
          _count: { _all: true },
          _sum: { total: true },
        }),
        // Odeme yontemi dagilimi
        prisma.order.groupBy({
          by: ["paymentMethod"],
          where,
          _count: { _all: true },
          _sum: { total: true },
        }),
      ]);

    const totalRevenue = aggregate._sum.total || 0;
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Gunluk bazda gruplama
    const dailyMap = new Map<string, { orders: number; revenue: number }>();

    for (const order of orders) {
      const date = order.createdAt.toISOString().split("T")[0];
      const existing = dailyMap.get(date);
      if (existing) {
        existing.orders += 1;
        existing.revenue += order.total;
      } else {
        dailyMap.set(date, { orders: 1, revenue: order.total });
      }
    }

    const dailySales = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        orders: data.orders,
        revenue: data.revenue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Siparis durumu dagilimi
    const ordersByStatus = statusGroups.map((g) => ({
      status: g.status,
      count: g._count._all,
      revenue: g._sum.total || 0,
    }));

    // Odeme yontemi dagilimi
    const ordersByPaymentMethod = paymentGroups.map((g) => ({
      method: g.paymentMethod,
      count: g._count._all,
      revenue: g._sum.total || 0,
    }));

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      averageOrder,
      dailySales,
      ordersByStatus,
      ordersByPaymentMethod,
    });
  } catch (error) {
    console.error("Sales report error:", error);
    return NextResponse.json(
      { error: "Satis raporu alinamadi" },
      { status: 500 }
    );
  }
}
