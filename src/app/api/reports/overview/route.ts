import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Genel bakis / KPI raporu
export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const now = new Date();

    // Bu ay baslangic
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    // Gecen ay baslangic ve bitis
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Son 30 gun
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    // Onceki 30 gun (60-30 gun once)
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [
      // Bu ay
      thisMonthOrders,
      thisMonthRevenue,
      thisMonthCustomers,
      // Gecen ay
      lastMonthOrders,
      lastMonthRevenue,
      lastMonthCustomers,
      // Genel istatistikler
      totalProducts,
      pendingOrders,
      pendingReviews,
      // En cok satan urun
      topProduct,
      // Top kategori
      topCategoryItems,
      // Son 30 gun gunluk gelir (bu donem)
      currentPeriodOrders,
      // Onceki 30 gun gunluk gelir
      previousPeriodOrders,
    ] = await Promise.all([
      // Bu ay siparis sayisi
      prisma.order.count({
        where: { createdAt: { gte: thisMonthStart } },
      }),
      // Bu ay gelir
      prisma.order.aggregate({
        where: { createdAt: { gte: thisMonthStart } },
        _sum: { total: true },
      }),
      // Bu ay yeni musteri
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          createdAt: { gte: thisMonthStart },
        },
      }),
      // Gecen ay siparis sayisi
      prisma.order.count({
        where: {
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
      // Gecen ay gelir
      prisma.order.aggregate({
        where: {
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { total: true },
      }),
      // Gecen ay yeni musteri
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
      // Toplam urun
      prisma.product.count({ where: { isActive: true } }),
      // Bekleyen siparisler
      prisma.order.count({ where: { status: "PENDING" } }),
      // Bekleyen yorumlar
      prisma.review.count({ where: { isApproved: false } }),
      // En cok satan urun (son 30 gun)
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: {
          order: { createdAt: { gte: thirtyDaysAgo } },
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 1,
      }),
      // Top kategori (gelir bazli)
      prisma.orderItem.findMany({
        where: {
          order: { createdAt: { gte: thirtyDaysAgo } },
        },
        select: {
          total: true,
          product: { select: { category: { select: { name: true } } } },
        },
      }),
      // Son 30 gun siparisler
      prisma.order.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, total: true },
      }),
      // Onceki 30 gun siparisler
      prisma.order.findMany({
        where: {
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
        select: { createdAt: true, total: true },
      }),
    ]);

    // KPI hesaplamalari
    const thisRevenue = thisMonthRevenue._sum.total || 0;
    const lastRevenue = lastMonthRevenue._sum.total || 0;
    const thisAvgOrder = thisMonthOrders > 0 ? thisRevenue / thisMonthOrders : 0;
    const lastAvgOrder =
      lastMonthOrders > 0 ? lastRevenue / lastMonthOrders : 0;

    function pctChange(current: number, previous: number): number {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    }

    const kpis = [
      {
        label: "Aylik Gelir",
        value: thisRevenue,
        change: pctChange(thisRevenue, lastRevenue),
        isCurrency: true,
      },
      {
        label: "Siparis Sayisi",
        value: thisMonthOrders,
        change: pctChange(thisMonthOrders, lastMonthOrders),
        isCurrency: false,
      },
      {
        label: "Ort. Siparis Degeri",
        value: thisAvgOrder,
        change: pctChange(thisAvgOrder, lastAvgOrder),
        isCurrency: true,
      },
      {
        label: "Yeni Musteri",
        value: thisMonthCustomers,
        change: pctChange(thisMonthCustomers, lastMonthCustomers),
        isCurrency: false,
      },
      {
        label: "Aktif Urun",
        value: totalProducts,
        change: 0,
        isCurrency: false,
      },
      {
        label: "Bekleyen Siparis",
        value: pendingOrders,
        change: 0,
        isCurrency: false,
      },
    ];

    // En cok satan urun adi
    let topProductName = "-";
    if (topProduct.length > 0) {
      const p = await prisma.product.findUnique({
        where: { id: topProduct[0].productId },
        select: { name: true },
      });
      topProductName = p?.name || "-";
    }

    // Top kategori hesapla
    const catMap = new Map<string, number>();
    for (const item of topCategoryItems) {
      const catName = item.product?.category?.name || "Kategorisiz";
      catMap.set(catName, (catMap.get(catName) || 0) + item.total);
    }
    let topCategoryName = "-";
    let maxCatRevenue = 0;
    for (const [name, revenue] of catMap.entries()) {
      if (revenue > maxCatRevenue) {
        maxCatRevenue = revenue;
        topCategoryName = name;
      }
    }

    // Gelir karsilastirma (gunluk - bu donem vs onceki donem)
    function buildDailyMap(orders: { createdAt: Date; total: number }[]) {
      const map = new Map<number, number>();
      for (const o of orders) {
        const dayOfMonth = o.createdAt.getDate();
        map.set(dayOfMonth, (map.get(dayOfMonth) || 0) + o.total);
      }
      return map;
    }

    const currentMap = buildDailyMap(currentPeriodOrders);
    const previousMap = buildDailyMap(previousPeriodOrders);

    const maxDay = Math.max(
      ...Array.from(currentMap.keys()),
      ...Array.from(previousMap.keys()),
      1
    );

    const revenueComparison = [];
    for (let day = 1; day <= maxDay; day++) {
      revenueComparison.push({
        day,
        current: currentMap.get(day) || 0,
        previous: previousMap.get(day) || 0,
      });
    }

    const quickStats = {
      topProduct: topProductName,
      topCategory: topCategoryName,
      pendingReviews,
      pendingOrders,
    };

    return NextResponse.json({
      kpis,
      revenueComparison,
      quickStats,
    });
  } catch (error) {
    console.error("Overview report error:", error);
    return NextResponse.json(
      { error: "Genel bakis verileri alinamadi" },
      { status: 500 }
    );
  }
}
