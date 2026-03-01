import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  getHepsiburadaClient,
  createPackage,
  markInTransit,
  markDelivered,
} from "@/services/marketplace/hepsiburada";

/** PUT — Hepsiburada sipariş durumunu güncelle */
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
    const { action, packageNumber, lines } = body as {
      action: "package" | "intransit" | "deliver";
      packageNumber?: string;
      lines?: { lineItemId: string; quantity: number }[];
    };

    const hbOrder = await prisma.hepsiburadaOrder.findUnique({
      where: { id },
    });

    if (!hbOrder) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    const client = await getHepsiburadaClient();

    let message = "";
    let newStatus = hbOrder.orderStatus;

    switch (action) {
      case "package": {
        if (!lines || lines.length === 0) {
          return NextResponse.json({ error: "Paketlenecek satır bilgileri gerekli" }, { status: 400 });
        }
        const pkg = await createPackage(client, lines);
        await prisma.hepsiburadaOrder.update({
          where: { id },
          data: {
            hbPackageNumber: pkg.packageNumber,
            orderStatus: "Packaged",
          },
        });
        message = `Paket oluşturuldu: ${pkg.packageNumber}`;
        newStatus = "Packaged";
        break;
      }
      case "intransit": {
        const pkgNum = packageNumber || hbOrder.hbPackageNumber;
        if (!pkgNum) {
          return NextResponse.json({ error: "Paket numarası gerekli" }, { status: 400 });
        }
        await markInTransit(client, pkgNum);
        await prisma.hepsiburadaOrder.update({
          where: { id },
          data: { orderStatus: "InTransit" },
        });
        message = "Sipariş kargoya verildi";
        newStatus = "InTransit";
        break;
      }
      case "deliver": {
        const pkgNum2 = packageNumber || hbOrder.hbPackageNumber;
        if (!pkgNum2) {
          return NextResponse.json({ error: "Paket numarası gerekli" }, { status: 400 });
        }
        await markDelivered(client, pkgNum2);
        await prisma.hepsiburadaOrder.update({
          where: { id },
          data: { orderStatus: "Delivered" },
        });
        message = "Sipariş teslim edildi";
        newStatus = "Delivered";
        break;
      }
      default:
        return NextResponse.json({ error: "Geçersiz aksiyon" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message, status: newStatus });
  } catch (error) {
    console.error("Hepsiburada sipariş durum güncelleme hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Durum güncelleme başarısız" },
      { status: 500 }
    );
  }
}
