import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Iade analizi raporu
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderWhere: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      orderWhere.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
        orderWhere.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + "T23:59:59.999Z");
        orderWhere.createdAt.lte = new Date(endDate + "T23:59:59.999Z");
      }
    }

    const [
      totalReturns,
      totalOrdersInPeriod,
      refundAggregate,
      statusGroups,
      reasonGroups,
      processingTimeData,
      monthlyReturns,
      recentReturns,
    ] = await Promise.all([
      // Toplam iade
      prisma.return.count({ where }),
      // Donem icerisindeki toplam siparis (oran hesabi)
      prisma.order.count({ where: orderWhere }),
      // Toplam iade tutari
      prisma.return.aggregate({
        where,
        _sum: { refundAmount: true },
      }),
      // Durum dagilimi
      prisma.return.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      }),
      // Sebep dagilimi (top 10)
      prisma.return.groupBy({
        by: ["reason"],
        where,
        _count: { _all: true },
        orderBy: { _count: { reason: "desc" } },
        take: 10,
      }),
      // Islem suresi hesabi icin REFUNDED iadeler
      prisma.return.findMany({
        where: { ...where, status: "REFUNDED" },
        select: { createdAt: true, updatedAt: true },
      }),
      // Aylik trend icin tum iadeler
      prisma.return.findMany({
        where,
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      // Tablo icin son iadeler
      prisma.return.findMany({
        where,
        select: {
          id: true,
          returnNumber: true,
          status: true,
          reason: true,
          refundAmount: true,
          createdAt: true,
          order: { select: { orderNumber: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    // Iade orani
    const returnRate =
      totalOrdersInPeriod > 0
        ? Math.round((totalReturns / totalOrdersInPeriod) * 100 * 10) / 10
        : 0;

    // Ortalama islem suresi (gun)
    const avgProcessingDays =
      processingTimeData.length > 0
        ? processingTimeData.reduce((sum, r) => {
            return (
              sum +
              (r.updatedAt.getTime() - r.createdAt.getTime()) /
                (1000 * 60 * 60 * 24)
            );
          }, 0) / processingTimeData.length
        : 0;

    // Aylik trend
    const monthlyMap = new Map<string, number>();
    for (const r of monthlyReturns) {
      const month = r.createdAt.toISOString().slice(0, 7); // "2025-01"
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
    }
    const monthlyTrend = Array.from(monthlyMap.entries())
      .map(([month, count]) => ({
        date: month + "-01",
        revenue: count,
        orders: count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      totalReturns,
      returnRate,
      totalRefundAmount: refundAggregate._sum.refundAmount || 0,
      avgProcessingDays: Math.round(avgProcessingDays * 10) / 10,
      byStatus: statusGroups.map((g) => ({
        status: g.status,
        count: g._count._all,
      })),
      byReason: reasonGroups.map((g) => ({
        reason: g.reason,
        count: g._count._all,
      })),
      monthlyTrend,
      returns: recentReturns.map((r) => ({
        id: r.id,
        number: r.returnNumber,
        orderNumber: r.order.orderNumber,
        customerName: r.user.name || "Isimsiz",
        customerEmail: r.user.email,
        reason: r.reason,
        amount: r.refundAmount,
        status: r.status,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("Return report error:", error);
    return NextResponse.json(
      { error: "Iade raporu alinamadi" },
      { status: 500 }
    );
  }
}
