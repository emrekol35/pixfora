import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/** PUT — Yerel marka ↔ Trendyol marka eşleştir */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { mappings } = body as {
      mappings: { trendyolBrandId: number; localBrandId: string | null }[];
    };

    if (!mappings || !Array.isArray(mappings)) {
      return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
    }

    let updated = 0;
    for (const m of mappings) {
      await prisma.trendyolBrand.update({
        where: { id: m.trendyolBrandId },
        data: { localBrandId: m.localBrandId },
      });
      updated++;
    }

    return NextResponse.json({ success: true, message: `${updated} eşleştirme güncellendi` });
  } catch (error) {
    console.error("Marka eşleştirme hatası:", error);
    return NextResponse.json({ error: "Eşleştirme güncellenemedi" }, { status: 500 });
  }
}

/** POST — Otomatik eşleştir (isim benzerliğine göre) */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const unmapped = await prisma.trendyolBrand.findMany({ where: { localBrandId: null } });
    const localBrands = await prisma.brand.findMany({ select: { id: true, name: true } });
    const localBrandMap = new Map(localBrands.map((b) => [b.name.toLowerCase().trim(), b.id]));

    let matched = 0;
    for (const tBrand of unmapped) {
      const localId = localBrandMap.get(tBrand.name.toLowerCase().trim());
      if (localId) {
        await prisma.trendyolBrand.update({ where: { id: tBrand.id }, data: { localBrandId: localId } });
        matched++;
      }
    }

    return NextResponse.json({ success: true, message: `${matched} marka otomatik eşleştirildi`, matched, total: unmapped.length });
  } catch (error) {
    console.error("Otomatik marka eşleştirme hatası:", error);
    return NextResponse.json({ error: "Otomatik eşleştirme başarısız" }, { status: 500 });
  }
}
