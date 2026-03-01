import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

interface VariantMetrics {
  variantId: string;
  variantName: string;
  isControl: boolean;
  uniqueVisitors: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  revenuePerVisitor: number;
  avgOrderValue: number;
  isSignificant: boolean;
  zScore: number;
  pValue: number;
}

interface DailyDataPoint {
  date: string;
  variantId: string;
  variantName: string;
  visitors: number;
  conversions: number;
  revenue: number;
}

// GET /api/admin/ab-tests/[id]/results — A/B test sonuclari
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Testi ve varyantlari getir
    const test = await prisma.aBTest.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: { isControl: "desc" },
        },
      },
    });

    if (!test) {
      return NextResponse.json(
        { error: "A/B test bulunamadi" },
        { status: 404 }
      );
    }

    // Tarih filtresi
    const dateFilter: { assignedAt?: { gte?: Date; lte?: Date } } = {};
    const eventDateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {};

    if (startDateParam) {
      dateFilter.assignedAt = { ...dateFilter.assignedAt, gte: new Date(startDateParam) };
      eventDateFilter.createdAt = { ...eventDateFilter.createdAt, gte: new Date(startDateParam) };
    }
    if (endDateParam) {
      dateFilter.assignedAt = { ...dateFilter.assignedAt, lte: new Date(endDateParam) };
      eventDateFilter.createdAt = { ...eventDateFilter.createdAt, lte: new Date(endDateParam) };
    }

    // Her varyant icin atamalari getir
    const assignments = await prisma.aBTestAssignment.findMany({
      where: {
        testId: id,
        ...dateFilter,
      },
      select: {
        variantId: true,
        visitorId: true,
      },
    });

    // Varyant bazinda visitorId'leri grupla
    const variantVisitors = new Map<string, Set<string>>();
    for (const variant of test.variants) {
      variantVisitors.set(variant.id, new Set());
    }
    for (const assignment of assignments) {
      const visitors = variantVisitors.get(assignment.variantId);
      if (visitors) {
        visitors.add(assignment.visitorId);
      }
    }

    // Tum test visitorId'lerini topla
    const allVisitorIds = new Set<string>();
    for (const assignment of assignments) {
      allVisitorIds.add(assignment.visitorId);
    }

    // Purchase eventlerini getir (sadece bu test ile ilgili visitor'lar icin)
    let purchaseEvents: Array<{
      visitorId: string;
      eventData: unknown;
      createdAt: Date;
    }> = [];

    if (allVisitorIds.size > 0) {
      purchaseEvents = await prisma.trackingEvent.findMany({
        where: {
          eventType: "purchase",
          visitorId: { in: Array.from(allVisitorIds) },
          ...eventDateFilter,
        },
        select: {
          visitorId: true,
          eventData: true,
          createdAt: true,
        },
      });
    }

    // Purchase event'lerini visitor bazinda indexle
    const purchaseByVisitor = new Map<
      string,
      Array<{ eventData: unknown; createdAt: Date }>
    >();
    for (const event of purchaseEvents) {
      if (!purchaseByVisitor.has(event.visitorId)) {
        purchaseByVisitor.set(event.visitorId, []);
      }
      purchaseByVisitor.get(event.visitorId)!.push({
        eventData: event.eventData,
        createdAt: event.createdAt,
      });
    }

    // Kontrol varyantini bul (z-test icin)
    let controlMetrics: { conversions: number; uniqueVisitors: number } | null =
      null;

    // Her varyant icin metrikleri hesapla
    const variantMetrics: VariantMetrics[] = [];

    for (const variant of test.variants) {
      const visitors = variantVisitors.get(variant.id) || new Set();
      const uniqueVisitorCount = visitors.size;

      // Bu varyant visitor'larinin conversion ve gelir hesabi
      let conversions = 0;
      let revenue = 0;
      const convertedVisitors = new Set<string>();

      for (const visitorId of visitors) {
        const purchases = purchaseByVisitor.get(visitorId);
        if (purchases && purchases.length > 0) {
          if (!convertedVisitors.has(visitorId)) {
            conversions++;
            convertedVisitors.add(visitorId);
          }
          for (const purchase of purchases) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = purchase.eventData as any;
            if (data && typeof data.total === "number") {
              revenue += data.total;
            }
          }
        }
      }

      const conversionRate =
        uniqueVisitorCount > 0 ? conversions / uniqueVisitorCount : 0;
      const revenuePerVisitor =
        uniqueVisitorCount > 0 ? revenue / uniqueVisitorCount : 0;
      const avgOrderValue = conversions > 0 ? revenue / conversions : 0;

      const metrics: VariantMetrics = {
        variantId: variant.id,
        variantName: variant.name,
        isControl: variant.isControl,
        uniqueVisitors: uniqueVisitorCount,
        conversions,
        revenue: Math.round(revenue * 100) / 100,
        conversionRate: Math.round(conversionRate * 10000) / 10000,
        revenuePerVisitor: Math.round(revenuePerVisitor * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        isSignificant: false,
        zScore: 0,
        pValue: 1,
      };

      if (variant.isControl) {
        controlMetrics = {
          conversions,
          uniqueVisitors: uniqueVisitorCount,
        };
      }

      variantMetrics.push(metrics);
    }

    // Z-test ile istatistiksel anlamlilik hesapla
    if (controlMetrics && controlMetrics.uniqueVisitors > 0) {
      const p1 =
        controlMetrics.conversions / controlMetrics.uniqueVisitors;
      const n1 = controlMetrics.uniqueVisitors;

      for (const metrics of variantMetrics) {
        if (metrics.isControl) continue;
        if (metrics.uniqueVisitors === 0) continue;

        const p2 = metrics.conversions / metrics.uniqueVisitors;
        const n2 = metrics.uniqueVisitors;

        // Pooled proportion
        const pooledP =
          (controlMetrics.conversions + metrics.conversions) / (n1 + n2);

        // Z-score hesapla
        const denominator = Math.sqrt(
          pooledP * (1 - pooledP) * (1 / n1 + 1 / n2)
        );

        if (denominator > 0) {
          const zScore = (p2 - p1) / denominator;
          metrics.zScore = Math.round(zScore * 1000) / 1000;

          // p-value yaklasimlama (normal dagilim CDF)
          metrics.pValue = calculatePValue(Math.abs(zScore));

          // 95% guven araligi icin |z| > 1.96
          metrics.isSignificant = Math.abs(zScore) > 1.96;
        }
      }
    }

    // Gunluk veri (conversion trend)
    const dailyData = await calculateDailyData(
      id,
      test.variants,
      variantVisitors,
      eventDateFilter
    );

    return NextResponse.json({
      test: {
        id: test.id,
        name: test.name,
        description: test.description,
        status: test.status,
        testType: test.testType,
        startDate: test.startDate,
        endDate: test.endDate,
        trafficPercent: test.trafficPercent,
      },
      variants: variantMetrics,
      dailyData,
    });
  } catch (error) {
    console.error("AB test results error:", error);
    return NextResponse.json(
      { error: "A/B test sonuclari alinamadi" },
      { status: 500 }
    );
  }
}

