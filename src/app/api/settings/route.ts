import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { getToken } from "next-auth/jwt";

// GET - Ayarlari listele (admin)
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await requireAdmin(request);
    if (!isAdmin) {
      // Debug bilgisi
      const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
      const cookieNames = Array.from(request.cookies.getAll()).map((c) => c.name);
      console.log("[SETTINGS GET] Yetkisiz - token:", !!token, "email:", token?.email, "role:", token?.role, "cookies:", cookieNames.join(","));
      return NextResponse.json(
        { error: "Yetkisiz", debug: { hasToken: !!token, email: token?.email || null, role: token?.role || null, cookies: cookieNames } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const group = searchParams.get("group");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (group) {
      where.group = group;
    }

    const settings = await prisma.setting.findMany({ where, orderBy: { key: "asc" } });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Settings get error:", error);
    return NextResponse.json({ error: "Ayarlar alinamadi" }, { status: 500 });
  }
}

// POST - Ayarlari toplu kaydet (admin)
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await requireAdmin(request);
    if (!isAdmin) {
      // Debug bilgisi
      const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
      const cookieNames = Array.from(request.cookies.getAll()).map((c) => c.name);
      console.log("[SETTINGS POST] Yetkisiz - token:", !!token, "email:", token?.email, "role:", token?.role, "cookies:", cookieNames.join(","));
      return NextResponse.json(
        { error: "Yetkisiz", debug: { hasToken: !!token, email: token?.email || null, role: token?.role || null, cookies: cookieNames } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: "Ayarlar dizisi gerekli" }, { status: 400 });
    }

    const validSettings = settings.filter(
      (s: { key: string; value: string }) => s.value !== undefined && s.value !== null
    );

    await prisma.$transaction(
      validSettings.map((s: { key: string; value: string; group: string }) =>
        prisma.setting.upsert({
          where: { key: s.key },
          update: { value: s.value, group: s.group },
          create: { key: s.key, value: s.value, group: s.group },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings save error:", error);
    return NextResponse.json({ error: "Ayarlar kaydedilemedi" }, { status: 500 });
  }
}
