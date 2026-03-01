import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getTrendyolClient, getBrands } from "@/services/marketplace/trendyol";

/** GET — Trendyol markalarını listele */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const mappedOnly = searchParams.get("mappedOnly") === "true";
    const page = parseInt(searchParams.get("page") || "0");
    const size = parseInt(searchParams.get("size") || "50");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (mappedOnly) where.localBrandId = { not: null };

    const [brands, total] = await Promise.all([
      prisma.trendyolBrand.findMany({
        where,
        include: { localBrand: { select: { id: true, name: true, slug: true } } },
        orderBy: { name: "asc" },
        skip: page * size,
        take: size,
      }),
      prisma.trendyolBrand.count({ where }),
    ]);

    const mapped = await prisma.trendyolBrand.count({ where: { localBrandId: { not: null } } });

    return NextResponse.json({ brands, total, mapped, page, size });
  } catch (error) {
    console.error("Trendyol marka listesi hatası:", error);
    return NextResponse.json({ error: "Markalar yüklenemedi" }, { status: 500 });
  }
}

/** POST — Trendyol'dan markaları çek ve DB'ye kaydet (ilk 5 sayfa = ~5000 marka) */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const client = await getTrendyolClient();

    const existingMappings = await prisma.trendyolBrand.findMany({
      where: { localBrandId: { not: null } },
      select: { id: true, localBrandId: true },
    });
    const mappingMap = new Map(existingMappings.map((m) => [m.id, m.localBrandId]));

    // Trendyol tüm global markaları döndürür (100.000+), sadece ilk 5 sayfa çekilir
    const MAX_PAGES = 5;
    let allBrands: { id: number; name: string }[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const brands = await getBrands(client, page, 1000);
      if (brands.length === 0) break;
      allBrands = allBrands.concat(brands);
    }

    // Toplu upsert — 500'lük batch'ler halinde
    let upserted = 0;
    const BATCH_SIZE = 500;
    for (let i = 0; i < allBrands.length; i += BATCH_SIZE) {
      const batch = allBrands.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((brand) =>
          prisma.trendyolBrand.upsert({
            where: { id: brand.id },
            create: { id: brand.id, name: brand.name, localBrandId: mappingMap.get(brand.id) || null },
            update: { name: brand.name },
          })
        )
      );
      upserted += batch.length;
    }

    return NextResponse.json({ success: true, message: `${upserted} marka senkronize edildi`, total: upserted });
  } catch (error) {
    console.error("Trendyol marka sync hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Marka senkronizasyonu başarısız" },
      { status: 500 }
    );
  }
}
