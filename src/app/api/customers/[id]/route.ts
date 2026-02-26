import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { id } = await params;
    const customer = await prisma.user.findUnique({
      where: { id },
      include: {
        group: true,
        addresses: true,
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { items: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Musteri bulunamadi" }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Customer get error:", error);
    return NextResponse.json({ error: "Musteri alinamadi" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { groupId, isBlacklisted } = body;

    const customer = await prisma.user.update({
      where: { id },
      data: {
        groupId: groupId || null,
        isBlacklisted: isBlacklisted ?? false,
      },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Customer update error:", error);
    return NextResponse.json({ error: "Musteri guncellenemedi" }, { status: 500 });
  }
}
