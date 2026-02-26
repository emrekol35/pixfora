import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import slugify from "slugify";

// PUT - Blog kategorisi guncelle (admin)
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
    const { name, order } = body;

    if (!name) {
      return NextResponse.json({ error: "Kategori adi zorunlu" }, { status: 400 });
    }

    const slug = slugify(name, { lower: true, strict: true });

    const existing = await prisma.blogCategory.findFirst({
      where: { slug, id: { not: id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Bu isimde bir kategori zaten mevcut" }, { status: 400 });
    }

    const category = await prisma.blogCategory.update({
      where: { id },
      data: { name, slug, order: order !== undefined ? parseInt(order) : 0 },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Blog category update error:", error);
    return NextResponse.json({ error: "Kategori guncellenemedi" }, { status: 500 });
  }
}

// DELETE - Blog kategorisi sil (admin)
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

    const postCount = await prisma.blogPost.count({ where: { categoryId: id } });
    if (postCount > 0) {
      return NextResponse.json(
        { error: `Bu kategoride ${postCount} yazi var. Once yazilari baska kategoriye tasiyin.` },
        { status: 400 }
      );
    }

    await prisma.blogCategory.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Blog category delete error:", error);
    return NextResponse.json({ error: "Kategori silinemedi" }, { status: 500 });
  }
}
