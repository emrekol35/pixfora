import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { cacheDelete } from "@/lib/redis";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const popup = await prisma.popup.findUnique({ where: { id } });
    if (!popup) return NextResponse.json({ error: "Pop-up bulunamadi" }, { status: 404 });
    return NextResponse.json({ popup });
  } catch (error) {
    console.error("Popup get error:", error);
    return NextResponse.json({ error: "Pop-up alinamadi" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { title, content, image, type, isActive, showOnce, delay } = body;

    if (!title || !content) return NextResponse.json({ error: "Baslik ve icerik zorunlu" }, { status: 400 });

    const popup = await prisma.popup.update({
      where: { id },
      data: {
        title, content,
        image: image || null,
        type: type || "general",
        isActive: isActive ?? true,
        showOnce: showOnce ?? true,
        delay: delay !== undefined ? parseInt(delay) : 0,
      },
    });

    await cacheDelete("popups:active");

    return NextResponse.json({ popup });
  } catch (error) {
    console.error("Popup update error:", error);
    return NextResponse.json({ error: "Pop-up guncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

    const { id } = await params;
    await prisma.popup.delete({ where: { id } });
    await cacheDelete("popups:active");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Popup delete error:", error);
    return NextResponse.json({ error: "Pop-up silinemedi" }, { status: 500 });
  }
}
