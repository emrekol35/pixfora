import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Kampanyalari listele (admin)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.campaign.count(),
    ]);

    return NextResponse.json({ campaigns, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Campaigns get error:", error);
    return NextResponse.json({ error: "Kampanyalar alinamadi" }, { status: 500 });
  }
}

// POST - Yeni kampanya olustur (admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { name, type, value, conditions, isActive, startsAt, expiresAt } = body;

    if (!name || !type || value === undefined) {
      return NextResponse.json({ error: "Ad, tip ve deger zorunlu" }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        type,
        value: parseFloat(value),
        conditions: conditions ? (conditions as Prisma.InputJsonValue) : undefined,
        isActive: isActive ?? true,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error("Campaign create error:", error);
    return NextResponse.json({ error: "Kampanya olusturulamadi" }, { status: 500 });
  }
}
