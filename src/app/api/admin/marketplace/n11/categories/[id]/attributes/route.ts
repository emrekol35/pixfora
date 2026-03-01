import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getN11Client, getCategoryAttributes } from "@/services/marketplace/n11";

/** GET — Kategori özelliklerini al */
export async function GET(
  _request: NextRequest,
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

    const client = await getN11Client();
    const attributes = await getCategoryAttributes(client, categoryId);

    return NextResponse.json(attributes);
  } catch (error) {
    console.error("N11 kategori özellik hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kategori özellikleri alınamadı" },
      { status: 500 }
    );
  }
}
