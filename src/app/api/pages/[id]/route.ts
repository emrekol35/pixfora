import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import slugify from "slugify";

// GET - Tek sayfa getir (admin)
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
    const page = await prisma.page.findUnique({ where: { id } });

    if (!page) {
      return NextResponse.json({ error: "Sayfa bulunamadi" }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error("Page get error:", error);
    return NextResponse.json({ error: "Sayfa alinamadi" }, { status: 500 });
  }
}

// PUT - Sayfa guncelle (admin)
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
    const { title, content, order, isActive, seoTitle, seoDescription } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Baslik ve icerik zorunlu" }, { status: 400 });
    }

    const slug = slugify(title, { lower: true, strict: true });

    const existing = await prisma.page.findFirst({
      where: { slug, id: { not: id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Bu baslikla bir sayfa zaten mevcut" }, { status: 400 });
    }

    const page = await prisma.page.update({
      where: { id },
      data: {
        title,
        slug,
        content,
        order: order !== undefined ? parseInt(order) : 0,
        isActive: isActive ?? true,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
      },
    });

    return NextResponse.json({ page });
  } catch (error) {
    console.error("Page update error:", error);
    return NextResponse.json({ error: "Sayfa guncellenemedi" }, { status: 500 });
  }
}

// DELETE - Sayfa sil (admin)
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
    await prisma.page.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Page delete error:", error);
    return NextResponse.json({ error: "Sayfa silinemedi" }, { status: 500 });
  }
}
