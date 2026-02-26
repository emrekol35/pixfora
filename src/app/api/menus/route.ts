import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (location) where.location = location;

    const menus = await prisma.menu.findMany({ where, orderBy: { name: "asc" } });
    return NextResponse.json({ menus });
  } catch (error) {
    console.error("Menus get error:", error);
    return NextResponse.json({ error: "Menuler alinamadi" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

    const body = await request.json();
    const { name, items, location } = body;

    if (!name) return NextResponse.json({ error: "Menu adi zorunlu" }, { status: 400 });

    const existing = await prisma.menu.findUnique({ where: { name } });
    if (existing) return NextResponse.json({ error: "Bu isimde bir menu zaten mevcut" }, { status: 400 });

    const menu = await prisma.menu.create({
      data: {
        name,
        items: (items || []) satisfies Prisma.InputJsonValue,
        location: location || "header",
      },
    });

    return NextResponse.json({ menu }, { status: 201 });
  } catch (error) {
    console.error("Menu create error:", error);
    return NextResponse.json({ error: "Menu olusturulamadi" }, { status: 500 });
  }
}
