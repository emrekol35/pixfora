import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - En cok satan urunler raporu (genisletilmis)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Tarih filtresi (siparis uzerinden)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemWhere: any = {};
    if (startDate || endDate) {
      itemWhere.order = { createdAt: {} };
      if (startDate) {
        itemWhere.order.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        itemWhere.order.createdAt.lte = new Date(endDate + "T23:59:59.999Z");
      }
    }

    // Urun bazinda gruplama
    const groupedItems = await prisma.orderItem.groupBy({
      by: ["productId"],
      ...(Object.keys(itemWhere).length > 0 ? { where: itemWhere } : {}),
      _sum: { quantity: true, price: true, total: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });

    const productIds = groupedItems.map((item) => item.productId);

    // Urun bilgilerini getir (kategori dahil)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        stock: true,
        images: { take: 1, orderBy: { order: "asc" } },
        category: { select: { id: true, name: true } },
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
        stock: product?.stock ?? 0,
        image: product?.images?.[0]?.url || null,
        categoryName: product?.category?.name || "Kategorisiz",
        totalQuantity: item._sum.quantity || 0,
        totalRevenue: item._sum.total || 0,
      };
    });

    // Kategori bazli gelir hesapla
    const categoryMap = new Map<
      string,
      { name: string; revenue: number; quantity: number }
    >();

    for (const item of result) {
      const existing = categoryMap.get(item.categoryName);
      if (existing) {
        existing.revenue += item.totalRevenue;
        existing.quantity += item.totalQuantity;
      } else {
        categoryMap.set(item.categoryName, {
          name: item.categoryName,
          revenue: item.totalRevenue,
          quantity: item.totalQuantity,
        });
      }
    }

    const categoryRevenue = Array.from(categoryMap.values()).sort(
      (a, b) => b.revenue - a.revenue
    );

    return NextResponse.json({ products: result, categoryRevenue });
  } catch (error) {
    console.error("Product report error:", error);
    return NextResponse.json(
      { error: "Urun raporu alinamadi" },
      { status: 500 }
    );
  }
}
