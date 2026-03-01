import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  getTrendyolClient,
  getCategoryTree,
  flattenCategoryTree,
} from "@/services/marketplace/trendyol";

/** GET — Trendyol kategorilerini listele (yerel DB) */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const mappedOnly = searchParams.get("mappedOnly") === "true";
    const parentId = searchParams.get("parentId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { path: { contains: search, mode: "insensitive" } },
      ];
    }
    if (mappedOnly) where.localCategoryId = { not: null };
    if (parentId) {
      where.parentId = parseInt(parentId);
    } else if (!search) {
      where.parentId = null;
    }

    const categories = await prisma.trendyolCategory.findMany({
      where,
      include: {
        localCategory: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true }, take: 5 },
      },
      orderBy: { name: "asc" },
      take: 100,
    });

    const total = await prisma.trendyolCategory.count();
    const mapped = await prisma.trendyolCategory.count({ where: { localCategoryId: { not: null } } });

    return NextResponse.json({ categories, total, mapped });
  } catch (error) {
    console.error("Trendyol kategori listesi hatası:", error);
    return NextResponse.json({ error: "Kategoriler yüklenemedi" }, { status: 500 });
  }
}

/** POST — Trendyol'dan kategori ağacını çek ve DB'ye kaydet */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const client = await getTrendyolClient();
    const tree = await getCategoryTree(client);
    const flatList = flattenCategoryTree(tree);

    const existingMappings = await prisma.trendyolCategory.findMany({
      where: { localCategoryId: { not: null } },
      select: { id: true, localCategoryId: true },
    });
    const mappingMap = new Map(existingMappings.map((m) => [m.id, m.localCategoryId]));

    let upserted = 0;
    for (const cat of flatList) {
      await prisma.trendyolCategory.upsert({
        where: { id: cat.id },
        create: {
          id: cat.id,
          name: cat.name,
          parentId: cat.parentId,
          path: cat.path,
          localCategoryId: mappingMap.get(cat.id) || null,
        },
        update: { name: cat.name, parentId: cat.parentId, path: cat.path },
      });
      upserted++;
    }

    return NextResponse.json({ success: true, message: `${upserted} kategori senkronize edildi`, total: upserted });
  } catch (error) {
    console.error("Trendyol kategori sync hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kategori senkronizasyonu başarısız" },
      { status: 500 }
    );
  }
}
