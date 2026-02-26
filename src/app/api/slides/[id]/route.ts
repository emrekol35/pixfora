import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const slide = await prisma.slide.findUnique({ where: { id } });
    if (!slide) return NextResponse.json({ error: "Slider bulunamadi" }, { status: 404 });
    return NextResponse.json({ slide });
  } catch (error) {
    console.error("Slide get error:", error);
    return NextResponse.json({ error: "Slider alinamadi" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { title, subtitle, image, link, order, isActive } = body;

    if (!image) return NextResponse.json({ error: "Gorsel URL zorunlu" }, { status: 400 });

    const slide = await prisma.slide.update({
      where: { id },
      data: {
        title: title || null,
        subtitle: subtitle || null,
        image,
        link: link || null,
        order: order !== undefined ? parseInt(order) : 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ slide });
  } catch (error) {
    console.error("Slide update error:", error);
    return NextResponse.json({ error: "Slider guncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

    const { id } = await params;
    await prisma.slide.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Slide delete error:", error);
    return NextResponse.json({ error: "Slider silinemedi" }, { status: 500 });
  }
}
