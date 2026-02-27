import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Kargo performansi raporu
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

    const [
      totalShipments,
      deliveredCount,
      problemCount,
      statusGroups,
      providerGroups,
      cityGroups,
      deliveryTimeData,
      recentShipments,
    ] = await Promise.all([
      // Toplam gonderi
      prisma.shipment.count({ where }),
      // Teslim edilen
      prisma.shipment.count({ where: { ...where, status: "DELIVERED" } }),
      // Sorunlu (RETURNED + FAILED)
      prisma.shipment.count({
        where: { ...where, status: { in: ["RETURNED", "FAILED"] } },
      }),
      // Durum dagilimi
      prisma.shipment.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      }),
      // Firma dagilimi
      prisma.shipment.groupBy({
        by: ["provider"],
        where,
        _count: { _all: true },
      }),
      // Sehir bazli dagilim (top 10)
      prisma.shipment.groupBy({
        by: ["receiverCity"],
        where,
        _count: { _all: true },
        orderBy: { _count: { receiverCity: "desc" } },
        take: 10,
      }),
      // Teslim suresi hesabi icin DELIVERED gonderiler
      prisma.shipment.findMany({
        where: { ...where, status: "DELIVERED" },
        select: { createdAt: true, updatedAt: true },
      }),
      // Tablo icin son gonderiler
      prisma.shipment.findMany({
        where,
        select: {
          id: true,
          shipmentNumber: true,
          provider: true,
          status: true,
          receiverCity: true,
          trackingNumber: true,
          createdAt: true,
          updatedAt: true,
          order: { select: { orderNumber: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    // Ortalama teslim suresi (gun)
    const avgDeliveryDays =
      deliveryTimeData.length > 0
        ? deliveryTimeData.reduce((sum, s) => {
            return (
              sum +
              (s.updatedAt.getTime() - s.createdAt.getTime()) /
                (1000 * 60 * 60 * 24)
            );
          }, 0) / deliveryTimeData.length
        : 0;

    return NextResponse.json({
      totalShipments,
      deliveryRate:
        totalShipments > 0
          ? Math.round((deliveredCount / totalShipments) * 100)
          : 0,
      avgDeliveryDays: Math.round(avgDeliveryDays * 10) / 10,
      problemCount,
      byStatus: statusGroups.map((g) => ({
        status: g.status,
        count: g._count._all,
      })),
      byProvider: providerGroups.map((g) => ({
        provider: g.provider,
        count: g._count._all,
      })),
      byCity: cityGroups.map((g) => ({
        city: g.receiverCity,
        count: g._count._all,
      })),
      shipments: recentShipments.map((s) => ({
        id: s.id,
        number: s.shipmentNumber,
        orderNumber: s.order.orderNumber,
        provider: s.provider,
        status: s.status,
        city: s.receiverCity,
        tracking: s.trackingNumber,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Shipping report error:", error);
    return NextResponse.json(
      { error: "Kargo raporu alinamadi" },
      { status: 500 }
    );
  }
}
