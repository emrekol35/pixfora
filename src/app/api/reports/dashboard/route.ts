import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      totalCategories,
      monthlyOrdersData,
      lastMonthOrdersData,
      recentOrders,
      lowStockProducts,
      ordersByStatus,
      newCustomersThisMonth,
      newCustomersLastMonth,
      last30DaysOrders,
      pendingShipments,
      pendingReturns,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.category.count({ where: { isActive: true } }),
      // Bu ay siparisler
      prisma.order.aggregate({
        where: { createdAt: { gte: thisMonthStart } },
        _count: { id: true },
        _sum: { total: true },
      }),
      // Gecen ay siparisler
      prisma.order.aggregate({
        where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
        _count: { id: true },
        _sum: { total: true },
      }),
      // Son 5 siparis
      prisma.order.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Dusuk stoklu urunler
      prisma.product.findMany({
        where: { isActive: true, stock: { lte: 5 } },
        select: { id: true, name: true, slug: true, stock: true, price: true },
        orderBy: { stock: "asc" },
        take: 10,
      }),
      // Siparis durumlari dagilimi
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      // Yeni musteriler bu ay
      prisma.user.count({
        where: { role: "CUSTOMER", createdAt: { gte: thisMonthStart } },
      }),
      // Yeni musteriler gecen ay
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
      // Son 30 gun siparisler (trend icin)
      prisma.order.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, total: true },
        orderBy: { createdAt: "asc" },
      }),
      // Bekleyen kargolar
      prisma.shipment.count({
        where: { status: { in: ["CREATED", "PICKED_UP"] } },
      }),
      // Bekleyen iadeler
      prisma.return.count({
        where: { status: "PENDING" },
      }),
    ]);

    // 30 gunluk gelir trendi
    const dailyRevenue: { date: string; revenue: number; orders: number }[] = [];
    const dayMap = new Map<string, { revenue: number; orders: number }>();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      dayMap.set(key, { revenue: 0, orders: 0 });
    }

    for (const order of last30DaysOrders) {
      const key = order.createdAt.toISOString().split("T")[0];
      const existing = dayMap.get(key);
      if (existing) {
        existing.revenue += Number(order.total);
        existing.orders += 1;
      }
    }

    for (const [date, data] of dayMap) {
      dailyRevenue.push({ date, ...data });
    }

    const monthlyRevenue = Number(monthlyOrdersData._sum.total || 0);
    const previousMonthRevenue = Number(lastMonthOrdersData._sum.total || 0);
    const monthlyOrders = monthlyOrdersData._count.id;
    const previousMonthOrders = lastMonthOrdersData._count.id;

    return NextResponse.json({
      stats: {
        totalProducts,
        totalOrders,
        totalCustomers,
        totalCategories,
        monthlyRevenue,
        previousMonthRevenue,
        monthlyOrders,
        previousMonthOrders,
        newCustomersThisMonth,
        newCustomersLastMonth,
        pendingShipments,
        pendingReturns,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.user?.name || "Misafir",
        total: Number(o.total),
        status: o.status,
        createdAt: o.createdAt,
      })),
      lowStockProducts,
      dailyRevenue,
      ordersByStatus: ordersByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Dashboard verileri alinamadi" }, { status: 500 });
  }
}
