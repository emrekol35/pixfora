import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const folder = searchParams.get("folder") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "40");
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (search) {
      where.filename = { contains: search, mode: "insensitive" };
    }
    if (folder) {
      where.folder = folder;
    }

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.media.count({ where }),
    ]);

    return NextResponse.json({ media, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Media get error:", error);
    return NextResponse.json({ error: "Medya alinamadi" }, { status: 500 });
  }
}
