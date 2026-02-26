import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const popups = await prisma.popup.findMany({ orderBy: { title: "asc" } });
    return NextResponse.json({ popups });
  } catch (error) {
    console.error("Popups get error:", error);
    return NextResponse.json({ error: "Pop-uplar alinamadi" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

    const body = await request.json();
    const { title, content, image, type, isActive, showOnce, delay } = body;

    if (!title || !content) return NextResponse.json({ error: "Baslik ve icerik zorunlu" }, { status: 400 });

    const popup = await prisma.popup.create({
      data: {
        title, content,
        image: image || null,
        type: type || "general",
        isActive: isActive ?? true,
        showOnce: showOnce ?? true,
        delay: delay ? parseInt(delay) : 0,
      },
    });

    return NextResponse.json({ popup }, { status: 201 });
  } catch (error) {
    console.error("Popup create error:", error);
    return NextResponse.json({ error: "Pop-up olusturulamadi" }, { status: 500 });
  }
}
