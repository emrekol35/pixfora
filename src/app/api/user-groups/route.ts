import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const groups = await prisma.userGroup.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { users: true } } },
    });

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("User groups get error:", error);
    return NextResponse.json({ error: "Gruplar alinamadi" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { name, discountPercent } = body;

    if (!name) {
      return NextResponse.json({ error: "Grup adi zorunlu" }, { status: 400 });
    }

    const group = await prisma.userGroup.create({
      data: {
        name,
        discountPercent: discountPercent ? parseFloat(discountPercent) : 0,
      },
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error("User group create error:", error);
    return NextResponse.json({ error: "Grup olusturulamadi" }, { status: 500 });
  }
}
