import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getN11Client, updatePriceStock } from "@/services/marketplace/n11";

/** POST — Seçili ürünlerin stok/fiyat güncelle */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { productIds } = body as { productIds?: string[] };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (productIds && productIds.length > 0) {
      where.productId = { in: productIds };
    } else {
      where.syncStatus = "SYNCED";
    }
    where.stockCode = { not: null };

    const n11Products = await prisma.n11Product.findMany({
      where,
      include: {
        product: {
          select: { price: true, comparePrice: true, stock: true, sku: true },
        },
      },
    });

    if (n11Products.length === 0) {
      return NextResponse.json({ error: "Güncellenecek ürün bulunamadı" }, { status: 400 });
    }

    const client = await getN11Client();

    const skus = n11Products.map((np) => {
      const listPrice = np.product.comparePrice && np.product.comparePrice > np.product.price
        ? Number(np.product.comparePrice.toFixed(2))
        : Number(np.product.price.toFixed(2));

      return {
        stockCode: np.stockCode || np.product.sku || "",
        listPrice,
        salePrice: Number(np.product.price.toFixed(2)),
        quantity: np.product.stock,
        currencyType: "TL" as const,
      };
    });

    // Max 1000 sku per request
    const BATCH_SIZE = 1000;
    let lastTaskId: number | null = null;

    for (let i = 0; i < skus.length; i += BATCH_SIZE) {
      const batch = skus.slice(i, i + BATCH_SIZE);
      const result = await updatePriceStock(client, batch);
      if (result.status === "REJECT") {
        return NextResponse.json(
          { error: `N11 task reddedildi: ${result.reasons?.join(", ")}` },
          { status: 400 }
        );
      }
      lastTaskId = result.id;
    }

    return NextResponse.json({
      success: true,
      message: `${skus.length} ürün stok/fiyat güncellendi`,
      taskId: lastTaskId,
    });
  } catch (error) {
    console.error("N11 stok/fiyat güncelleme hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Güncelleme başarısız" },
      { status: 500 }
    );
  }
}
