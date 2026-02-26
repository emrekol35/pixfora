import { NextRequest, NextResponse } from "next/server";

// Cron endpoint'leri icin yetkilendirme kontrolu
// Kullanim: const authError = verifyCronSecret(request); if (authError) return authError;
export function verifyCronSecret(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET env degiskeni tanimlanmamis");
    return NextResponse.json(
      { error: "Cron yapilandirmasi eksik" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Yetkisiz erisim" },
      { status: 401 }
    );
  }

  return null; // Yetkilendirme basarili
}
