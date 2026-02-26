import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const slides = await prisma.slide.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json({ slides });
  } catch (error) {
    console.error("Slides get error:", error);
    return NextResponse.json({ error: "Sliderlar alinamadi" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { title, subtitle, image, link, order, isActive } = body;

    if (!image) {
      return NextResponse.json({ error: "Gorsel URL zorunlu" }, { status: 400 });
    }

    const slide = await prisma.slide.create({
      data: {
        title: title || null,
        subtitle: subtitle || null,
        image,
        link: link || null,
        order: order ? parseInt(order) : 0,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ slide }, { status: 201 });
  } catch (error) {
    console.error("Slide create error:", error);
    return NextResponse.json({ error: "Slider olusturulamadi" }, { status: 500 });
  }
}
