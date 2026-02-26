import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const menu = await prisma.menu.findUnique({ where: { id } });
    if (!menu) return NextResponse.json({ error: "Menu bulunamadi" }, { status: 404 });
    return NextResponse.json({ menu });
  } catch (error) {
    console.error("Menu get error:", error);
    return NextResponse.json({ error: "Menu alinamadi" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { name, items, location } = body;

    if (!name) return NextResponse.json({ error: "Menu adi zorunlu" }, { status: 400 });

    const existing = await prisma.menu.findFirst({ where: { name, id: { not: id } } });
    if (existing) return NextResponse.json({ error: "Bu isimde bir menu zaten mevcut" }, { status: 400 });

    const menu = await prisma.menu.update({
      where: { id },
      data: {
        name,
        items: (items || []) satisfies Prisma.InputJsonValue,
        location: location || "header",
      },
    });

    return NextResponse.json({ menu });
  } catch (error) {
    console.error("Menu update error:", error);
    return NextResponse.json({ error: "Menu guncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

    const { id } = await params;
    await prisma.menu.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Menu delete error:", error);
    return NextResponse.json({ error: "Menu silinemedi" }, { status: 500 });
  }
}
