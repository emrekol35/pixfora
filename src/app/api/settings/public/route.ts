import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ALLOWED_PREFIXES = ["bank_account_", "free_shipping_", "flat_shipping_"];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keys = searchParams.get("keys")?.split(",").filter(Boolean) || [];

    // Only allow whitelisted key prefixes
    const filteredKeys = keys.filter((k) =>
      ALLOWED_PREFIXES.some((prefix) => k.startsWith(prefix))
    );

    if (filteredKeys.length === 0) {
      return NextResponse.json({ settings: {} });
    }

    const settings = await prisma.setting.findMany({
      where: { key: { in: filteredKeys } },
    });

    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }

    return NextResponse.json({ settings: result });
  } catch (error) {
    console.error("Public settings error:", error);
    return NextResponse.json({ error: "Ayarlar yuklenemedi" }, { status: 500 });
  }
}
