import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: { group: "theme" },
    });

    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }

    return NextResponse.json(
      { settings: result },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Theme settings error:", error);
    return NextResponse.json({ error: "Tema ayarlari yuklenemedi" }, { status: 500 });
  }
}
