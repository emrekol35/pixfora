import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  upsertTranslations,
  upsertTranslatedSlug,
  TRANSLATABLE_FIELDS,
  type TranslatableEntityType,
} from "@/lib/translations";

interface RouteContext {
  params: Promise<{ entityType: string; entityId: string }>;
}

// GET — Tek entity'nin orijinal içeriğini ve çevirilerini getir
export async function GET(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { entityType, entityId } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") || "en";

  const validTypes = ["product", "category", "brand", "page", "blogPost", "slide"];
  if (!validTypes.includes(entityType)) {
    return NextResponse.json({ error: "Geçersiz entityType" }, { status: 400 });
  }

  const type = entityType as TranslatableEntityType;
  const fields = TRANSLATABLE_FIELDS[type];

  // Orijinal entity verisi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let original: any = null;

  switch (entityType) {
    case "product":
      original = await prisma.product.findUnique({
        where: { id: entityId },
        select: {
          id: true, name: true, slug: true, description: true, shortDesc: true,
          seoTitle: true, seoDescription: true, seoKeywords: true,
          images: { take: 1, select: { url: true } },
        },
      });
      break;
    case "category":
      original = await prisma.category.findUnique({
        where: { id: entityId },
        select: {
          id: true, name: true, slug: true, description: true,
          seoTitle: true, seoDescription: true, seoKeywords: true,
        },
      });
      break;
    case "brand":
      original = await prisma.brand.findUnique({
        where: { id: entityId },
        select: {
          id: true, name: true, slug: true, description: true,
          seoTitle: true, seoDescription: true, seoKeywords: true,
        },
      });
      break;
    case "page":
      original = await prisma.page.findUnique({
        where: { id: entityId },
        select: {
          id: true, title: true, slug: true, content: true,
          seoTitle: true, seoDescription: true,
        },
      });
      break;
    case "blogPost":
      original = await prisma.blogPost.findUnique({
        where: { id: entityId },
        select: {
          id: true, title: true, slug: true, content: true, excerpt: true,
          seoTitle: true, seoDescription: true,
        },
      });
      break;
    case "slide":
      original = await prisma.slide.findUnique({
        where: { id: entityId },
        select: { id: true, title: true, subtitle: true, image: true },
      });
      break;
  }

  if (!original) {
    return NextResponse.json({ error: "Entity bulunamadı" }, { status: 404 });
  }

  // Mevcut çeviriler
  const translations = await prisma.translation.findMany({
    where: { entityType, entityId, locale },
    select: { field: true, value: true },
  });

  const translationMap: Record<string, string> = {};
  for (const t of translations) {
    translationMap[t.field] = t.value;
  }

  // Çeviri slug'ı
  const translatedSlug = await prisma.translatedSlug.findUnique({
    where: {
      entityType_entityId_locale: { entityType, entityId, locale },
    },
    select: { slug: true },
  });

  return NextResponse.json({
    original,
    translations: translationMap,
    translatedSlug: translatedSlug?.slug || "",
    fields,
  });
}

// PUT — Çevirileri kaydet
export async function PUT(req: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { entityType, entityId } = await ctx.params;
  const body = await req.json();
  const { locale = "en", translations, slug } = body as {
    locale: string;
    translations: Record<string, string>;
    slug?: string;
  };

  const validTypes = ["product", "category", "brand", "page", "blogPost", "slide"];
  if (!validTypes.includes(entityType)) {
    return NextResponse.json({ error: "Geçersiz entityType" }, { status: 400 });
  }

  const type = entityType as TranslatableEntityType;

  // Çevirileri kaydet
  if (translations && Object.keys(translations).length > 0) {
    // Sadece geçerli alanları kaydet
    const validFields = TRANSLATABLE_FIELDS[type];
    const filteredTranslations: Record<string, string> = {};
    for (const [field, value] of Object.entries(translations)) {
      if (validFields.includes(field)) {
        filteredTranslations[field] = value;
      }
    }
    await upsertTranslations(type, entityId, locale, filteredTranslations);
  }

  // Slug çevirisini kaydet
  if (slug !== undefined && slug.trim() !== "") {
    await upsertTranslatedSlug(type, entityId, locale, slug.trim());
  }

  return NextResponse.json({ success: true });
}
