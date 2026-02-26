import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Yonlendirmeleri listele (admin)
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
      where.OR = [
        { fromPath: { contains: search, mode: "insensitive" } },
        { toPath: { contains: search, mode: "insensitive" } },
      ];
    }

    const redirects = await prisma.redirect.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ redirects });
  } catch (error) {
    console.error("Redirects get error:", error);
    return NextResponse.json({ error: "Yonlendirmeler alinamadi" }, { status: 500 });
  }
}

// POST - Yeni yonlendirme olustur (admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { fromPath, toPath, type } = body;

    if (!fromPath || !toPath) {
      return NextResponse.json({ error: "Kaynak ve hedef yol zorunlu" }, { status: 400 });
    }

    const existing = await prisma.redirect.findUnique({ where: { fromPath } });
    if (existing) {
      return NextResponse.json({ error: "Bu kaynak yol zaten mevcut" }, { status: 400 });
    }

    const redirect = await prisma.redirect.create({
      data: {
        fromPath,
        toPath,
        type: type ? parseInt(type) : 301,
      },
    });

    return NextResponse.json({ redirect }, { status: 201 });
  } catch (error) {
    console.error("Redirect create error:", error);
    return NextResponse.json({ error: "Yonlendirme olusturulamadi" }, { status: 500 });
  }
}
