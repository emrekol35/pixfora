import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/** PUT — Ürüne N11 kategori/marka ata */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { productId, n11CategoryId, brandName } = body as {
      productId: string;
      n11CategoryId: number | null;
      brandName: string | null;
    };

    if (!productId) {
      return NextResponse.json({ error: "productId gerekli" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
    }

    const np = await prisma.n11Product.upsert({
      where: { productId },
      create: {
        productId,
        n11CategoryId: n11CategoryId ? BigInt(n11CategoryId) : null,
        brandName: brandName || null,
        syncStatus: "NOT_SYNCED",
      },
      update: {
        n11CategoryId: n11CategoryId ? BigInt(n11CategoryId) : null,
        brandName: brandName || null,
      },
    });

    return NextResponse.json({
      success: true,
      n11Product: { ...np, n11CategoryId: np.n11CategoryId ? Number(np.n11CategoryId) : null },
    });
  } catch (error) {
    console.error("N11 ürün yapılandırma hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Yapılandırma başarısız" },
      { status: 500 }
    );
  }
}

/** POST — Toplu N11 kategori/marka ata */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { productIds, n11CategoryId, brandName } = body as {
      productIds: string[];
      n11CategoryId: number;
      brandName: string;
    };

    if (!productIds?.length || !n11CategoryId || !brandName) {
      return NextResponse.json(
        { error: "productIds, n11CategoryId ve brandName gerekli" },
        { status: 400 }
      );
    }

    let configured = 0;
    for (const productId of productIds) {
      await prisma.n11Product.upsert({
        where: { productId },
        create: {
          productId,
          n11CategoryId: BigInt(n11CategoryId),
          brandName,
          syncStatus: "NOT_SYNCED",
        },
        update: {
          n11CategoryId: BigInt(n11CategoryId),
          brandName,
        },
      });
      configured++;
    }

    return NextResponse.json({ success: true, message: `${configured} ürün yapılandırıldı`, configured });
  } catch (error) {
    console.error("N11 toplu yapılandırma hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Toplu yapılandırma başarısız" },
      { status: 500 }
    );
  }
}