/**
 * Normal dagilim CDF yaklasimi ile p-value hesapla (iki kuyruklu test).
 * Abramowitz & Stegun yaklasimi kullanilir.
 */
function calculatePValue(z: number): number {
  if (z === 0) return 1;

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const absZ = Math.abs(z);
  const t = 1.0 / (1.0 + p * absZ / Math.SQRT2);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;

  const erf =
    1 -
    (a1 * t + a2 * t2 + a3 * t3 + a4 * t4 + a5 * t5) *
      Math.exp((-absZ * absZ) / 2);

  // Iki kuyruklu p-value
  const oneTailP = (1 - erf) / 2;
  const twoTailP = 2 * oneTailP;

  return Math.round(twoTailP * 10000) / 10000;
}

/**
 * Gunluk conversion trend verisini hesapla.
 */
async function calculateDailyData(
  testId: string,
  variants: Array<{ id: string; name: string }>,
  variantVisitors: Map<string, Set<string>>,
  eventDateFilter: { createdAt?: { gte?: Date; lte?: Date } }
): Promise<DailyDataPoint[]> {
  // Gunluk atamalari getir
  const dailyAssignments = await prisma.aBTestAssignment.findMany({
    where: { testId },
    select: {
      variantId: true,
      visitorId: true,
      assignedAt: true,
    },
    orderBy: { assignedAt: "asc" },
  });

  if (dailyAssignments.length === 0) return [];

  // Tum visitor'larin purchase eventlerini tarih bazinda getir
  const allVisitorIds = new Set<string>();
  for (const visitors of variantVisitors.values()) {
    for (const v of visitors) {
      allVisitorIds.add(v);
    }
  }

  let purchaseEvents: Array<{
    visitorId: string;
    eventData: unknown;
    createdAt: Date;
  }> = [];

  if (allVisitorIds.size > 0) {
    purchaseEvents = await prisma.trackingEvent.findMany({
      where: {
        eventType: "purchase",
        visitorId: { in: Array.from(allVisitorIds) },
        ...eventDateFilter,
      },
      select: {
        visitorId: true,
        eventData: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  // Purchase event'lerini gun+visitor bazinda indexle
  const purchasesByDateVisitor = new Map<string, Set<string>>();
  const revenueByDateVisitor = new Map<string, number>();

  for (const event of purchaseEvents) {
    const dateKey = event.createdAt.toISOString().split("T")[0];
    const key = `${dateKey}:${event.visitorId}`;

    if (!purchasesByDateVisitor.has(dateKey)) {
      purchasesByDateVisitor.set(dateKey, new Set());
    }
    purchasesByDateVisitor.get(dateKey)!.add(event.visitorId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = event.eventData as any;
    if (data && typeof data.total === "number") {
      revenueByDateVisitor.set(
        key,
        (revenueByDateVisitor.get(key) || 0) + data.total
      );
    }
  }

  // Atamalari gun ve varyant bazinda grupla
  const dailyVisitorsByVariant = new Map<string, Set<string>>();

  for (const assignment of dailyAssignments) {
    const dateKey = assignment.assignedAt.toISOString().split("T")[0];
    const groupKey = `${dateKey}:${assignment.variantId}`;

    if (!dailyVisitorsByVariant.has(groupKey)) {
      dailyVisitorsByVariant.set(groupKey, new Set());
    }
    dailyVisitorsByVariant.get(groupKey)!.add(assignment.visitorId);
  }

  // Gunluk veri noktalarini olustur
  const dailyData: DailyDataPoint[] = [];
  const variantMap = new Map(variants.map((v) => [v.id, v.name]));
  const processedDates = new Set<string>();

  for (const assignment of dailyAssignments) {
    const dateKey = assignment.assignedAt.toISOString().split("T")[0];
    if (processedDates.has(dateKey)) continue;
    processedDates.add(dateKey);

    for (const variant of variants) {
      const groupKey = `${dateKey}:${variant.id}`;
      const visitors = dailyVisitorsByVariant.get(groupKey);
      const visitorCount = visitors ? visitors.size : 0;

      // Bu gun ve varyant icin conversion hesapla
      let conversions = 0;
      let revenue = 0;

      if (visitors) {
        const dayPurchasers = purchasesByDateVisitor.get(dateKey);
        if (dayPurchasers) {
          for (const visitorId of visitors) {
            if (dayPurchasers.has(visitorId)) {
              conversions++;
              const revKey = `${dateKey}:${visitorId}`;
              revenue += revenueByDateVisitor.get(revKey) || 0;
            }
          }
        }
      }

      dailyData.push({
        date: dateKey,
        variantId: variant.id,
        variantName: variantMap.get(variant.id) || variant.id,
        visitors: visitorCount,
        conversions,
        revenue: Math.round(revenue * 100) / 100,
      });
    }
  }

  return dailyData;
}
