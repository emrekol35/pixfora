import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/utils";

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    });
    return NextResponse.json(brands);
  } catch {
    return NextResponse.json(
      { error: "Markalar yuklenirken hata olustu." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, logo, order, isActive, seoTitle, seoDescription, seoKeywords } = body;

    if (!name) {
      return NextResponse.json({ error: "Marka adi zorunludur." }, { status: 400 });
    }

    let slug = generateSlug(name);
    const existing = await prisma.brand.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        slug,
        description,
        logo,
        order: order || 0,
        isActive: isActive ?? true,
        seoTitle,
        seoDescription,
        seoKeywords,
      },
    });

    return NextResponse.json(brand, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Marka olusturulurken hata olustu." },
      { status: 500 }
    );
  }
}
