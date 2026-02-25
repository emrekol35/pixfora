import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getShippingProvider } from "@/services/shipping";

// GET - Kargo takip sorgula
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params;

    // Siparis'ten kargo firmasini bul
    const order = await prisma.order.findFirst({
      where: { trackingNumber },
    });

    if (!order || !order.shippingCompany) {
      return NextResponse.json({ error: "Gonderim bulunamadi" }, { status: 404 });
    }

    const provider = getShippingProvider(order.shippingCompany);
    if (!provider) {
      return NextResponse.json({ error: "Kargo firmasi bulunamadi" }, { status: 400 });
    }

    const tracking = await provider.getTracking(trackingNumber);

    return NextResponse.json(tracking);
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json({ error: "Takip sorgulama hatasi" }, { status: 500 });
  }
}
