import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { auth } from "@/lib/auth";

// GET - Ayarlari listele (admin)
export async function GET() {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      // Debug bilgisi
      const session = await auth();
      console.log("[SETTINGS GET] Yetkisiz - session:", !!session, "email:", session?.user?.email, "role:", (session?.user as { role?: string })?.role);
      return NextResponse.json(
        {
          error: "Yetkisiz",
          debug: {
            hasSession: !!session,
            email: session?.user?.email || null,
            role: (session?.user as { role?: string })?.role || null,
          },
        },
        { status: 403 }
      );
    }

    const settings = await prisma.setting.findMany({ orderBy: { key: "asc" } });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Settings get error:", error);
    return NextResponse.json({ error: "Ayarlar alinamadi" }, { status: 500 });
  }
}

// POST - Ayarlari toplu kaydet (admin)
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      // Debug bilgisi
      const session = await auth();
      console.log("[SETTINGS POST] Yetkisiz - session:", !!session, "email:", session?.user?.email, "role:", (session?.user as { role?: string })?.role);
      return NextResponse.json(
        {
          error: "Yetkisiz",
          debug: {
            hasSession: !!session,
            email: session?.user?.email || null,
            role: (session?.user as { role?: string })?.role || null,
          },
        },
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
