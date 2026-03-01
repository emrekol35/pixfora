import { prisma } from "@/lib/db";

// ---------- Types ----------

export interface HepsiburadaCredentials {
  merchantId: string; // UUID format
  username: string;
  password: string;
  testMode?: boolean;
}

type ServiceType = "mpop" | "listing" | "oms";

interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  service: ServiceType;
  path: string;
  body?: unknown;
  params?: Record<string, string | number | undefined>;
  contentType?: string;
}

interface RateLimitState {
  tokens: number;
  lastRefill: number;
}

// ---------- Constants ----------

const PRODUCTION_URLS: Record<ServiceType, string> = {
  mpop: "https://mpop.hepsiburada.com",
  listing: "https://listing-external.hepsiburada.com",
  oms: "https://oms-external.hepsiburada.com",
};

const SIT_URLS: Record<ServiceType, string> = {
  mpop: "https://mpop-sit.hepsiburada.com",
  listing: "https://listing-external-sit.hepsiburada.com",
  oms: "https://oms-external-sit.hepsiburada.com",
};

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000;

// Rate limits per service
const RATE_LIMITS: Record<ServiceType, { max: number; window: number }> = {
  mpop: { max: 100, window: 60_000 },    // 100/dakika
  listing: { max: 240, window: 60_000 },  // 240/dakika
  oms: { max: 100, window: 1_000 },       // 100/saniye
};

// ---------- HepsiburadaClient ----------

export class HepsiburadaClient {
  private _merchantId: string;
  private username: string;
  private password: string;
  private testMode: boolean;
  private rateLimitStates: Record<ServiceType, RateLimitState>;

  constructor(credentials: HepsiburadaCredentials) {
    this._merchantId = credentials.merchantId;
    this.username = credentials.username;
    this.password = credentials.password;
    this.testMode = credentials.testMode ?? false;

    this.rateLimitStates = {
      mpop: { tokens: RATE_LIMITS.mpop.max, lastRefill: Date.now() },
      listing: { tokens: RATE_LIMITS.listing.max, lastRefill: Date.now() },
      oms: { tokens: RATE_LIMITS.oms.max, lastRefill: Date.now() },
    };
  }

  get merchantId(): string {
    return this._merchantId;
  }

  // ---------- Auth ----------

  private getAuthHeader(): string {
    const encoded = Buffer.from(
      `${this.username}:${this.password}`
    ).toString("base64");
    return `Basic ${encoded}`;
  }

  // ---------- Base URL ----------

  private getBaseUrl(service: ServiceType): string {
    return this.testMode ? SIT_URLS[service] : PRODUCTION_URLS[service];
  }

  // ---------- Rate Limiting ----------

  private async waitForRateLimit(service: ServiceType): Promise<void> {
    const state = this.rateLimitStates[service];
    const limit = RATE_LIMITS[service];
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
    const { method, service, path, body, params, contentType } = options;

    const baseUrl = this.getBaseUrl(service);
    const url = new URL(path, baseUrl);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      await this.waitForRateLimit(service);

      try {
        const headers: Record<string, string> = {
          Authorization: this.getAuthHeader(),
          Accept: "application/json",
        };

        if (contentType) {
          headers["Content-Type"] = contentType;
        } else if (body && (method === "POST" || method === "PUT")) {
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
              `Hepsiburada API ${response.status}: ${errorBody || response.statusText}`
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
          throw new Error(
            `Hepsiburada API Hata ${response.status}: ${errorBody}`
          );
        }

        // Boş yanıt kontrolü
        const responseContentType = response.headers.get("content-type");
        if (responseContentType?.includes("application/json")) {
          return (await response.json()) as T;
        }

        // Text yanıt
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

    throw lastError || new Error("Hepsiburada API isteği başarısız");
  }
}

// ---------- Factory ----------

let cachedClient: HepsiburadaClient | null = null;

export async function getHepsiburadaClient(): Promise<HepsiburadaClient> {
  if (cachedClient) return cachedClient;

  const integration = await prisma.integration.findUnique({
    where: { service: "hepsiburada" },
  });

  if (!integration || !integration.isActive || !integration.config) {
    throw new Error(
      "Hepsiburada entegrasyonu yapılandırılmamış veya aktif değil"
    );
  }

  const config = integration.config as Record<string, string>;
  const { merchantId, username, password } = config;

  if (!merchantId || !username || !password) {
    throw new Error(
      "Hepsiburada API kimlik bilgileri eksik (merchantId, username, password)"
    );
  }

  cachedClient = new HepsiburadaClient({
    merchantId,
    username,
    password,
    testMode: config.testMode === "true",
  });
  return cachedClient;
}

/** Entegrasyon aktif mi kontrol et */
export async function isHepsiburadaConfigured(): Promise<boolean> {
  try {
    const integration = await prisma.integration.findUnique({
      where: { service: "hepsiburada" },
    });

    if (!integration?.isActive || !integration.config) return false;

    const config = integration.config as Record<string, string>;
    return !!(config.merchantId && config.username && config.password);
  } catch {
    return false;
  }
}

/** Cached client'ı sıfırla (credential değişikliğinde) */
export function resetHepsiburadaClient(): void {
  cachedClient = null;
}
