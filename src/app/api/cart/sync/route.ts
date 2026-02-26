import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST - LocalStorage sepetini DB'ye senkronize et
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Gecersiz veri" }, { status: 400 });
    }

    // Mevcut sepet ogelerini sil ve yeniden olustur
    await prisma.cartItem.deleteMany({
      where: { userId: session.user.id },
    });

    if (items.length > 0) {
      const cartData = items.map((item: { productId: string; variantId?: string; quantity: number }) => ({
        userId: session.user!.id!,
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity || 1,
      }));

      await prisma.cartItem.createMany({
        data: cartData,
      });
    }

    return NextResponse.json({ success: true, count: items.length });
  } catch (error) {
    console.error("Cart sync error:", error);
    return NextResponse.json({ error: "Sepet senkronizasyon hatasi" }, { status: 500 });
  }
}
