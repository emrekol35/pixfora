import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { getTrendyolClient, deleteProducts } from "@/services/marketplace/trendyol";

/** GET — Tek ürün Trendyol sync detayı */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { id } = await params;

    const tp = await prisma.trendyolProduct.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            images: { orderBy: { order: "asc" } },
            variants: true,
            category: { select: { id: true, name: true } },
            brand: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!tp) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(tp);
  } catch (error) {
    console.error("Trendyol ürün detay hatası:", error);
    return NextResponse.json({ error: "Ürün detayı yüklenemedi" }, { status: 500 });
  }
}

/** PUT — Ürün Trendyol ayarlarını güncelle */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { trendyolCategoryId, trendyolBrandId, attributes } = body;

    const data: Prisma.TrendyolProductUpdateInput = {};
    if (trendyolCategoryId !== undefined) data.trendyolCategoryId = trendyolCategoryId;
    if (trendyolBrandId !== undefined) data.trendyolBrandId = trendyolBrandId;
    if (attributes !== undefined) data.attributes = (attributes ?? Prisma.JsonNull) as Prisma.InputJsonValue;

    const updated = await prisma.trendyolProduct.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Trendyol ürün güncelleme hatası:", error);
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}

/** DELETE — Trendyol'dan ürünü kaldır + kaydı sil */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { id } = await params;

    const tp = await prisma.trendyolProduct.findUnique({
      where: { id },
      include: { product: { select: { barcode: true, sku: true } } },
    });

    if (!tp) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }

    // Trendyol'dan sil (barcode varsa)
    if (tp.syncStatus === "SYNCED" && (tp.trendyolBarcode || tp.product.barcode)) {
      try {
        const client = await getTrendyolClient();
        await deleteProducts(client, [
          { barcode: tp.trendyolBarcode || tp.product.barcode || tp.product.sku || "" },
        ]);
      } catch (err) {
        console.error("Trendyol'dan silme hatası:", err);
      }
    }

    await prisma.trendyolProduct.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Trendyol ürün silme hatası:", error);
    return NextResponse.json({ error: "Silme başarısız" }, { status: 500 });
  }
}
