import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cacheGet, cacheSet } from "@/lib/redis";

const CACHE_KEY = "popups:active";
const CACHE_TTL = 300; // 5 dakika

export async function GET() {
  try {
    // Redis cache kontrol
    const cached = await cacheGet<unknown[]>(CACHE_KEY);
    if (cached) {
      return NextResponse.json({ popups: cached });
    }

    const popups = await prisma.popup.findMany({
      where: { isActive: true },
      orderBy: { id: "desc" },
    });

    // Redis'e cache'le
    await cacheSet(CACHE_KEY, popups, CACHE_TTL);

    return NextResponse.json({ popups });
  } catch (error) {
    console.error("Active popups error:", error);
    return NextResponse.json({ popups: [] });
  }
}
