import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

const FUNNEL_STEPS = [
  { step: "product_view", label: "Urun Goruntulemesi" },
  { step: "add_to_cart", label: "Sepete Ekleme" },
  { step: "view_cart", label: "Sepet Goruntulemesi" },
  { step: "begin_checkout", label: "Odeme Baslangici" },
  { step: "purchase", label: "Satin Alma" },
];

async function getDistinctVisitors(
  eventType: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const result = await prisma.trackingEvent.groupBy({
    by: ["visitorId"],
    where: {
      eventType,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
  return result.length;
}

async function getVisitorsByVariant(
  eventType: string,
  startDate: Date,
  endDate: Date,
  testId: string
): Promise<Record<string, number>> {
  // Get all assignments for this test
  const assignments = await prisma.aBTestAssignment.findMany({
    where: { testId },
    include: {
      variant: {
        select: { id: true, name: true },
      },
    },
  });

  // Group visitor IDs by variant
  const variantVisitors: Record<string, Set<string>> = {};
  const variantNames: Record<string, string> = {};

  for (const assignment of assignments) {
    const variantName = assignment.variant.name;
    variantNames[assignment.variantId] = variantName;
    if (!variantVisitors[variantName]) {
      variantVisitors[variantName] = new Set();
    }
    variantVisitors[variantName].add(assignment.visitorId);
  }

  // For each variant, count distinct visitors who triggered this event
  const result: Record<string, number> = {};

  for (const [variantName, visitorIds] of Object.entries(variantVisitors)) {
    if (visitorIds.size === 0) {
      result[variantName] = 0;
      continue;
    }

    const visitorArray = Array.from(visitorIds);
    const events = await prisma.trackingEvent.groupBy({
      by: ["visitorId"],
      where: {
        eventType,
        visitorId: { in: visitorArray },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    result[variantName] = events.length;
  }

  return result;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const testId = searchParams.get("testId");

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Ensure endDate covers the full day
    endDate.setHours(23, 59, 59, 999);

    // Build funnel data
    const funnel = [];
    let previousVisitors = 0;

    for (let i = 0; i < FUNNEL_STEPS.length; i++) {
      const { step, label } = FUNNEL_STEPS[i];
      const visitors = await getDistinctVisitors(step, startDate, endDate);
      const dropoff =
        i === 0 || previousVisitors === 0
          ? 0
          : Math.round(((previousVisitors - visitors) / previousVisitors) * 100);

      funnel.push({ step, label, visitors, dropoff });
      previousVisitors = visitors;
    }

    // If testId provided, build per-variant funnel
    let byVariant: Record<string, Array<{ step: string; label: string; visitors: number; dropoff: number }>> | undefined;

    if (testId) {
      byVariant = {};

      // First pass: collect all variant names
      const allVariantData: Record<string, Array<{ step: string; label: string; visitors: number; dropoff: number }>> = {};

      for (let i = 0; i < FUNNEL_STEPS.length; i++) {
        const { step, label } = FUNNEL_STEPS[i];
        const variantCounts = await getVisitorsByVariant(step, startDate, endDate, testId);

        for (const [variantName, visitors] of Object.entries(variantCounts)) {
          if (!allVariantData[variantName]) {
            allVariantData[variantName] = [];
          }
          allVariantData[variantName].push({ step, label, visitors, dropoff: 0 });
        }
      }

      // Second pass: calculate drop-offs
      for (const [variantName, steps] of Object.entries(allVariantData)) {
        for (let i = 1; i < steps.length; i++) {
          const prev = steps[i - 1].visitors;
          steps[i].dropoff =
            prev === 0
              ? 0
              : Math.round(((prev - steps[i].visitors) / prev) * 100);
        }
        byVariant[variantName] = steps;
      }
    }

    return NextResponse.json({ funnel, byVariant });
  } catch (error) {
    console.error("Funnel analytics error:", error);
    return NextResponse.json(
      { error: "Huni verileri yuklenemedi" },
      { status: 500 }
    );
  }
}
