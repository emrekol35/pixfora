import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST - Kupon kodu dogrulama (checkout icin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal } = body;

    if (!code) {
      return NextResponse.json({ valid: false, message: "Kupon kodu gerekli" });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ valid: false, message: "Gecersiz kupon kodu" });
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      return NextResponse.json({ valid: false, message: "Bu kupon henuz aktif degil" });
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      return NextResponse.json({ valid: false, message: "Bu kuponun suresi dolmus" });
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, message: "Bu kupon kullanim limitine ulasmis" });
    }
    if (coupon.minOrder && subtotal && subtotal < coupon.minOrder) {
      return NextResponse.json({
        valid: false,
        message: `Min. siparis tutari: ${coupon.minOrder.toFixed(2)} TL`,
      });
    }

    let discount = 0;
    if (coupon.type === "PERCENTAGE") {
      discount = ((subtotal || 0) * coupon.value) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else if (coupon.type === "FIXED_AMOUNT") {
      discount = coupon.value;
    }

    return NextResponse.json({
      valid: true,
      type: coupon.type,
      value: coupon.value,
      discount,
      message:
        coupon.type === "FREE_SHIPPING"
          ? "Ucretsiz kargo uygulanacak"
          : `${discount.toFixed(2)} TL indirim uygulanacak`,
    });
  } catch (error) {
    console.error("Coupon validate error:", error);
    return NextResponse.json({ valid: false, message: "Dogrulama hatasi" });
  }
}
