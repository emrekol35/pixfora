import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { importTrendyolProduct, parseContentIdFromUrl } from "@/services/trendyol-scraper";
import { logActivity } from "@/lib/activity-log";
import type { TrendyolImportResult } from "@/services/trendyol-scraper";

export const dynamic = "force-dynamic";

// POST — Trendyol URL'lerinden urun aktar
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { urls, categoryId } = body;

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "En az bir Trendyol URL'si gerekli." },
        { status: 400 }
      );
    }

    if (urls.length > 20) {
      return NextResponse.json(
        { error: "Tek seferde en fazla 20 URL aktarilabilir." },
        { status: 400 }
      );
    }

    const results: TrendyolImportResult[] = [];

    for (let i = 0; i < urls.length; i++) {
      const url = (urls[i] as string).trim();
      if (!url) continue;

      // Gecerlilik kontrolu
      const contentId = parseContentIdFromUrl(url);
      if (!contentId) {
        results.push({
          url,
          contentId: "",
          status: "failed",
          error: "Gecersiz URL formati",
        });
        continue;
      }

      // Import et
      const result = await importTrendyolProduct(url, { categoryId });
      results.push(result);

      // Rate limit — URL'ler arasi 300ms bekle
      if (i < urls.length - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    const summary = {
      total: results.length,
      success: results.filter((r) => r.status === "success").length,
      failed: results.filter((r) => r.status === "failed").length,
      duplicate: results.filter((r) => r.status === "duplicate").length,
    };

    // Aktivite logu
    await logActivity({
      userId: session.user.id,
      action: "trendyol_import",
      entity: "product",
      details: {
        total: summary.total,
        success: summary.success,
        failed: summary.failed,
        duplicate: summary.duplicate,
      },
    });

    return NextResponse.json({ results, summary });
  } catch (error) {
    console.error("Trendyol import error:", error);
    return NextResponse.json(
      { error: "Aktarim sirasinda bir hata olustu." },
      { status: 500 }
    );
  }
}
