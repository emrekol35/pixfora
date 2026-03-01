import { prisma } from "@/lib/db";

// ---------- Types ----------

export interface N11Credentials {
  appKey: string;
  appSecret: string;
  integrator: string;
}

interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  params?: Record<string, string | number | undefined>;
}

interface RateLimitState {
  tokens: number;
  lastRefill: number;
}

// ---------- Constants ----------

const BASE_URL = "https://api.n11.com";

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000;

// Rate limits
const RATE_LIMITS = {
  product: { max: 100, window: 60_000 },    // 100/dakika
  order: { max: 1000, window: 60_000 },     // 1000/dakika
  category: { max: 100, window: 60_000 },   // 100/dakika
};

// ---------- N11Client ----------

export class N11Client {
  private appKey: string;
  private appSecret: string;
  private _integrator: string;
  private rateLimitStates: Record<string, RateLimitState>;

  constructor(credentials: N11Credentials) {
    this.appKey = credentials.appKey;
    this.appSecret = credentials.appSecret;
    this._integrator = credentials.integrator;

    this.rateLimitStates = {
      product: { tokens: RATE_LIMITS.product.max, lastRefill: Date.now() },
      order: { tokens: RATE_LIMITS.order.max, lastRefill: Date.now() },
      category: { tokens: RATE_LIMITS.category.max, lastRefill: Date.now() },
    };
  }

  get integrator(): string {
    return this._integrator;
  }

  // ---------- Rate Limiting ----------

  private getRateLimitKey(path: string): string {
    if (path.includes("/product") || path.includes("/cdn/categ")) return "product";
    if (path.includes("/order") || path.includes("/delivery") || path.includes("/shipment")) return "order";
    return "product";
  }

  private async waitForRateLimit(path: string): Promise<void> {
    const key = this.getRateLimitKey(path);
    const state = this.rateLimitStates[key];
    const limit = RATE_LIMITS[key as keyof typeof RATE_LIMITS] || RATE_LIMITS.product;
    const now = Date.now();
    const elapsed = now - state.lastRefill;

    if (elapsed >= limit.window) {
      state.tokens = limit.max;
      state.lastRefill = now;
    }

    if (state.tokens <= 0) {
      const waitTime = limit.window - (now - state.lastRefill);
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
      state.tokens = limit.max;
      state.lastRefill = Date.now();
    }

    state.tokens--;
  }

  // ---------- Request ----------

  async request<T = unknown>(options: RequestOptions): Promise<T> {
    const { method, path, body, params } = options;

    const url = new URL(path, BASE_URL);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      await this.waitForRateLimit(path);

      try {
        const headers: Record<string, string> = {
          appkey: this.appKey,
          appsecret: this.appSecret,
          Accept: "application/json",
        };

        if (body && (method === "POST" || method === "PUT")) {
          headers["Content-Type"] = "application/json";
        }

        const fetchOptions: RequestInit = { method, headers };

        if (body && (method === "POST" || method === "PUT")) {
          fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url.toString(), fetchOptions);

        // 429 Rate Limit
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const waitMs = retryAfter
            ? parseInt(retryAfter) * 1000
            : RETRY_BASE_DELAY * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }

        if (!response.ok) {
          let errorBody = "";
          try {
            errorBody = await response.text();
          } catch {
            errorBody = response.statusText;
          }

          // 5xx — tekrar dene
          if (response.status >= 500) {
            lastError = new Error(
              `N11 API ${response.status}: ${errorBody || response.statusText}`
            );
            if (attempt < MAX_RETRIES - 1) {
              await new Promise((resolve) =>
                setTimeout(resolve, RETRY_BASE_DELAY * Math.pow(2, attempt))
              );
              continue;
            }
            throw lastError;
          }

          // 4xx — tekrar deneme
          throw new Error(`N11 API Hata ${response.status}: ${errorBody}`);
        }

        // Boş yanıt kontrolü
        const responseContentType = response.headers.get("content-type");
        if (responseContentType?.includes("application/json")) {
          return (await response.json()) as T;
        }

        const text = await response.text();
        if (text) {
          try {
            return JSON.parse(text) as T;
          } catch {
            return text as unknown as T;
          }
        }

        return {} as T;
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error(String(error));

        // Ağ hataları — tekrar dene
        if (
          attempt < MAX_RETRIES - 1 &&
          (lastError.message.includes("fetch failed") ||
            lastError.message.includes("ECONNRESET") ||
            lastError.message.includes("ETIMEDOUT"))
        ) {
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_BASE_DELAY * Math.pow(2, attempt))
          );
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error("N11 API isteği başarısız");
  }
}

// ---------- Factory ----------

let cachedClient: N11Client | null = null;

export async function getN11Client(): Promise<N11Client> {
  if (cachedClient) return cachedClient;

  const integration = await prisma.integration.findUnique({
    where: { service: "n11" },
  });

  if (!integration || !integration.isActive || !integration.config) {
    throw new Error("N11 entegrasyonu yapılandırılmamış veya aktif değil");
  }

  const config = integration.config as Record<string, string>;
  const { appKey, appSecret, integrator } = config;

  if (!appKey || !appSecret) {
    throw new Error("N11 API kimlik bilgileri eksik (appKey, appSecret)");
  }

  cachedClient = new N11Client({
    appKey,
    appSecret,
    integrator: integrator || "Pixfora",
  });
  return cachedClient;
}

/** Entegrasyon aktif mi kontrol et */
export async function isN11Configured(): Promise<boolean> {
  try {
    const integration = await prisma.integration.findUnique({
      where: { service: "n11" },
    });

    if (!integration?.isActive || !integration.config) return false;

    const config = integration.config as Record<string, string>;
    return !!(config.appKey && config.appSecret);
  } catch {
    return false;
  }
}

/** Cached client'ı sıfırla (credential değişikliğinde) */
export function resetN11Client(): void {
  cachedClient = null;
}
