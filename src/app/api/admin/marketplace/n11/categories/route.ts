import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  getN11Client,
  getAllCategories,
  flattenCategories,
} from "@/services/marketplace/n11";

/** GET — N11 kategorilerini listele (yerel DB) */
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
        where.parentId = BigInt(parentId);
      } else if (!search) {
        where.parentId = null;
      }
    }

    const categories = await prisma.n11Category.findMany({
      where,
      include: {
        localCategory: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true }, take: 5 },
      },
      orderBy: { name: "asc" },
      take: all ? 10000 : 100,
    });

    const total = await prisma.n11Category.count();
    const mapped = await prisma.n11Category.count({ where: { localCategoryId: { not: null } } });

    // BigInt serialize
    const serialized = categories.map((c) => ({
      ...c,
      id: Number(c.id),
      parentId: c.parentId ? Number(c.parentId) : null,
      children: c.children.map((ch) => ({ id: Number(ch.id), name: ch.name })),
    }));

    return NextResponse.json({ categories: serialized, total, mapped });
  } catch (error) {
    console.error("N11 kategori listesi hatası:", error);
    return NextResponse.json({ error: "Kategoriler yüklenemedi" }, { status: 500 });
  }
}

/** POST — N11'den kategorileri çek ve DB'ye kaydet */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const client = await getN11Client();
    const rawCategories = await getAllCategories(client);
    const categories = flattenCategories(rawCategories);

    // Mevcut eşleştirmeleri koru
    const existingMappings = await prisma.n11Category.findMany({
      where: { localCategoryId: { not: null } },
      select: { id: true, localCategoryId: true },
    });
    const mappingMap = new Map(existingMappings.map((m) => [Number(m.id), m.localCategoryId]));

    // Toplu upsert — 500'lük batch'ler halinde
    let upserted = 0;
    const BATCH_SIZE = 500;
    for (let i = 0; i < categories.length; i += BATCH_SIZE) {
      const batch = categories.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((cat) =>
          prisma.n11Category.upsert({
            where: { id: BigInt(cat.id) },
            create: {
              id: BigInt(cat.id),
              name: cat.name,
              parentId: cat.parentId ? BigInt(cat.parentId) : null,
              path: cat.path,
              leaf: cat.leaf,
              localCategoryId: mappingMap.get(cat.id) || null,
            },
            update: {
              name: cat.name,
              parentId: cat.parentId ? BigInt(cat.parentId) : null,
              path: cat.path,
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
    console.error("N11 kategori sync hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kategori senkronizasyonu başarısız" },
      { status: 500 }
    );
  }
}
