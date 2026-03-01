import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  getHepsiburadaClient,
  importProducts,
  mapProductToHepsiburada,
  type LocalProductForHepsiburada,
} from "@/services/marketplace/hepsiburada";

/** GET — Tüm mağaza ürünlerini Hepsiburada bilgileriyle listele */
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
      where.hepsiburadaProduct = null;
    } else if (syncStatus === "NO_CATEGORY") {
      where.hepsiburadaProduct = {
        OR: [{ hepsiburadaCategoryId: null }, { brandName: null }],
      };
    } else if (syncStatus) {
      where.hepsiburadaProduct = { syncStatus };
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
          hepsiburadaProduct: {
            select: {
              id: true,
              syncStatus: true,
              hepsiburadaCategoryId: true,
              brandName: true,
              lastSyncedAt: true,
              lastError: true,
              hepsiburadaSku: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: page * size,
        take: size,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ products, total, page, size });
  } catch (error) {
    console.error("Hepsiburada ürün listesi hatası:", error);
    return NextResponse.json({ error: "Ürünler yüklenemedi" }, { status: 500 });
  }
}

/** POST — Seçili ürünleri Hepsiburada'ya aktar */
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
        hepsiburadaProduct: true,
      },
    });

    if (products.length === 0) {
      return NextResponse.json({ error: "Aktarılacak aktif ürün bulunamadı" }, { status: 400 });
    }

    const client = await getHepsiburadaClient();
    const allItems: import("@/services/marketplace/hepsiburada").HepsiburadaProductItem[] = [];
    const hbProductIds: string[] = [];

    for (const product of products) {
      const hp = product.hepsiburadaProduct;

      if (!hp) {
        return NextResponse.json(
          { error: `"${product.name}" ürünü için Hepsiburada kategori/marka yapılandırması yapılmamış` },
          { status: 400 }
        );
      }

      if (!hp.hepsiburadaCategoryId || !hp.brandName) {
        return NextResponse.json(
          { error: `"${product.name}" ürünü için Hepsiburada kategori veya marka seçilmemiş` },
          { status: 400 }
        );
      }

      const localProduct: LocalProductForHepsiburada = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        description: product.description,
        price: product.price,
        comparePrice: product.comparePrice,
        stock: product.stock,
        weight: product.weight,
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
        hepsiburadaCategoryId: hp.hepsiburadaCategoryId,
        brandName: hp.brandName,
        attributes: hp.attributes as Record<string, unknown> | null,
      };

      allItems.push(...mapProductToHepsiburada(localProduct, client.merchantId));
      hbProductIds.push(hp.id);
    }

    // Hepsiburada API'ye gönder
    const result = await importProducts(client, allItems);

    // HepsiburadaProduct kayıtlarını güncelle
    await prisma.hepsiburadaProduct.updateMany({
      where: { id: { in: hbProductIds } },
      data: {
        syncStatus: "PENDING",
        lastError: null,
      },
    });

    return NextResponse.json({
      success: true,
      productCount: products.length,
      itemCount: allItems.length,
      trackingId: result.trackingId,
      message: result.message || `${products.length} ürün Hepsiburada'ya gönderildi`,
    });
  } catch (error) {
    console.error("Hepsiburada ürün aktarım hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ürün aktarımı başarısız" },
      { status: 500 }
    );
  }
}
