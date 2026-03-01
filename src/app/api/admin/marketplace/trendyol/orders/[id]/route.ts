import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/** GET — Tek sipariş detayı */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { id } = await params;

    const tOrder = await prisma.trendyolOrder.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: { include: { product: { select: { id: true, name: true, images: { take: 1 } } } } },
            shippingAddress: true,
          },
        },
      },
    });

    if (!tOrder) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(tOrder);
  } catch (error) {
    console.error("Trendyol sipariş detay hatası:", error);
    return NextResponse.json({ error: "Sipariş detayı yüklenemedi" }, { status: 500 });
  }
}
