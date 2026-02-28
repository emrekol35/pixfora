import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";

const CACHE_KEY = "announcements:active:bar";
const CACHE_TTL = 300; // 5 dakika

export async function GET() {
  try {
    // Redis cache kontrol
    const cached = await cacheGet<unknown[]>(CACHE_KEY);
    if (cached) {
      return NextResponse.json({ announcements: cached });
    }

    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        type: "bar",
      },
      orderBy: { id: "desc" },
    });

    // Redis'e cache'le
    await cacheSet(CACHE_KEY, announcements, CACHE_TTL);

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Active announcements error:", error);
    return NextResponse.json({ announcements: [] });
  }
}
