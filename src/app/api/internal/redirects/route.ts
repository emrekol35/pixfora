import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";

const CACHE_KEY = "seo:redirects";
const CACHE_TTL = 300; // 5 dakika

export async function GET() {
  try {
    // Redis cache kontrolu
    const cached = await cacheGet<
      { fromPath: string; toPath: string; type: number }[]
    >(CACHE_KEY);
    if (cached) {
      return Response.json(cached);
    }

    // DB'den cek
    const redirects = await prisma.redirect.findMany({
      select: { fromPath: true, toPath: true, type: true },
    });

    // Redis'e cache'le
    await cacheSet(CACHE_KEY, redirects, CACHE_TTL);

    return Response.json(redirects);
  } catch {
    return Response.json([]);
  }
}
