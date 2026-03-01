import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/admin/ab-tests — Tum A/B testlerini listele
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [tests, total] = await Promise.all([
      prisma.aBTest.findMany({
        where,
        include: {
          _count: {
            select: {
              variants: true,
              assignments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.aBTest.count({ where }),
    ]);

    return NextResponse.json({
      tests,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("AB test list error:", error);
    return NextResponse.json(
      { error: "A/B testleri alinamadi" },
      { status: 500 }
    );
  }
}

// POST /api/admin/ab-tests — Yeni A/B test olustur
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, testType, targetPage, trafficPercent, variants } =
      body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Test adi zorunludur" },
        { status: 400 }
      );
    }

    if (!testType) {
      return NextResponse.json(
        { error: "Test tipi zorunludur" },
        { status: 400 }
      );
    }

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json(
        { error: "En az bir varyant gereklidir" },
        { status: 400 }
      );
    }

    const test = await prisma.$transaction(async (tx) => {
      const createdTest = await tx.aBTest.create({
        data: {
          name: name.trim(),
          description: description || null,
          testType,
          targetPage: targetPage || null,
          trafficPercent: trafficPercent ?? 100,
          variants: {
            create: variants.map(
              (v: {
                name: string;
                isControl?: boolean;
                config?: unknown;
                trafficWeight?: number;
              }) => ({
                name: v.name,
                isControl: v.isControl ?? false,
                config: v.config ?? {},
                trafficWeight: v.trafficWeight ?? 50,
              })
            ),
          },
        },
        include: {
          variants: true,
        },
      });

      return createdTest;
    });

    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    console.error("AB test create error:", error);
    return NextResponse.json(
      { error: "A/B test olusturulamadi" },
      { status: 500 }
    );
  }
}
