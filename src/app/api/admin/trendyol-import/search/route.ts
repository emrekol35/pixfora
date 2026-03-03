import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchTrendyolListProducts } from "@/services/trendyol-scraper";

export const dynamic = "force-dynamic";

// POST — Trendyol kategori/liste URL'sinden urun listesi cek
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { searchUrl, offset } = body;

    if (!searchUrl || typeof searchUrl !== "string") {
      return NextResponse.json(
        { error: "Trendyol URL'si gerekli." },
        { status: 400 }
      );
    }

    // URL validasyonu
    try {
      const parsed = new URL(searchUrl);
      if (!parsed.hostname.includes("trendyol.com")) {
        return NextResponse.json(
          { error: "Gecerli bir Trendyol URL'si girin." },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Gecersiz URL formati." },
        { status: 400 }
      );
    }

    const parsedOffset =
      typeof offset === "number" ? offset : undefined;
    const result = await fetchTrendyolListProducts(searchUrl, parsedOffset);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Trendyol search error:", error);
    const message =
      error instanceof Error ? error.message : "Urun listesi alinamadi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
