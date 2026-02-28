import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

const DEFAULT_PREFERENCES = {
  email_orders: true,
  email_promotions: true,
  email_stock_alerts: true,
  email_newsletter: true,
  push_orders: true,
  push_promotions: true,
  push_stock_alerts: true,
  push_cart_reminders: true,
};

// GET - Kullanicinin bildirim tercihlerini getir
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Giris yapmaniz gerekiyor" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { notificationPreferences: true },
    });

    // Mevcut tercihleri default ile birlestir
    const currentPrefs = (user?.notificationPreferences as Record<string, boolean>) || {};
    const preferences = { ...DEFAULT_PREFERENCES, ...currentPrefs };

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Get notification preferences error:", error);
    return NextResponse.json({ error: "Tercihler alinamadi" }, { status: 500 });
  }
}

// PUT - Kullanicinin bildirim tercihlerini guncelle
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Giris yapmaniz gerekiyor" }, { status: 401 });
    }

    const body = await request.json();
    const { preferences } = body;

    if (!preferences || typeof preferences !== "object") {
      return NextResponse.json({ error: "Gecersiz veri" }, { status: 400 });
    }

    // Sadece izin verilen anahtarlari kabul et
    const allowedKeys = Object.keys(DEFAULT_PREFERENCES);
    const sanitized: Record<string, boolean> = {};
    for (const key of allowedKeys) {
      if (key in preferences) {
        sanitized[key] = Boolean(preferences[key]);
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { notificationPreferences: sanitized },
    });

    return NextResponse.json({ message: "Tercihler guncellendi", preferences: sanitized });
  } catch (error) {
    console.error("Update notification preferences error:", error);
    return NextResponse.json({ error: "Tercihler guncellenemedi" }, { status: 500 });
  }
}
