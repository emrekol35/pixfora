import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// MNG Kargo (DHL eCommerce) API baglanti testi
// IBM API Connect tabanli - X-IBM-Client-Id ve X-IBM-Client-Secret header gerektirir
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { clientId, clientSecret, customerNumber, password } = body;

    if (!clientId || !clientSecret || !customerNumber || !password) {
      return NextResponse.json(
        {
          connected: false,
          message:
            "Client ID, Client Secret, Musteri No ve Sifre alanlari gerekli.",
        },
        { status: 400 }
      );
    }

    const API_URL =
      process.env.MNG_API_URL ||
      "https://api.mngkargo.com.tr/mngapi/api";

    const res = await fetch(`${API_URL}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-IBM-Client-Id": clientId,
        "X-IBM-Client-Secret": clientSecret,
      },
      body: JSON.stringify({
        customerNumber,
        password,
        identityType: 1,
      }),
    });

    const data = (await res.json()) as Record<string, unknown>;

    // Response: { jwt, refreshToken, jwtExpireDate, refreshTokenExpireDate }
    if (res.ok && (data.jwt || data.token)) {
      return NextResponse.json({
        connected: true,
        message: "MNG Kargo (DHL eCommerce) API basariyla baglandi!",
      });
    }

    // Detayli hata mesaji
    const errorParts: string[] = [];
    if (data.httpCode) errorParts.push(`HTTP ${data.httpCode}`);
    if (data.httpMessage) errorParts.push(data.httpMessage as string);
    if (data.moreInformation) errorParts.push(data.moreInformation as string);
    if (data.message) errorParts.push(data.message as string);
    if (data.errorMessage) errorParts.push(data.errorMessage as string);

    const errorMsg = errorParts.length > 0
      ? errorParts.join(" - ")
      : `Baglanti basarisiz (HTTP ${res.status})`;

    return NextResponse.json({
      connected: false,
      message: errorMsg,
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      message: `Baglanti hatasi: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
    });
  }
}
