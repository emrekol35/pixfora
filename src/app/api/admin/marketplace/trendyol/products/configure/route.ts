import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/** PUT — Ürüne Trendyol kategori/marka ata (TrendyolProduct kaydı oluştur/güncelle) */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { productId, trendyolCategoryId, trendyolBrandId } = body as {
      productId: string;
      trendyolCategoryId: number | null;
      trendyolBrandId: number | null;
    };

    if (!productId) {
      return NextResponse.json({ error: "productId gerekli" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
    }

    const tp = await prisma.trendyolProduct.upsert({
      where: { productId },
      create: {
        productId,
        trendyolCategoryId: trendyolCategoryId || null,
        trendyolBrandId: trendyolBrandId || null,
        syncStatus: "NOT_SYNCED",
      },
      update: {
        trendyolCategoryId: trendyolCategoryId || null,
        trendyolBrandId: trendyolBrandId || null,
      },
    });

    return NextResponse.json({ success: true, trendyolProduct: tp });
  } catch (error) {
    console.error("Trendyol ürün yapılandırma hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Yapılandırma başarısız" },
      { status: 500 }
    );
  }
}

/** POST — Toplu Trendyol kategori/marka ata */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { productIds, trendyolCategoryId, trendyolBrandId } = body as {
      productIds: string[];
      trendyolCategoryId: number;
      trendyolBrandId: number;
    };

    if (!productIds?.length || !trendyolCategoryId || !trendyolBrandId) {
      return NextResponse.json(
        { error: "productIds, trendyolCategoryId ve trendyolBrandId gerekli" },
        { status: 400 }
      );
    }

    let configured = 0;
    for (const productId of productIds) {
      await prisma.trendyolProduct.upsert({
        where: { productId },
        create: { productId, trendyolCategoryId, trendyolBrandId, syncStatus: "NOT_SYNCED" },
        update: { trendyolCategoryId, trendyolBrandId },
      });
      configured++;
    }

    return NextResponse.json({ success: true, message: `${configured} ürün yapılandırıldı`, configured });
  } catch (error) {
    console.error("Toplu yapılandırma hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Toplu yapılandırma başarısız" },
      { status: 500 }
    );
  }
}
