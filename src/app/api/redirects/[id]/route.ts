import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Tek yonlendirme getir (admin)
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
    const redirect = await prisma.redirect.findUnique({ where: { id } });

    if (!redirect) {
      return NextResponse.json({ error: "Yonlendirme bulunamadi" }, { status: 404 });
    }

    return NextResponse.json({ redirect });
  } catch (error) {
    console.error("Redirect get error:", error);
    return NextResponse.json({ error: "Yonlendirme alinamadi" }, { status: 500 });
  }
}

// PUT - Yonlendirme guncelle (admin)
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
    const { fromPath, toPath, type } = body;

    if (!fromPath || !toPath) {
      return NextResponse.json({ error: "Kaynak ve hedef yol zorunlu" }, { status: 400 });
    }

    const existing = await prisma.redirect.findFirst({
      where: { fromPath, id: { not: id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Bu kaynak yol baska bir yonlendirmede kullaniliyor" }, { status: 400 });
    }

    const redirect = await prisma.redirect.update({
      where: { id },
      data: {
        fromPath,
        toPath,
        type: type ? parseInt(type) : 301,
      },
    });

    return NextResponse.json({ redirect });
  } catch (error) {
    console.error("Redirect update error:", error);
    return NextResponse.json({ error: "Yonlendirme guncellenemedi" }, { status: 500 });
  }
}

// DELETE - Yonlendirme sil (admin)
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
    await prisma.redirect.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Redirect delete error:", error);
    return NextResponse.json({ error: "Yonlendirme silinemedi" }, { status: 500 });
  }
}
