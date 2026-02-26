import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - En cok satan urunler raporu
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    // Urun bazinda gruplama
    const groupedItems = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, price: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });

    const productIds = groupedItems.map((item) => item.productId);

    // Urun bilgilerini getir
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: { take: 1, orderBy: { order: "asc" } },
      },
    });

    // Urun haritasi olustur
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Sonuclari birlestir
    const result = groupedItems.map((item) => {
      const product = productMap.get(item.productId);
      return {
        id: item.productId,
        name: product?.name || "",
        slug: product?.slug || "",
        price: product?.price || 0,
        image: product?.images?.[0]?.url || null,
        totalQuantity: item._sum.quantity || 0,
        totalRevenue: item._sum.price || 0,
      };
    });

    return NextResponse.json({ products: result });
  } catch (error) {
    console.error("Product report error:", error);
    return NextResponse.json(
      { error: "Urun raporu alinamadi" },
      { status: 500 }
    );
  }
}
