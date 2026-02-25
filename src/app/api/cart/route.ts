import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Sepet icerigi
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ items: [] });
    }

    const items = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            images: { orderBy: { order: "asc" }, take: 1 },
          },
        },
        variant: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Cart get error:", error);
    return NextResponse.json({ error: "Sepet alinamadi" }, { status: 500 });
  }
}

// POST - Sepete urun ekle
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { productId, variantId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json({ error: "Urun ID zorunlu" }, { status: 400 });
    }

    // Urun kontrolu
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Urun bulunamadi" }, { status: 404 });
    }

    // Stok kontrolu
    let availableStock = product.stock;
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
      });
      if (!variant || !variant.isActive) {
        return NextResponse.json({ error: "Varyant bulunamadi" }, { status: 404 });
      }
      availableStock = variant.stock;
    }

    if (availableStock < quantity) {
      return NextResponse.json({ error: "Yetersiz stok" }, { status: 400 });
    }

    if (session?.user?.id) {
      // Giris yapmis kullanici - DB'ye kaydet
      const existing = await prisma.cartItem.findFirst({
        where: {
          userId: session.user.id,
          productId,
          variantId: variantId || null,
        },
      });

      if (existing) {
        const newQty = existing.quantity + quantity;
        const updated = await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: Math.min(newQty, availableStock) },
        });
        return NextResponse.json({ item: updated });
      }

      const item = await prisma.cartItem.create({
        data: {
          userId: session.user.id,
          productId,
          variantId: variantId || null,
          quantity: Math.min(quantity, availableStock),
        },
      });
      return NextResponse.json({ item });
    }

    // Giris yapmamis - client-side cart ile devam eder
    return NextResponse.json({ success: true, clientSide: true });
  } catch (error) {
    console.error("Cart add error:", error);
    return NextResponse.json({ error: "Sepete eklenemedi" }, { status: 500 });
  }
}

// DELETE - Sepeti temizle
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: true });
    }

    await prisma.cartItem.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cart clear error:", error);
    return NextResponse.json({ error: "Sepet temizlenemedi" }, { status: 500 });
  }
}
