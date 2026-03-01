import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getN11Client, approveOrderLines } from "@/services/marketplace/n11";

/** PUT — Sipariş durumunu güncelle */
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
    const { action, lineIds } = body as {
      action: "approve";
      lineIds?: number[];
    };

    const n11Order = await prisma.n11Order.findUnique({ where: { id } });
    if (!n11Order) {
      return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
    }

    const client = await getN11Client();

    if (action === "approve") {
      // LineId'ler body'den geliyorsa onları kullan, yoksa rawData'dan çıkar
      let idsToApprove = lineIds;

      if (!idsToApprove || idsToApprove.length === 0) {
        const rawData = n11Order.rawData as Record<string, unknown>;
        const lines = (rawData as { lines?: { orderLineId: number }[] }).lines;
        if (lines) {
          idsToApprove = lines.map((l) => l.orderLineId);
        }
      }

      if (!idsToApprove || idsToApprove.length === 0) {
        return NextResponse.json({ error: "Onaylanacak sipariş kalemi bulunamadı" }, { status: 400 });
      }

      const result = await approveOrderLines(client, idsToApprove);

      // Sipariş durumunu güncelle
      await prisma.n11Order.update({
        where: { id },
        data: { orderStatus: "Picking" },
      });

      return NextResponse.json({
        success: true,
        message: `${idsToApprove.length} sipariş kalemi onaylandı`,
        result: result.content,
      });
    }

    return NextResponse.json({ error: "Geçersiz aksiyon. Desteklenen: approve" }, { status: 400 });
  } catch (error) {
    console.error("N11 sipariş durum güncelleme hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Durum güncelleme başarısız" },
      { status: 500 }
    );
  }
}
