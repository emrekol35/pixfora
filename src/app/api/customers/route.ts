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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { role: "CUSTOMER" };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          group: true,
          _count: { select: { orders: true } },
        },
        take: limit,
        skip,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ customers, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Customers get error:", error);
    return NextResponse.json({ error: "Musteriler alinamadi" }, { status: 500 });
  }
}
