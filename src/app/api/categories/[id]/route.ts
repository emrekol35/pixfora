import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true } },
        children: { orderBy: { order: "asc" } },
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Kategori bulunamadi." },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch {
    return NextResponse.json(
      { error: "Kategori yuklenirken hata olustu." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Kategori bulunamadi." },
        { status: 404 }
      );
    }

    let slug = existing.slug;
    if (name && name !== existing.name) {
      slug = generateSlug(name);
      const slugExists = await prisma.category.findFirst({
        where: { slug, id: { not: id } },
      });
      if (slugExists) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        slug,
        description,
        image,
        parentId: parentId === undefined ? existing.parentId : parentId,
        order: order ?? existing.order,
        isActive: isActive ?? existing.isActive,
        seoTitle,
        seoDescription,
        seoKeywords,
      },
    });

    return NextResponse.json(category);
  } catch {
    return NextResponse.json(
      { error: "Kategori guncellenirken hata olustu." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const childCount = await prisma.category.count({
      where: { parentId: id },
    });
    if (childCount > 0) {
      return NextResponse.json(
        { error: "Alt kategorileri olan bir kategori silinemez." },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ message: "Kategori silindi." });
  } catch {
    return NextResponse.json(
      { error: "Kategori silinirken hata olustu." },
      { status: 500 }
    );
  }
}
