import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  getHepsiburadaClient,
  getAllCategories,
  buildCategoryPaths,
} from "@/services/marketplace/hepsiburada";

/** GET — Hepsiburada kategorilerini listele (yerel DB) */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const mappedOnly = searchParams.get("mappedOnly") === "true";
    const leafOnly = searchParams.get("leafOnly") === "true";
    const parentId = searchParams.get("parentId");
    const all = searchParams.get("all") === "true";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { path: { contains: search, mode: "insensitive" } },
      ];
    }
    if (mappedOnly) where.localCategoryId = { not: null };
    if (leafOnly) where.leaf = true;

    if (!all) {
      if (parentId) {
        where.parentId = parseInt(parentId);
      } else if (!search) {
        where.parentId = null;
      }
    }

    const categories = await prisma.hepsiburadaCategory.findMany({
      where,
      include: {
        localCategory: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true }, take: 5 },
      },
      orderBy: { name: "asc" },
      take: all ? 10000 : 100,
    });

    const total = await prisma.hepsiburadaCategory.count();
    const mapped = await prisma.hepsiburadaCategory.count({ where: { localCategoryId: { not: null } } });

    return NextResponse.json({ categories, total, mapped });
  } catch (error) {
    console.error("Hepsiburada kategori listesi hatası:", error);
    return NextResponse.json({ error: "Kategoriler yüklenemedi" }, { status: 500 });
  }
}

/** POST — Hepsiburada'dan kategorileri çek ve DB'ye kaydet */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const client = await getHepsiburadaClient();
    const rawCategories = await getAllCategories(client);
    const categories = buildCategoryPaths(rawCategories);

    // Mevcut eşleştirmeleri koru
    const existingMappings = await prisma.hepsiburadaCategory.findMany({
      where: { localCategoryId: { not: null } },
      select: { id: true, localCategoryId: true },
    });
    const mappingMap = new Map(existingMappings.map((m) => [m.id, m.localCategoryId]));

    // Toplu upsert — 500'lük batch'ler halinde
    let upserted = 0;
    const BATCH_SIZE = 500;
    for (let i = 0; i < categories.length; i += BATCH_SIZE) {
      const batch = categories.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((cat) =>
          prisma.hepsiburadaCategory.upsert({
            where: { id: cat.id },
            create: {
              id: cat.id,
              name: cat.name,
              parentId: cat.parentId,
              path: cat.path,
              available: cat.available,
              leaf: cat.leaf,
              localCategoryId: mappingMap.get(cat.id) || null,
            },
            update: {
              name: cat.name,
              parentId: cat.parentId,
              path: cat.path,
              available: cat.available,
              leaf: cat.leaf,
            },
          })
        )
      );
      upserted += batch.length;
    }

    return NextResponse.json({
      success: true,
      message: `${upserted} kategori senkronize edildi`,
      total: upserted,
    });
  } catch (error) {
    console.error("Hepsiburada kategori sync hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kategori senkronizasyonu başarısız" },
      { status: 500 }
    );
  }
}
