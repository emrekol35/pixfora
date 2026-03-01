import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTrendyolClient, getCategoryAttributes } from "@/services/marketplace/trendyol";

/** GET — Trendyol kategorisinin attribute'larını döndür */
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
    const categoryId = parseInt(id);
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: "Geçersiz kategori ID" }, { status: 400 });
    }

    const client = await getTrendyolClient();
    const attributes = await getCategoryAttributes(client, categoryId);

    return NextResponse.json(attributes);
  } catch (error) {
    console.error("Kategori attribute hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Attribute'lar yüklenemedi" },
      { status: 500 }
    );
  }
}
