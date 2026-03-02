import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// MNG Kargo API ortamlari
// Sandbox URL artik aktif degil (HTML donduruyordu), kaldirildi
const API_URLS = {
  production: "https://api.mngkargo.com.tr/mngapi/api",
  test: "https://testapi.mngkargo.com.tr/mngapi/api",
};

// Hata aciklamalari — kullaniciya ne yapmasi gerektigini soyler
function getErrorHint(env: string, status: number, data: Record<string, unknown>): string {
  const msg = ((data.httpMessage || data.message || data.moreInformation || "") as string).toLowerCase();

  if (status === 401 && msg.includes("subscription")) {
    return "Client ID bu API'ye subscribe edilmemis. apizone.mngkargo.com.tr portalinda uygulamanizi Identity API, Standard Command API ve Standard Query API'ye subscribe edin.";
  }
  if (status === 401 && (msg.includes("invalid client") || msg.includes("client id"))) {
    return `Client ID veya Client Secret ${env} ortami icin gecersiz. apizone.mngkargo.com.tr portalindan dogru degerleri kopyalayin.`;
  }
  if (status === 401) {
    return "Musteri numarasi veya sifre hatali. MNG Kargo subenizden aldiginiz bilgileri kontrol edin.";
  }
  if (status === 0) {
    return `${env} ortamina erisilemiyor. Sunucu baglantisi kontrol edin.`;
  }
  return "";
}

// MNG Kargo (DHL eCommerce) API baglanti testi
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

    // Ortamlari dene
    const results: { env: string; url: string; status: number; data: Record<string, unknown>; hint: string }[] = [];

    for (const [env, baseUrl] of Object.entries(API_URLS)) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const res = await fetch(`${baseUrl}/token`, {
          method: "POST",
          headers,
          body: reqBody,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        // JSON parse hatasi icin kontrol — bazi ortamlar HTML dondurebiliyor
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("json")) {
          results.push({
            env,
            url: baseUrl,
            status: res.status,
            data: { error: `JSON degil, ${contentType || "bos"} content-type dondu. Bu ortam aktif olmayabilir.` },
            hint: `${env} ortami JSON yerine HTML donduruyor. Bu URL gecerli bir API endpoint degil.`,
          });
          continue;
        }

        const data = (await res.json()) as Record<string, unknown>;

        // Basarili baglanti bulduk
        if (res.ok && (data.jwt || data.token)) {
          return NextResponse.json({
            connected: true,
            message: `MNG Kargo API baglandi! (${env}: ${baseUrl})`,
            apiUrl: baseUrl,
            environment: env,
          });
        }

        results.push({
          env,
          url: baseUrl,
          status: res.status,
          data,
          hint: getErrorHint(env, res.status, data),
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Bilinmeyen hata";
        results.push({
          env,
          url: baseUrl,
          status: 0,
          data: { error: errMsg },
          hint: errMsg.includes("abort")
            ? `${env} ortami 15 saniyede yanit vermedi (timeout).`
            : getErrorHint(env, 0, {}),
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
      const line = parts.join(" - ");
      return r.hint ? `${line}\n   → ${r.hint}` : line;
    });

    return NextResponse.json({
      connected: false,
      message: `Baglanti kurulamadi:\n${report.join("\n")}`,
      hint: "apizone.mngkargo.com.tr portalinda uygulamanizin API subscriptions'larini kontrol edin. Production icin Identity API + Standard Command API + Standard Query API'ye subscribe olmalisiniz.",
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      message: `Baglanti hatasi: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
    });
  }
}
