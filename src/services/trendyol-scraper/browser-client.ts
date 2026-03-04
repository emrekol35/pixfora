import puppeteer, { Browser } from "puppeteer-core";
import type { TrendyolListProduct, TrendyolListResult } from "./types";

/**
 * Chromium executable path — Docker'da system Chromium,
 * development'ta macOS/Linux Chrome kullanir.
 */
function getChromiumPath(): string {
  // Docker / Alpine
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;

  // macOS
  const macPaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];
  for (const p of macPaths) {
    try {
      require("fs").accessSync(p);
      return p;
    } catch {
      // devam et
    }
  }

  // Linux
  const linuxPaths = [
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
  ];
  for (const p of linuxPaths) {
    try {
      require("fs").accessSync(p);
      return p;
    } catch {
      // devam et
    }
  }

  return "/usr/bin/chromium-browser";
}

/**
 * Singleton browser instance — her request'te yeni browser acmak yerine
 * mevcut browser'i yeniden kullanir. Idle kalirsa otomatik kapanir.
 */
let browserInstance: Browser | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
const IDLE_TIMEOUT = 60_000; // 60 saniye idle sonrasi kapat

async function getBrowser(): Promise<Browser> {
  // Idle timer'i sifirla
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }

  // Mevcut browser varsa ve bagliysa kullan
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  const executablePath = getChromiumPath();
  console.log(`[Trendyol Browser] Chromium baslatiliyor: ${executablePath}`);

  browserInstance = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-default-apps",
      "--no-first-run",
      "--single-process",
      "--disable-features=site-per-process",
    ],
  });

  // Browser kapanirsa referansi temizle
  browserInstance.on("disconnected", () => {
    browserInstance = null;
  });

  return browserInstance;
}

function scheduleIdleClose() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    if (browserInstance && browserInstance.connected) {
      console.log("[Trendyol Browser] Idle timeout, browser kapatiliyor");
      await browserInstance.close().catch(() => {});
      browserInstance = null;
    }
  }, IDLE_TIMEOUT);
}

/**
 * Puppeteer ile Trendyol sayfasini aç ve urun verilerini cek.
 * Cloudflare/WAF bypass icin gercek bir tarayici kullanir.
 */
export async function fetchTrendyolWithBrowser(
  url: string,
  offset?: number
): Promise<TrendyolListResult> {
  let finalUrl = url;
  if (offset !== undefined) {
    try {
      const u = new URL(url);
      u.searchParams.set("offset", String(offset));
      finalUrl = u.toString();
    } catch {
      finalUrl = `${url}${url.includes("?") ? "&" : "?"}offset=${offset}`;
    }
  }

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Gercek bir tarayici gibi davran
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    });

    // Gereksiz kaynaklari engelle (hiz icin)
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "stylesheet", "font", "media"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    console.log(`[Trendyol Browser] Sayfa aciliyor: ${finalUrl}`);

    await page.goto(finalUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    // Sayfanin urun verisi yuklemesini bekle
    await page.waitForFunction(
      () => {
        return (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          !!(window as any)["__single-search-result__PROPS"] ||
          document.querySelectorAll('[data-testid="product-card"]').length > 0 ||
          document.querySelectorAll(".p-card-wrppr").length > 0
        );
      },
      { timeout: 15_000 }
    ).catch(() => {
      // Timeout olursa devam et, belki veri zaten HTML'de
    });

    // __single-search-result__PROPS verisini al
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageData = await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const props = (window as any)["__single-search-result__PROPS"];
      if (props) return JSON.parse(JSON.stringify(props));

      // Fallback: script tag'inden al
      const scripts = document.querySelectorAll("script");
      for (const script of scripts) {
        const text = script.textContent || "";
        if (text.includes("__single-search-result__PROPS")) {
          const match = text.match(
            /window\["__single-search-result__PROPS"\]\s*=\s*(\{[\s\S]*?\})\s*;?\s*(?:<\/script>|$)/
          );
          if (match) {
            try {
              return JSON.parse(match[1].replace(/\\u002F/g, "/"));
            } catch {
              // parse hatasi
            }
          }
        }
      }

      return null;
    });

    if (!pageData) {
      // Cloudflare challenge kontrolu
      const pageContent = await page.content();
      if (
        pageContent.includes("cloudflare") ||
        pageContent.includes("Attention Required") ||
        pageContent.includes("cf-challenge")
      ) {
        throw new Error(
          "Trendyol Cloudflare korumasi devrede. Birkac saniye sonra tekrar deneyin."
        );
      }
      throw new Error(
        "Urun verisi sayfadan cikarilmadi. URL'nin gecerli bir Trendyol sayfasi oldugundan emin olun."
      );
    }

    // Urun verilerini parse et
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawProducts: any[] =
      pageData?.data?.products || pageData?.products || [];

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
            totalCount:
              p.ratingScore.totalCount || p.ratingScore.totalRatingCount || 0,
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
      pageData?.data?.total ??
      pageData?.data?.totalCount ??
      pageData?.totalCount ??
      products.length;

    let currentPage = 1;
    try {
      const parsedUrl = new URL(finalUrl);
      const pi = parsedUrl.searchParams.get("pi");
      if (pi && /^\d+$/.test(pi)) currentPage = parseInt(pi, 10);
    } catch {
      // URL parse hatasi
    }

    const PRODUCTS_PER_PAGE = 24;
    const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCTS_PER_PAGE));

    const nextOffset: number | undefined =
      pageData?.data?.offset ?? pageData?.offset ?? undefined;

    console.log(
      `[Trendyol Browser] ${products.length} urun bulundu, toplam: ${totalCount}`
    );

    return { products, totalCount, currentPage, totalPages, nextOffset };
  } finally {
    await page.close().catch(() => {});
    scheduleIdleClose();
  }
}

/**
 * Puppeteer ile tek bir Trendyol urun sayfasindan veri cek.
 */
export async function fetchTrendyolProductWithBrowser(
  contentId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const pageUrl = `https://www.trendyol.com/x/y-p-${contentId}`;
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "stylesheet", "font", "media"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(pageUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productData = await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const envoy = (window as any)["__envoy__PROPS"];
      if (envoy) return JSON.parse(JSON.stringify(envoy));

      const scripts = document.querySelectorAll("script");
      for (const script of scripts) {
        const text = script.textContent || "";
        if (text.includes("__envoy__PROPS")) {
          const match = text.match(
            /window\["__envoy__PROPS"\]\s*=\s*(\{[\s\S]*?\})\s*;?\s*(?:<\/script>|$)/
          );
          if (match) {
            try {
              return JSON.parse(match[1].replace(/\\u002F/g, "/"));
            } catch {
              // parse hatasi
            }
          }
        }
      }

      return null;
    });

    if (!productData || !productData.product) {
      throw new Error(`Urun bulunamadi (Content ID: ${contentId})`);
    }

    return productData.product;
  } finally {
    await page.close().catch(() => {});
    scheduleIdleClose();
  }
}
