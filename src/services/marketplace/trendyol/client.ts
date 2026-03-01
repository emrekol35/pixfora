import { prisma } from "@/lib/db";

// ---------- Types ----------

export interface TrendyolCredentials {
  supplierId: string;
  apiKey: string;
  apiSecret: string;
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

const BASE_URL = "https://apigw.trendyol.com";
const MAX_RETRIES = 3;
const RATE_LIMIT_MAX = 50; // 50 istek
const RATE_LIMIT_WINDOW = 10_000; // 10 saniye
const RETRY_BASE_DELAY = 1000; // 1 saniye

// ---------- TrendyolClient ----------

export class TrendyolClient {
  private supplierId: string;
  private apiKey: string;
  private apiSecret: string;
  private rateLimitState: RateLimitState;

  constructor(credentials: TrendyolCredentials) {
    this.supplierId = credentials.supplierId;
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
    this.rateLimitState = {
      tokens: RATE_LIMIT_MAX,
      lastRefill: Date.now(),
    };
  }

  get supplierIdValue(): string {
    return this.supplierId;
  }

  // ---------- Auth ----------

  private getAuthHeader(): string {
    const encoded = Buffer.from(
      `${this.apiKey}:${this.apiSecret}`
    ).toString("base64");
    return `Basic ${encoded}`;
  }

  private getUserAgent(): string {
    return `${this.supplierId} - SelfIntegration`;
  }

  // ---------- Rate Limiting ----------

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.rateLimitState.lastRefill;

    // Pencere geçtiyse token'ları yenile
    if (elapsed >= RATE_LIMIT_WINDOW) {
      this.rateLimitState.tokens = RATE_LIMIT_MAX;
      this.rateLimitState.lastRefill = now;
    }

    // Token kalmadıysa bekle
    if (this.rateLimitState.tokens <= 0) {
      const waitTime =
        RATE_LIMIT_WINDOW - (now - this.rateLimitState.lastRefill);
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
      this.rateLimitState.tokens = RATE_LIMIT_MAX;
      this.rateLimitState.lastRefill = Date.now();
    }

    this.rateLimitState.tokens--;
  }

  // ---------- Request ----------

  async request<T = unknown>(options: RequestOptions): Promise<T> {
    const { method, path, body, params } = options;

    // URL oluştur
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
      await this.waitForRateLimit();

      try {
        const headers: Record<string, string> = {
          Authorization: this.getAuthHeader(),
          "User-Agent": this.getUserAgent(),
          "Content-Type": "application/json",
        };

        const fetchOptions: RequestInit = {
          method,
          headers,
        };

        if (body && (method === "POST" || method === "PUT")) {
          fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url.toString(), fetchOptions);

        // 429 (Rate Limit) — bekle ve tekrar dene
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const waitMs = retryAfter
            ? parseInt(retryAfter) * 1000
            : RETRY_BASE_DELAY * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }

        // 5xx hataları — tekrar dene
        if (response.status >= 500) {
          lastError = new Error(
            `Trendyol API ${response.status}: ${response.statusText}`
          );
          if (attempt < MAX_RETRIES - 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, RETRY_BASE_DELAY * Math.pow(2, attempt))
            );
            continue;
          }
          throw lastError;
        }

        // 4xx hataları — tekrar deneme
        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            `Trendyol API Hata ${response.status}: ${errorBody}`
          );
        }

        // Boş yanıt kontrolü
        const contentType = response.headers.get("content-type");
        if (
          contentType?.includes("application/json")
        ) {
          return (await response.json()) as T;
        }

        return {} as T;
      } catch (error) {
        lastError =
          error instanceof Error
            ? error
            : new Error(String(error));

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

    throw lastError || new Error("Trendyol API isteği başarısız");
  }

  // ---------- Yardımcı Path Oluşturucular ----------

  supplierPath(suffix: string): string {
    return `/sapigw/suppliers/${this.supplierId}${suffix}`;
  }

  integrationPath(suffix: string): string {
    return `/integration${suffix}`;
  }
}

// ---------- Factory ----------

let cachedClient: TrendyolClient | null = null;

export async function getTrendyolClient(): Promise<TrendyolClient> {
  if (cachedClient) return cachedClient;

  const integration = await prisma.integration.findUnique({
    where: { service: "trendyol" },
  });

  if (!integration || !integration.isActive || !integration.config) {
    throw new Error(
      "Trendyol entegrasyonu yapılandırılmamış veya aktif değil"
    );
  }

  const config = integration.config as Record<string, string>;
  const { supplierId, apiKey, apiSecret } = config;

  if (!supplierId || !apiKey || !apiSecret) {
    throw new Error(
      "Trendyol API kimlik bilgileri eksik (supplierId, apiKey, apiSecret)"
    );
  }

  cachedClient = new TrendyolClient({ supplierId, apiKey, apiSecret });
  return cachedClient;
}

/** Entegrasyon aktif mi kontrol et */
export async function isTrendyolConfigured(): Promise<boolean> {
  try {
    const integration = await prisma.integration.findUnique({
      where: { service: "trendyol" },
    });

    if (!integration?.isActive || !integration.config) return false;

    const config = integration.config as Record<string, string>;
    return !!(config.supplierId && config.apiKey && config.apiSecret);
  } catch {
    return false;
  }
}

/** Cached client'ı sıfırla (credential değişikliğinde) */
export function resetTrendyolClient(): void {
  cachedClient = null;
}
