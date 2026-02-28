import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { cacheDelete } from "@/lib/redis";

// GET - Duyurulari listele (public: aktif olanlari, admin: hepsini)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get("admin") === "true";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (!isAdmin) {
      where.isActive = true;
    }

    const announcements = await prisma.announcement.findMany({ where });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Announcements get error:", error);
    return NextResponse.json({ error: "Duyurular alinamadi" }, { status: 500 });
  }
}

// POST - Yeni duyuru olustur (admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { text, link, bgColor, textColor, isActive, type } = body;

    if (!text) {
      return NextResponse.json({ error: "Duyuru metni zorunlu" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        text,
        link: link || null,
        bgColor: bgColor || "#000000",
        textColor: textColor || "#ffffff",
        isActive: isActive ?? true,
        type: type || "bar",
      },
    });

    // Cache invalidation
    await cacheDelete("announcements:active:bar");

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("Announcement create error:", error);
    return NextResponse.json({ error: "Duyuru olusturulamadi" }, { status: 500 });
  }
}
