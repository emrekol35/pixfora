import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import slugify from "slugify";

// GET - Tek blog yazisi getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Yazi bulunamadi" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Blog post get error:", error);
    return NextResponse.json({ error: "Yazi alinamadi" }, { status: 500 });
  }
}

// PUT - Blog yazisi guncelle (admin)
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
    const { title, content, excerpt, image, categoryId, isActive, seoTitle, seoDescription } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Baslik ve icerik zorunlu" }, { status: 400 });
    }

    const slug = slugify(title, { lower: true, strict: true });

    const existing = await prisma.blogPost.findFirst({
      where: { slug, id: { not: id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Bu baslikla bir yazi zaten mevcut" }, { status: 400 });
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        image: image || null,
        categoryId: categoryId || null,
        isActive: isActive ?? true,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Blog post update error:", error);
    return NextResponse.json({ error: "Yazi guncellenemedi" }, { status: 500 });
  }
}

// DELETE - Blog yazisi sil (admin)
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
    await prisma.blogPost.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Blog post delete error:", error);
    return NextResponse.json({ error: "Yazi silinemedi" }, { status: 500 });
  }
}
