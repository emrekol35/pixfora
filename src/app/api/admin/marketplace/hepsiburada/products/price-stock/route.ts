import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  getHepsiburadaClient,
  updateListings,
  formatPriceForHB,
  type HepsiburadaListingItem,
} from "@/services/marketplace/hepsiburada";

/** POST — Seçili ürünlerin stok/fiyat güncelle (listing API) */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { productIds } = body as { productIds?: string[] };

    // Eğer productIds verilmişse sadece onları, yoksa tüm SYNCED ürünleri güncelle
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (productIds && productIds.length > 0) {
      where.productId = { in: productIds };
    } else {
      where.syncStatus = "SYNCED";
    }
    where.merchantSku = { not: null };

    const hbProducts = await prisma.hepsiburadaProduct.findMany({
      where,
      include: {
        product: {
          select: { price: true, stock: true, sku: true },
        },
      },
    });

    if (hbProducts.length === 0) {
      return NextResponse.json({ error: "Güncellenecek ürün bulunamadı" }, { status: 400 });
    }

    const client = await getHepsiburadaClient();

    const items: HepsiburadaListingItem[] = hbProducts.map((hp) => ({
      MerchantSku: hp.merchantSku || hp.product.sku || "",
      HepsiburadaSku: hp.hepsiburadaSku || undefined,
      Price: formatPriceForHB(hp.product.price),
      AvailableStock: hp.product.stock,
      DispatchTime: 3, // Varsayılan 3 gün
    }));

    const result = await updateListings(client, items);

    return NextResponse.json({
      success: true,
      message: `${items.length} ürün stok/fiyat güncellendi`,
      inventoryUploadId: result.inventoryUploadId,
    });
  } catch (error) {
    console.error("Hepsiburada stok/fiyat güncelleme hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Güncelleme başarısız" },
      { status: 500 }
    );
  }
}
