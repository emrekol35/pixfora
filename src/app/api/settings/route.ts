import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";

async function getAdminSession(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });
    return token;
  } catch (error) {
    console.error("[Settings] Token decode error:", error);
    return null;
  }
}

// GET - Ayarlari listele (admin)
export async function GET(request: NextRequest) {
  try {
    const token = await getAdminSession(request);
    if (token?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
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
    const token = await getAdminSession(request);
    console.log("[Settings POST] full token:", JSON.stringify(token));
    if (token?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: "Ayarlar dizisi gerekli" }, { status: 400 });
    }

    console.log("[Settings POST] Kayit sayisi:", settings.length);

    // Bos olmayan ayarlari filtrele — sadece deger girilmis olanlari kaydet
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

    console.log("[Settings POST] Basariyla kaydedildi:", validSettings.length);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings save error:", error);
    return NextResponse.json({ error: "Ayarlar kaydedilemedi" }, { status: 500 });
  }
}
