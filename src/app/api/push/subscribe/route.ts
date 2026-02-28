import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, userAgent } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json(
        { error: "Gecersiz subscription verisi" },
        { status: 400 }
      );
    }

    // Oturum varsa userId al
    const session = await auth();
    const userId = session?.user?.id || null;

    // Upsert: Ayni endpoint varsa guncelle, yoksa olustur
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId,
        userAgent: userAgent || null,
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userId,
        userAgent: userAgent || null,
      },
    });

    return NextResponse.json({ message: "Push aboneligi kaydedildi" });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json(
      { error: "Push aboneligi kaydedilemedi" },
      { status: 500 }
    );
  }
}
