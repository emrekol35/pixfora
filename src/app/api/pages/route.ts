import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import slugify from "slugify";

// GET - Sayfalari listele (admin)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const pages = await prisma.page.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Pages get error:", error);
    return NextResponse.json({ error: "Sayfalar alinamadi" }, { status: 500 });
  }
}

// POST - Yeni sayfa olustur (admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, order, isActive, seoTitle, seoDescription } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Baslik ve icerik zorunlu" }, { status: 400 });
    }

    const slug = slugify(title, { lower: true, strict: true });

    const existing = await prisma.page.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Bu baslikla bir sayfa zaten mevcut" }, { status: 400 });
    }

    const page = await prisma.page.create({
      data: {
        title,
        slug,
        content,
        order: order ? parseInt(order) : 0,
        isActive: isActive ?? true,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
      },
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    console.error("Page create error:", error);
    return NextResponse.json({ error: "Sayfa olusturulamadi" }, { status: 500 });
  }
}
