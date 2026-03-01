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

/** POST — Trendyol'dan tek sayfa marka çek ve DB'ye kaydet (kademeli sync) */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const syncPage = parseInt(searchParams.get("syncPage") || "0");

    const client = await getTrendyolClient();

    // Mevcut mapping'leri koru
    const existingMappings = await prisma.trendyolBrand.findMany({
      where: { localBrandId: { not: null } },
      select: { id: true, localBrandId: true },
    });
    const mappingMap = new Map(existingMappings.map((m) => [m.id, m.localBrandId]));

    // Trendyol'dan tek sayfa çek
    const brands = await getBrands(client, syncPage, 1000);
    const hasMore = brands.length === 1000;

    // Toplu upsert — transaction ile
    if (brands.length > 0) {
      await prisma.$transaction(
        brands.map((brand) =>
          prisma.trendyolBrand.upsert({
            where: { id: brand.id },
            create: { id: brand.id, name: brand.name, localBrandId: mappingMap.get(brand.id) || null },
            update: { name: brand.name },
          })
        )
      );
    }

    const totalInDb = await prisma.trendyolBrand.count();

    return NextResponse.json({
      success: true,
      synced: brands.length,
      hasMore,
      nextPage: hasMore ? syncPage + 1 : null,
      totalInDb,
      message: hasMore
        ? `Sayfa ${syncPage + 1}: ${brands.length} marka eklendi (toplam: ${totalInDb})`
        : `Tamamlandı! Toplam ${totalInDb} marka senkronize edildi`,
    });
  } catch (error) {
    console.error("Trendyol marka sync hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Marka senkronizasyonu başarısız" },
      { status: 500 }
    );
  }
}
