import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  getN11Client,
  createProducts,
  mapProductToN11,
  type LocalProductForN11,
} from "@/services/marketplace/n11";

/** GET — Tüm mağaza ürünlerini N11 bilgileriyle listele */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0");
    const size = parseInt(searchParams.get("size") || "20");
    const syncStatus = searchParams.get("syncStatus") || "";
    const search = searchParams.get("search") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }
    if (syncStatus === "NOT_CONFIGURED") {
      where.n11Product = null;
    } else if (syncStatus) {
      where.n11Product = { syncStatus };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          sku: true,
          barcode: true,
          price: true,
          stock: true,
          images: { select: { url: true }, take: 1, orderBy: { order: "asc" } },
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          n11Product: {
            select: {
              id: true,
              syncStatus: true,
              n11CategoryId: true,
              brandName: true,
              lastSyncedAt: true,
              lastError: true,
              n11ProductId: true,
              stockCode: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: page * size,
        take: size,
      }),
      prisma.product.count({ where }),
    ]);

    // BigInt serialize
    const serialized = products.map((p) => ({
      ...p,
      n11Product: p.n11Product
        ? {
            ...p.n11Product,
            n11CategoryId: p.n11Product.n11CategoryId ? Number(p.n11Product.n11CategoryId) : null,
            n11ProductId: p.n11Product.n11ProductId ? Number(p.n11Product.n11ProductId) : null,
          }
        : null,
    }));

    return NextResponse.json({ products: serialized, total, page, size });
  } catch (error) {
    console.error("N11 ürün listesi hatası:", error);
    return NextResponse.json({ error: "Ürünler yüklenemedi" }, { status: 500 });
  }
}

/** POST — Seçili ürünleri N11'e aktar */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { productIds } = body as { productIds: string[] };

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "productIds dizisi gerekli" }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: {
        images: { orderBy: { order: "asc" } },
        variants: true,
        n11Product: true,
      },
    });

    if (products.length === 0) {
      return NextResponse.json({ error: "Aktarılacak aktif ürün bulunamadı" }, { status: 400 });
    }

    const client = await getN11Client();
    const allSkus: import("@/services/marketplace/n11").N11SkuItem[] = [];
    const n11ProductIds: string[] = [];

    for (const product of products) {
      const np = product.n11Product;

      if (!np) {
        return NextResponse.json(
          { error: `"${product.name}" ürünü için N11 kategori/marka yapılandırması yapılmamış` },
          { status: 400 }
        );
      }

      if (!np.n11CategoryId || !np.brandName) {
        return NextResponse.json(
          { error: `"${product.name}" ürünü için N11 kategori veya marka seçilmemiş` },
          { status: 400 }
        );
      }

      const localProduct: LocalProductForN11 = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        description: product.description,
        price: product.price,
        comparePrice: product.comparePrice,
        stock: product.stock,
        hasVariants: product.hasVariants,
        images: product.images.map((img) => ({ url: img.url, order: img.order })),
        variants: product.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          barcode: v.barcode,
          price: v.price,
          stock: v.stock,
          options: (v.options as Record<string, string>) || {},
        })),
        n11CategoryId: Number(np.n11CategoryId),
        brandName: np.brandName,
        shipmentTemplate: "1",
        preparingDay: 3,
        vatRate: 10,
      };

      allSkus.push(...mapProductToN11(localProduct));
      n11ProductIds.push(np.id);
    }

    // Max 1000 sku per request
    const BATCH_SIZE = 1000;
    let lastTaskId: number | null = null;

    for (let i = 0; i < allSkus.length; i += BATCH_SIZE) {
      const batch = allSkus.slice(i, i + BATCH_SIZE);
      const result = await createProducts(client, batch);
      if (result.status === "REJECT") {
        return NextResponse.json(
          { error: `N11 task reddedildi: ${result.reasons?.join(", ")}` },
          { status: 400 }
        );
      }
      lastTaskId = result.id;
    }

    // N11Product kayıtlarını güncelle
    await prisma.n11Product.updateMany({
      where: { id: { in: n11ProductIds } },
      data: {
        syncStatus: "PENDING",
        lastError: null,
      },
    });

    return NextResponse.json({
      success: true,
      productCount: products.length,
      skuCount: allSkus.length,
      taskId: lastTaskId,
      message: `${products.length} ürün N11'e gönderildi`,
    });
  } catch (error) {
    console.error("N11 ürün aktarım hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ürün aktarımı başarısız" },
      { status: 500 }
    );
  }
}
