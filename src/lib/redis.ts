import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn("REDIS_URL not set, caching disabled");
    return null;
  }

  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null; // 3 denemeden sonra vazgeç
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    client.on("error", (err) => {
      console.error("Redis connection error:", err.message);
    });

    client.connect().catch(() => {
      // Bağlantı hatası — sessizce devam et
    });

    return client;
  } catch {
    console.warn("Redis client creation failed, caching disabled");
    return null;
  }
}

const redis = globalForRedis.redis ?? createRedisClient();
if (process.env.NODE_ENV !== "production" && redis) {
  globalForRedis.redis = redis;
}

/**
 * Cache'den veri oku.
 * Redis bağlantısı yoksa veya hata olursa null döner (cache miss).
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

/**
 * Cache'e veri yaz.
 * @param key Cache key
 * @param data Veri (JSON serialize edilir)
 * @param ttlSeconds Ömür (saniye)
 */
export async function cacheSet(
  key: string,
  data: unknown,
  ttlSeconds: number
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(data), "EX", ttlSeconds);
  } catch {
    // Cache yazma hatası — sessizce devam et
  }
}

/**
 * Tek bir cache key'i sil.
 */
export async function cacheDelete(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // Sessizce devam et
  }
}

/**
 * Pattern bazlı cache silme.
 * Örnek: cacheDeletePattern("home:*") → home: ile başlayan tüm key'leri siler.
 */
export async function cacheDeletePattern(pattern: string): Promise<void> {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Sessizce devam et
  }
}

export { redis };
