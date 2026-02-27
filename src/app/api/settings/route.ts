import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";

async function getAdminCheck(request: NextRequest): Promise<{ isAdmin: boolean; debug: string }> {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });

    if (!token) {
      const cookieHeader = request.headers.get("cookie") || "";
      const cookieNames = cookieHeader.split(";").map(c => c.trim().split("=")[0]).filter(Boolean);
      return { isAdmin: false, debug: `token=null, cookies=[${cookieNames.join(",")}]` };
    }

    // JWT'de role varsa dogrudan kontrol
    if (token.role === "ADMIN") {
      return { isAdmin: true, debug: "role_from_jwt" };
    }

    // JWT'de role yoksa DB'den kontrol
    if (token.email) {
      const user = await prisma.user.findUnique({
        where: { email: token.email as string },
        select: { role: true },
      });
      if (user?.role === "ADMIN") return { isAdmin: true, debug: "role_from_db_email" };
      return { isAdmin: false, debug: `email=${token.email}, db_role=${user?.role || "NOT_FOUND"}` };
    }

    if (token.id || token.sub) {
      const userId = (token.id || token.sub) as string;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user?.role === "ADMIN") return { isAdmin: true, debug: "role_from_db_id" };
      return { isAdmin: false, debug: `id=${userId}, db_role=${user?.role || "NOT_FOUND"}` };
    }

    return { isAdmin: false, debug: `token_keys=[${Object.keys(token).join(",")}]` };
  } catch (error) {
    return { isAdmin: false, debug: `error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// GET - Ayarlari listele (admin)
export async function GET(request: NextRequest) {
  try {
    const { isAdmin } = await getAdminCheck(request);
    if (!isAdmin) {
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
    const { isAdmin, debug } = await getAdminCheck(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: `Yetkisiz [${debug}]` },
        { status: 403, headers: { "Cache-Control": "no-store" } }
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
