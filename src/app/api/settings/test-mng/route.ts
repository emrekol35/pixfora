import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// MNG Kargo API baglanti testi
// Gonderilen credentials ile token almaya calisir
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { customerNumber, password } = body;

    if (!customerNumber || !password) {
      return NextResponse.json(
        { connected: false, message: "Musteri No ve Sifre gerekli." },
        { status: 400 }
      );
    }

    const API_URL =
      process.env.MNG_API_URL || "https://api.mngkargo.com.tr/mngapi/api";

    const res = await fetch(`${API_URL}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerNumber,
        password,
        identityType: 1,
      }),
    });

    const data = (await res.json()) as Record<string, unknown>;

    if (res.ok && data.token) {
      return NextResponse.json({
        connected: true,
        message: "MNG Kargo API basariyla baglandi!",
      });
    }

    return NextResponse.json({
      connected: false,
      message:
        (data.message as string) ||
        (data.errorMessage as string) ||
        `Baglanti basarisiz (HTTP ${res.status})`,
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      message: `Baglanti hatasi: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
    });
  }
}
