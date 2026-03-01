import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/** PUT — Yerel kategori ↔ Trendyol kategori eşleştir */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { mappings } = body as {
      mappings: { trendyolCategoryId: number; localCategoryId: string | null }[];
    };

    if (!mappings || !Array.isArray(mappings)) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }

    let updated = 0;
    for (const m of mappings) {
      await prisma.trendyolCategory.update({
        where: { id: m.trendyolCategoryId },
        data: { localCategoryId: m.localCategoryId },
      });
      updated++;
    }

    return NextResponse.json({ success: true, message: `${updated} eşleştirme güncellendi` });
  } catch (error) {
    console.error("Kategori eşleştirme hatası:", error);
    return NextResponse.json({ error: "Eşleştirme güncellenemedi" }, { status: 500 });
  }
}
