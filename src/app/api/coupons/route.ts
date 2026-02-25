import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Kuponlari listele (admin)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (search) {
      where.code = { contains: search, mode: "insensitive" };
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { orders: true } } },
        take: limit,
        skip,
      }),
      prisma.coupon.count({ where }),
    ]);

    return NextResponse.json({ coupons, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Coupons get error:", error);
    return NextResponse.json({ error: "Kuponlar alinamadi" }, { status: 500 });
  }
}

// POST - Yeni kupon olustur (admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { code, type, value, minOrder, maxDiscount, maxUses, isActive, startsAt, expiresAt } = body;

    if (!code || !type || value === undefined) {
      return NextResponse.json({ error: "Kupon kodu, tip ve deger zorunlu" }, { status: 400 });
    }

    const upperCode = code.toUpperCase().trim();

    const existing = await prisma.coupon.findUnique({ where: { code: upperCode } });
    if (existing) {
      return NextResponse.json({ error: "Bu kupon kodu zaten mevcut" }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: upperCode,
        type,
        value: parseFloat(value),
        minOrder: minOrder ? parseFloat(minOrder) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        isActive: isActive ?? true,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    console.error("Coupon create error:", error);
    return NextResponse.json({ error: "Kupon olusturulamadi" }, { status: 500 });
  }
}
