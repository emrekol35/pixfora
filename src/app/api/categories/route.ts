import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");
    const flat = searchParams.get("flat") === "true";

    if (flat) {
      const categories = await prisma.category.findMany({
        orderBy: [{ order: "asc" }, { name: "asc" }],
        include: { parent: { select: { id: true, name: true } } },
      });
      return NextResponse.json(categories);
    }

    const categories = await prisma.category.findMany({
      where: { parentId: parentId || null },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        children: {
          orderBy: [{ order: "asc" }, { name: "asc" }],
          include: {
            children: {
              orderBy: [{ order: "asc" }, { name: "asc" }],
            },
          },
        },
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json(categories);
  } catch {
    return NextResponse.json(
      { error: "Kategoriler yuklenirken hata olustu." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      image,
      parentId,
      order,
      isActive,
      seoTitle,
      seoDescription,
      seoKeywords,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Kategori adi zorunludur." },
        { status: 400 }
      );
    }

    let slug = generateSlug(name);
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        image,
        parentId: parentId || null,
        order: order || 0,
        isActive: isActive ?? true,
        seoTitle,
        seoDescription,
        seoKeywords,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Kategori olusturulurken hata olustu." },
      { status: 500 }
    );
  }
}
