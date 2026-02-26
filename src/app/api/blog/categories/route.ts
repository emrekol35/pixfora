import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import slugify from "slugify";

// GET - Blog kategorilerini listele
export async function GET() {
  try {
    const categories = await prisma.blogCategory.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { _count: { select: { posts: true } } },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Blog categories get error:", error);
    return NextResponse.json({ error: "Kategoriler alinamadi" }, { status: 500 });
  }
}

// POST - Yeni blog kategorisi olustur (admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { name, order } = body;

    if (!name) {
      return NextResponse.json({ error: "Kategori adi zorunlu" }, { status: 400 });
    }

    const slug = slugify(name, { lower: true, strict: true });

    const existing = await prisma.blogCategory.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Bu isimde bir kategori zaten mevcut" }, { status: 400 });
    }

    const category = await prisma.blogCategory.create({
      data: { name, slug, order: order ? parseInt(order) : 0 },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Blog category create error:", error);
    return NextResponse.json({ error: "Kategori olusturulamadi" }, { status: 500 });
  }
}
