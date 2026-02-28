import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const API_URLS = {
  production: "https://api.mngkargo.com.tr/mngapi/api",
  test: "https://testapi.mngkargo.com.tr/mngapi/api",
  sandbox: "https://sandbox.mngkargo.com.tr/mngapi/api",
};

// MNG Kargo (DHL eCommerce) API baglanti testi
// Hem production hem test ortamini dener
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

    const reqBody = JSON.stringify({
      customerNumber,
      password,
      identityType: 1,
    });

    const headers = {
      "Content-Type": "application/json",
      "X-IBM-Client-Id": clientId,
      "X-IBM-Client-Secret": clientSecret,
    };

    // Tum ortamlari dene
    const results: { env: string; url: string; status: number; data: Record<string, unknown> }[] = [];

    for (const [env, baseUrl] of Object.entries(API_URLS)) {
      try {
        const res = await fetch(`${baseUrl}/token`, {
          method: "POST",
          headers,
          body: reqBody,
        });
        const data = (await res.json()) as Record<string, unknown>;
        results.push({ env, url: baseUrl, status: res.status, data });

        // Basarili baglanti bulduk
        if (res.ok && (data.jwt || data.token)) {
          return NextResponse.json({
            connected: true,
            message: `MNG Kargo API baglandi! (${env}: ${baseUrl})`,
            apiUrl: baseUrl,
            environment: env,
          });
        }
      } catch (err) {
        results.push({
          env,
          url: baseUrl,
          status: 0,
          data: { error: err instanceof Error ? err.message : "Bilinmeyen hata" },
        });
      }
    }

    // Hicbiri basarili olmadi - detayli rapor dondur
    const report = results.map((r) => {
      const parts: string[] = [`[${r.env}] HTTP ${r.status}`];
      if (r.data.httpMessage) parts.push(r.data.httpMessage as string);
      if (r.data.moreInformation) parts.push(r.data.moreInformation as string);
      if (r.data.message) parts.push(r.data.message as string);
      if (r.data.error) parts.push(r.data.error as string);
      return parts.join(" - ");
    });

    return NextResponse.json({
      connected: false,
      message: `Tum ortamlar denendi, baglanti kurulamadi:\n${report.join("\n")}`,
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      message: `Baglanti hatasi: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
    });
  }
}
