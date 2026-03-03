import type { TrendyolEnvoyProps, TrendyolProductData } from "./types";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Trendyol URL'inden content ID cikart
 * Ornek: https://www.trendyol.com/marka/urun-adi-p-123456789 → "123456789"
 */
export function parseContentIdFromUrl(url: string): string | null {
  const trimmed = url.trim();

  // Sadece sayi ise dogrudan content ID
  if (/^\d+$/.test(trimmed)) return trimmed;

  // URL'den -p-{id} pattern'ini bul
  const match = trimmed.match(/-p-(\d+)/);
  if (match) return match[1];

  // ?contentId= parametresi
  try {
    const parsed = new URL(trimmed);
    const contentId = parsed.searchParams.get("contentId");
    if (contentId && /^\d+$/.test(contentId)) return contentId;
  } catch {
    // URL parse edilemezse devam et
  }

  return null;
}

/**
 * Trendyol urun sayfasindan HTML scraping ile urun bilgilerini cek.
 * window["__envoy__PROPS"] icindeki JSON verisini parse eder.
 */
export async function fetchTrendyolProduct(
  contentId: string
): Promise<TrendyolProductData> {
  // Slug onemli degil, sadece -p-{id} yeterli — Trendyol 301 ile yonlendiriyor
  const pageUrl = `https://www.trendyol.com/x/y-p-${contentId}`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }

      const res = await fetch(pageUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "no-cache",
        },
        redirect: "follow",
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`Urun bulunamadi (Content ID: ${contentId})`);
        }
        throw new Error(`Trendyol sayfa hatasi: HTTP ${res.status}`);
      }

      const html = await res.text();

      // window["__envoy__PROPS"] JSON'unu cikar
      const envoyMatch = html.match(
        /window\["__envoy__PROPS"\]\s*=\s*(\{[\s\S]*?\})\s*<\/script>/
      );

      if (!envoyMatch) {
        throw new Error(
          "Urun verisi HTML'den cikarilmadi. Trendyol sayfa yapisi degismis olabilir."
        );
      }

      // Unicode escape'leri duzelt (\u002F → /)
      const rawJson = envoyMatch[1].replace(/\\u002F/g, "/");
      const envoyData = JSON.parse(rawJson) as TrendyolEnvoyProps;

      if (envoyData.st === 404 || !envoyData.product) {
        throw new Error(`Urun bulunamadi (Content ID: ${contentId})`);
      }

      const product = envoyData.product;

      // Bos urun verisi kontrolu
      if (!product.name && !product.id) {
        throw new Error(
          "Urun verisi bos. Trendyol sayfasi istemci tarafinda yukleniyor olabilir."
        );
      }

      return product;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // 404 ise retry yapma
      if (lastError.message.includes("bulunamadi")) throw lastError;
    }
  }

  throw lastError || new Error("Trendyol baglanti hatasi");
}
