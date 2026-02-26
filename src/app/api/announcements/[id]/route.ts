import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Tek duyuru getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const announcement = await prisma.announcement.findUnique({ where: { id } });

    if (!announcement) {
      return NextResponse.json({ error: "Duyuru bulunamadi" }, { status: 404 });
    }

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error("Announcement get error:", error);
    return NextResponse.json({ error: "Duyuru alinamadi" }, { status: 500 });
  }
}

// PUT - Duyuru guncelle (admin)
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
    const { text, link, bgColor, textColor, isActive, type } = body;

    if (!text) {
      return NextResponse.json({ error: "Duyuru metni zorunlu" }, { status: 400 });
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        text,
        link: link || null,
        bgColor: bgColor || "#000000",
        textColor: textColor || "#ffffff",
        isActive: isActive ?? true,
        type: type || "bar",
      },
    });

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error("Announcement update error:", error);
    return NextResponse.json({ error: "Duyuru guncellenemedi" }, { status: 500 });
  }
}

// DELETE - Duyuru sil (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.announcement.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Announcement delete error:", error);
    return NextResponse.json({ error: "Duyuru silinemedi" }, { status: 500 });
  }
}
