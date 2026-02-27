import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getBoughtTogether,
  getSimilarProducts,
  getPersonalized,
  getTrending,
  getCartRecommendations,
} from "@/services/recommendation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET - Oneri endpoint'i
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const productId = searchParams.get("productId");
    const productIds = searchParams.get("productIds");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam), 20) : undefined;

    if (!type) {
      return NextResponse.json(
        { error: "type parametresi gerekli (bought-together, similar, personalized, trending, cart)" },
        { status: 400 }
      );
    }

    switch (type) {
      case "bought-together": {
        if (!productId) {
          return NextResponse.json({ error: "productId parametresi gerekli" }, { status: 400 });
        }
        const results = await getBoughtTogether(productId, limit || 4);
        return NextResponse.json(results);
      }

      case "similar": {
        if (!productId) {
          return NextResponse.json({ error: "productId parametresi gerekli" }, { status: 400 });
        }
        // Urun bilgilerini al (scoring icin)
        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: {
            categoryId: true,
            brandId: true,
            price: true,
            tags: { select: { id: true, tag: true } },
          },
        });
        if (!product) {
          return NextResponse.json({ error: "Urun bulunamadi" }, { status: 404 });
        }
        const results = await getSimilarProducts(
          productId,
          product.categoryId,
          product.brandId,
          product.tags,
          product.price,
          limit || 8
        );
        return NextResponse.json(results);
      }

      case "personalized": {
        const session = await auth();
        if (session?.user?.id) {
          const results = await getPersonalized(session.user.id, limit || 8);
          return NextResponse.json(results);
        }
        // Giris yapilmamissa trending fallback
        const results = await getTrending(limit || 8);
        return NextResponse.json(results);
      }

      case "trending": {
        const results = await getTrending(limit || 8);
        return NextResponse.json(results);
      }

      case "cart": {
        if (!productIds) {
          return NextResponse.json({ error: "productIds parametresi gerekli" }, { status: 400 });
        }
        const ids = productIds.split(",").filter(Boolean);
        if (ids.length === 0) {
          return NextResponse.json({ error: "En az bir productId gerekli" }, { status: 400 });
        }
        const results = await getCartRecommendations(ids, limit || 4);
        return NextResponse.json(results);
      }

      default:
        return NextResponse.json(
          { error: "Gecersiz type. Desteklenen: bought-together, similar, personalized, trending, cart" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Recommendations API error:", error);
    return NextResponse.json({ error: "Oneri sistemi hatasi" }, { status: 500 });
  }
}
