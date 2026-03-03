import type { TrendyolProductResponse, TrendyolProductData } from "./types";

const DISCOVERY_API =
  "https://public.trendyol.com/discovery-web-productgw-service/api/productDetail";

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
 * Trendyol public API'den urun detaylarini cek
 */
export async function fetchTrendyolProduct(
  contentId: string
): Promise<TrendyolProductData> {
  const url = `${DISCOVERY_API}/${contentId}`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }

      const res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
          "Accept-Language": "tr-TR,tr;q=0.9",
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`Urun bulunamadi (Content ID: ${contentId})`);
        }
        throw new Error(`Trendyol API hatasi: HTTP ${res.status}`);
      }

      const data = (await res.json()) as TrendyolProductResponse;

      if (!data.isSuccess || !data.result) {
        throw new Error("Trendyol API basarisiz yanit dondu");
      }

      return data.result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // 404 ise retry yapma
      if (lastError.message.includes("bulunamadi")) throw lastError;
    }
  }

  throw lastError || new Error("Trendyol API baglanti hatasi");
}
