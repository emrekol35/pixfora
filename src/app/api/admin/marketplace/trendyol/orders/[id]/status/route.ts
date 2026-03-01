import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { getTrendyolClient, updatePackageStatus } from "@/services/marketplace/trendyol";

/** PUT — Paket durumunu Trendyol'a bildir */
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
    const { status, trackingNumber, cargoProviderCode, invoiceNumber } = body as {
      status: "Picking" | "Invoiced" | "Shipped" | "UnSupplied";
      trackingNumber?: string;
      cargoProviderCode?: string;
      invoiceNumber?: string;
    };

    if (!status) {
      return NextResponse.json({ error: "status gerekli" }, { status: 400 });
    }

    const validStatuses = ["Picking", "Invoiced", "Shipped", "UnSupplied"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Geçersiz durum. Geçerli değerler: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const tOrder = await prisma.trendyolOrder.findUnique({ where: { id } });
    if (!tOrder || !tOrder.trendyolPackageId) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    const client = await getTrendyolClient();
    await updatePackageStatus(client, parseInt(tOrder.trendyolPackageId), status, {
      trackingNumber,
      cargoProviderCode,
      invoiceNumber,
    });

    // Yerel durum güncelle
    await prisma.trendyolOrder.update({
      where: { id },
      data: { shipmentPackageStatus: status },
    });

    return NextResponse.json({ success: true, message: `Durum "${status}" olarak güncellendi` });
  } catch (error) {
    console.error("Sipariş durum güncelleme hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Durum güncellemesi başarısız" },
      { status: 500 }
    );
  }
}
