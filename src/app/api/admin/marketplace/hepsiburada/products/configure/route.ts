import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/** PUT — Ürüne Hepsiburada kategori/marka ata */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { productId, hepsiburadaCategoryId, brandName } = body as {
      productId: string;
      hepsiburadaCategoryId: number | null;
      brandName: string | null;
    };

    if (!productId) {
      return NextResponse.json({ error: "productId gerekli" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
    }

    const hp = await prisma.hepsiburadaProduct.upsert({
      where: { productId },
      create: {
        productId,
        hepsiburadaCategoryId: hepsiburadaCategoryId || null,
        brandName: brandName || null,
        syncStatus: "NOT_SYNCED",
      },
      update: {
        hepsiburadaCategoryId: hepsiburadaCategoryId || null,
        brandName: brandName || null,
      },
    });

    return NextResponse.json({ success: true, hepsiburadaProduct: hp });
  } catch (error) {
    console.error("Hepsiburada ürün yapılandırma hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Yapılandırma başarısız" },
      { status: 500 }
    );
  }
}

/** POST — Toplu Hepsiburada kategori/marka ata */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { productIds, hepsiburadaCategoryId, brandName } = body as {
      productIds: string[];
      hepsiburadaCategoryId: number;
      brandName: string;
    };

    if (!productIds?.length || !hepsiburadaCategoryId || !brandName) {
      return NextResponse.json(
        { error: "productIds, hepsiburadaCategoryId ve brandName gerekli" },
        { status: 400 }
      );
    }

    let configured = 0;
    for (const productId of productIds) {
      await prisma.hepsiburadaProduct.upsert({
        where: { productId },
        create: { productId, hepsiburadaCategoryId, brandName, syncStatus: "NOT_SYNCED" },
        update: { hepsiburadaCategoryId, brandName },
      });
      configured++;
    }

    return NextResponse.json({ success: true, message: `${configured} ürün yapılandırıldı`, configured });
  } catch (error) {
    console.error("Hepsiburada toplu yapılandırma hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Toplu yapılandırma başarısız" },
      { status: 500 }
    );
  }
}
