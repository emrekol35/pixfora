import type {
  TrendyolEnvoyProps,
  TrendyolProductData,
  TrendyolListProduct,
  TrendyolListResult,
} from "./types";

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

/**
 * Balanced brace matching ile JSON blogu cikar.
 * Regex non-greedy `{...}` nested JSON icin guvenilir degil.
 */
function extractJsonBlock(html: string, startIndex: number): string | null {
  let depth = 0;
  let jsonStart = -1;

  for (let i = startIndex; i < html.length && i < startIndex + 2_000_000; i++) {
    if (html[i] === "{" && jsonStart === -1) {
      jsonStart = i;
      depth = 1;
    } else if (html[i] === "{" && jsonStart >= 0) {
      depth++;
    } else if (html[i] === "}" && jsonStart >= 0) {
      depth--;
      if (depth === 0) {
        return html.slice(jsonStart, i + 1);
      }
    }
  }

  return null;
}

/**
 * Trendyol kategori/liste sayfasindan urun listesini cek.
 * window["__single-search-result__PROPS"] icindeki JSON'u parse eder.
 *
 * Desteklenen URL'ler:
 * - Kategori: https://www.trendyol.com/erkek-spor-ayakkabi-x-c114?pi=1
 * - Butik:    https://www.trendyol.com/butik/liste/...
 * - Arama:    https://www.trendyol.com/sr?q=... (Cloudflare engelleyebilir)
 */
export async function fetchTrendyolListProducts(
  listUrl: string
): Promise<TrendyolListResult> {
  const res = await fetch(listUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
      "Cache-Control": "no-cache",
    },
    redirect: "follow",
  });

  if (res.status === 403) {
    throw new Error(
      "Trendyol bu sayfayi engelledi (Cloudflare 403). Kategori linki kullanmayi deneyin: ornek https://www.trendyol.com/erkek-spor-ayakkabi-x-c114"
    );
  }

  if (!res.ok) {
    throw new Error(`Trendyol sayfa hatasi: HTTP ${res.status}`);
  }

  const html = await res.text();

  // __single-search-result__PROPS icindeki JSON'u bul
  const marker = 'window["__single-search-result__PROPS"]';
  const markerIndex = html.indexOf(marker);

  if (markerIndex === -1) {
    // Cloudflare challenge sayfasi olabilir
    if (html.includes("cloudflare") || html.includes("Attention Required")) {
      throw new Error(
        "Trendyol bu sayfayi engelledi (Cloudflare). Kategori linki kullanmayi deneyin."
      );
    }
    throw new Error(
      "Urun listesi verisi bulunamadi. URL'nin bir Trendyol kategori/liste sayfasi oldugundan emin olun."
    );
  }

  // = isareti sonrasi JSON baslangicindan itibaren balanced brace matching
  const eqIndex = html.indexOf("=", markerIndex + marker.length);
  if (eqIndex === -1) {
    throw new Error("Urun listesi verisi parse edilemedi.");
  }

  const rawJson = extractJsonBlock(html, eqIndex + 1);
  if (!rawJson) {
    throw new Error("Urun listesi JSON'u cikarilmadi.");
  }

  const data = JSON.parse(rawJson.replace(/\\u002F/g, "/"));

  // products dizisini bul
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawProducts: any[] = data?.data?.products || data?.products || [];

  if (rawProducts.length === 0) {
    throw new Error("Bu sayfada urun bulunamadi.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products: TrendyolListProduct[] = rawProducts.map((p: any) => ({
    id: p.id,
    name: p.name || "",
    brand: typeof p.brand === "string" ? p.brand : p.brand?.name || "",
    url: p.url || "",
    price: {
      current:
        p.price?.discountedPrice?.value ??
        p.price?.sellingPrice?.value ??
        p.price?.originalPrice ??
        0,
      original: p.price?.originalPrice ?? undefined,
      discounted: p.price?.discountedPrice?.value ?? undefined,
      currency: p.price?.currency || "TRY",
    },
    image:
      typeof p.image === "string"
        ? p.image
        : Array.isArray(p.images)
          ? p.images[0]
          : "",
    ratingScore: p.ratingScore
      ? {
          averageRating: p.ratingScore.averageRating,
          totalCount: p.ratingScore.totalCount || p.ratingScore.totalRatingCount || 0,
        }
      : undefined,
    merchantName: p.merchantName || undefined,
    categoryName:
      typeof p.category === "string"
        ? p.category
        : p.category?.name || undefined,
    freeCargo: p.freeCargo ?? undefined,
    hasStock: p.hasStock ?? p.inStock ?? true,
  }));

  // Sayfa bilgisi
  const totalCount =
    data?.data?.totalCount ?? data?.totalCount ?? products.length;
  const currentPage = data?.data?.currentPage ?? data?.currentPage ?? 1;
  const totalPages =
    data?.data?.totalPages ??
    data?.totalPages ??
    Math.ceil(totalCount / 24);

  return { products, totalCount, currentPage, totalPages };
}
