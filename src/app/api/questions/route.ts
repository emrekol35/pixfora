import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Admin: Tum soruları listele
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (status === "pending") {
      where.isPublished = false;
      where.answer = null;
    } else if (status === "answered") {
      where.answer = { not: null };
    } else if (status === "published") {
      where.isPublished = true;
    }

    const [questions, total] = await Promise.all([
      prisma.productQuestion.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          product: {
            select: {
              name: true,
              slug: true,
              images: { take: 1, select: { url: true } },
            },
          },
          answeredBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.productQuestion.count({ where }),
    ]);

    return NextResponse.json({ questions, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Admin questions GET error:", error);
    return NextResponse.json({ error: "Sorular alinamadi" }, { status: 500 });
  }
}
