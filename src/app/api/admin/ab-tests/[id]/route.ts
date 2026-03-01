import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { invalidateExperimentCache } from "@/lib/experiments";

// GET /api/admin/ab-tests/[id] — Tek A/B test detayi
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

    const test = await prisma.aBTest.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            _count: {
              select: { assignments: true },
            },
          },
        },
        _count: {
          select: { assignments: true },
        },
      },
    });

    if (!test) {
      return NextResponse.json(
        { error: "A/B test bulunamadi" },
        { status: 404 }
      );
    }

    // Unique visitor sayisini al
    const uniqueVisitors = await prisma.aBTestAssignment.groupBy({
      by: ["visitorId"],
      where: { testId: id },
    });

    return NextResponse.json({
      ...test,
      uniqueVisitors: uniqueVisitors.length,
    });
  } catch (error) {
    console.error("AB test detail error:", error);
    return NextResponse.json(
      { error: "A/B test detayi alinamadi" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/ab-tests/[id] — A/B test guncelle
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      name,
      description,
      testType,
      targetPage,
      trafficPercent,
      status,
      startDate,
      endDate,
      variants,
    } = body;

    // Mevcut testi kontrol et
    const existingTest = await prisma.aBTest.findUnique({
      where: { id },
    });

    if (!existingTest) {
      return NextResponse.json(
        { error: "A/B test bulunamadi" },
        { status: 404 }
      );
    }

    // Guncelleme verilerini hazirla
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (testType !== undefined) updateData.testType = testType;
    if (targetPage !== undefined) updateData.targetPage = targetPage;
    if (trafficPercent !== undefined) updateData.trafficPercent = trafficPercent;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);

    // Status degisikligi kontrolleri
    if (status !== undefined) {
      updateData.status = status;

      if (status === "RUNNING" && !existingTest.startDate && !startDate) {
        updateData.startDate = new Date();
      }

      if (status === "COMPLETED" && !existingTest.endDate && !endDate) {
        updateData.endDate = new Date();
      }
    }

    let updatedTest;

    if (variants && Array.isArray(variants) && variants.length > 0) {
      // Varyantlar degisiyorsa transaction kullan
      updatedTest = await prisma.$transaction(async (tx) => {
        // Eski varyantlari sil
        await tx.aBTestVariant.deleteMany({
          where: { testId: id },
        });

        // Test + yeni varyantlari olustur
        const result = await tx.aBTest.update({
          where: { id },
          data: {
            ...updateData,
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

        return result;
      });
    } else {
      // Sadece test bilgilerini guncelle
      updatedTest = await prisma.aBTest.update({
        where: { id },
        data: updateData,
        include: {
          variants: true,
        },
      });
    }

    // Status degistiyse experiment cache'ini temizle
    if (status !== undefined && status !== existingTest.status) {
      await invalidateExperimentCache();
    }

    return NextResponse.json(updatedTest);
  } catch (error) {
    console.error("AB test update error:", error);
    return NextResponse.json(
      { error: "A/B test guncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/ab-tests/[id] — A/B test sil (sadece DRAFT durumunda)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { id } = await params;

    const test = await prisma.aBTest.findUnique({
      where: { id },
    });

    if (!test) {
      return NextResponse.json(
        { error: "A/B test bulunamadi" },
        { status: 404 }
      );
    }

    if (test.status !== "DRAFT") {
      return NextResponse.json(
        {
          error:
            "Sadece DRAFT durumundaki testler silinebilir. Once testi durdurun veya tamamlayin.",
        },
        { status: 400 }
      );
    }

    // Cascade delete: variants ve assignments otomatik silinecek (schema'da onDelete: Cascade)
    await prisma.aBTest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("AB test delete error:", error);
    return NextResponse.json(
      { error: "A/B test silinemedi" },
      { status: 500 }
    );
  }
}
