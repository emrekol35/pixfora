import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!brand) {
      return NextResponse.json({ error: "Marka bulunamadi." }, { status: 404 });
    }

    return NextResponse.json(brand);
  } catch {
    return NextResponse.json({ error: "Marka yuklenirken hata olustu." }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, logo, order, isActive, seoTitle, seoDescription, seoKeywords } = body;

    const existing = await prisma.brand.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Marka bulunamadi." }, { status: 404 });
    }

    let slug = existing.slug;
    if (name && name !== existing.name) {
      slug = generateSlug(name);
      const slugExists = await prisma.brand.findFirst({
        where: { slug, id: { not: id } },
      });
      if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;
    }

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        slug,
        description,
        logo,
        order: order ?? existing.order,
        isActive: isActive ?? existing.isActive,
        seoTitle,
        seoDescription,
        seoKeywords,
      },
    });

    return NextResponse.json(brand);
  } catch {
    return NextResponse.json({ error: "Marka guncellenirken hata olustu." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.brand.delete({ where: { id } });
    return NextResponse.json({ message: "Marka silindi." });
  } catch {
    return NextResponse.json({ error: "Marka silinirken hata olustu." }, { status: 500 });
  }
}
