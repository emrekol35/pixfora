import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTranslationStats } from "@/lib/translations";

// GET /api/admin/translations — Çeviri istatistikleri veya entity listesi
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const locale = searchParams.get("locale") || "en";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";

  // İstatistik modu (entityType yoksa)
  if (!entityType) {
    const stats = await getTranslationStats(locale);
    return NextResponse.json(stats);
  }

  // Entity listesi modu
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let entities: any[] = [];
  let total = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchFilter: any = search
    ? { name: { contains: search, mode: "insensitive" } }
    : {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const titleSearchFilter: any = search
    ? { title: { contains: search, mode: "insensitive" } }
    : {};

  switch (entityType) {
    case "product":
      [entities, total] = await Promise.all([
        prisma.product.findMany({
          where: { isActive: true, ...searchFilter },
          select: { id: true, name: true, slug: true, images: { take: 1, select: { url: true } } },
          orderBy: { name: "asc" },
          take: limit,
          skip,
        }),
        prisma.product.count({ where: { isActive: true, ...searchFilter } }),
      ]);
      break;
    case "category":
      [entities, total] = await Promise.all([
        prisma.category.findMany({
          where: { isActive: true, ...searchFilter },
          select: { id: true, name: true, slug: true },
          orderBy: { name: "asc" },
          take: limit,
          skip,
        }),
        prisma.category.count({ where: { isActive: true, ...searchFilter } }),
      ]);
      break;
    case "brand":
      [entities, total] = await Promise.all([
        prisma.brand.findMany({
          where: { isActive: true, ...searchFilter },
          select: { id: true, name: true, slug: true, logo: true },
          orderBy: { name: "asc" },
          take: limit,
          skip,
        }),
        prisma.brand.count({ where: { isActive: true, ...searchFilter } }),
      ]);
      break;
    case "page":
      [entities, total] = await Promise.all([
        prisma.page.findMany({
          where: { isActive: true, ...titleSearchFilter },
          select: { id: true, title: true, slug: true },
          orderBy: { title: "asc" },
          take: limit,
          skip,
        }),
        prisma.page.count({ where: { isActive: true, ...titleSearchFilter } }),
      ]);
      // title -> name normalizasyon
      entities = entities.map((e) => ({ ...e, name: e.title }));
      break;
    case "blogPost":
      [entities, total] = await Promise.all([
        prisma.blogPost.findMany({
          where: { isActive: true, ...titleSearchFilter },
          select: { id: true, title: true, slug: true },
          orderBy: { title: "asc" },
          take: limit,
          skip,
        }),
        prisma.blogPost.count({ where: { isActive: true, ...titleSearchFilter } }),
      ]);
      entities = entities.map((e) => ({ ...e, name: e.title }));
      break;
    case "slide":
      [entities, total] = await Promise.all([
        prisma.slide.findMany({
          where: { isActive: true },
          select: { id: true, title: true, image: true },
          orderBy: { order: "asc" },
          take: limit,
          skip,
        }),
        prisma.slide.count({ where: { isActive: true } }),
      ]);
      entities = entities.map((e) => ({ ...e, name: e.title || "Slide" }));
      break;
    default:
      return NextResponse.json({ error: "Geçersiz entityType" }, { status: 400 });
  }

  // Her entity için çeviri durumunu kontrol et
  const entityIds = entities.map((e) => e.id);
  const existingTranslations = await prisma.translation.findMany({
    where: {
      entityType,
      entityId: { in: entityIds },
      locale,
    },
    select: { entityId: true, field: true },
  });

  const translationMap = new Map<string, Set<string>>();
  for (const t of existingTranslations) {
    if (!translationMap.has(t.entityId)) {
      translationMap.set(t.entityId, new Set());
    }
    translationMap.get(t.entityId)!.add(t.field);
  }

  const enrichedEntities = entities.map((e) => ({
    ...e,
    translatedFields: translationMap.has(e.id) ? translationMap.get(e.id)!.size : 0,
  }));

  return NextResponse.json({
    entities: enrichedEntities,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
