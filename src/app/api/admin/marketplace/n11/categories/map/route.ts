import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/** PUT — N11 kategorisini yerel kategoriyle eşleştir */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { mappings } = body as {
      mappings: { n11CategoryId: number; localCategoryId: string | null }[];
    };

    if (!mappings || !Array.isArray(mappings)) {
      return NextResponse.json({ error: "mappings dizisi gerekli" }, { status: 400 });
    }

    let updated = 0;
    for (const m of mappings) {
      await prisma.n11Category.update({
        where: { id: BigInt(m.n11CategoryId) },
        data: { localCategoryId: m.localCategoryId || null },
      });
      updated++;
    }

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("N11 kategori eşleştirme hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Eşleştirme başarısız" },
      { status: 500 }
    );
  }
}
