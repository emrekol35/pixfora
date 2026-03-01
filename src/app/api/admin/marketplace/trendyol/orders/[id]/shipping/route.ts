import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getTrendyolClient, updateTrackingNumber } from "@/services/marketplace/trendyol";

/** PUT — Kargo takip bilgisi güncelle */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { trackingNumber, cargoProviderCode } = body as {
      trackingNumber: string;
      cargoProviderCode: string;
    };

    if (!trackingNumber || !cargoProviderCode) {
      return NextResponse.json(
        { error: "trackingNumber ve cargoProviderCode gerekli" },
        { status: 400 }
      );
    }

    const tOrder = await prisma.trendyolOrder.findUnique({ where: { id } });
    if (!tOrder || !tOrder.trendyolPackageId) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    const client = await getTrendyolClient();
    await updateTrackingNumber(
      client,
      parseInt(tOrder.trendyolPackageId),
      trackingNumber,
      cargoProviderCode
    );

    return NextResponse.json({ success: true, message: "Kargo bilgisi güncellendi" });
  } catch (error) {
    console.error("Kargo güncelleme hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kargo güncellemesi başarısız" },
      { status: 500 }
    );
  }
}
