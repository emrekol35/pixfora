import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import slugify from "slugify";

// GET - Blog yazilarini listele
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const isAdmin = searchParams.get("admin") === "true";
    const categorySlug = searchParams.get("category") || "";
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (!isAdmin) {
      where.isActive = true;
    }

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { category: { select: { name: true, slug: true } } },
        take: limit,
        skip,
      }),
      prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Blog posts get error:", error);
    return NextResponse.json({ error: "Yazilar alinamadi" }, { status: 500 });
  }
}

// POST - Yeni blog yazisi olustur (admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, excerpt, image, categoryId, isActive, seoTitle, seoDescription } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Baslik ve icerik zorunlu" }, { status: 400 });
    }

    const slug = slugify(title, { lower: true, strict: true });

    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Bu baslikla bir yazi zaten mevcut" }, { status: 400 });
    }

    const post = await prisma.blogPost.create({
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

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Blog post create error:", error);
    return NextResponse.json({ error: "Yazi olusturulamadi" }, { status: 500 });
  }
}
