import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Tek kupon getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { id } = await params;
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Kupon bulunamadi" }, { status: 404 });
    }

    return NextResponse.json(coupon);
  } catch (error) {
    console.error("Coupon get error:", error);
    return NextResponse.json({ error: "Kupon alinamadi" }, { status: 500 });
  }
}

// PUT - Kupon guncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { code, type, value, minOrder, maxDiscount, maxUses, isActive, startsAt, expiresAt } = body;

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kupon bulunamadi" }, { status: 404 });
    }

    // Kod degistiyse uniqueness kontrol
    if (code) {
      const upperCode = code.toUpperCase().trim();
      if (upperCode !== existing.code) {
        const duplicate = await prisma.coupon.findUnique({ where: { code: upperCode } });
        if (duplicate) {
          return NextResponse.json({ error: "Bu kupon kodu zaten mevcut" }, { status: 400 });
        }
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(code && { code: code.toUpperCase().trim() }),
        ...(type && { type }),
        ...(value !== undefined && { value: parseFloat(value) }),
        minOrder: minOrder !== undefined ? (minOrder ? parseFloat(minOrder) : null) : undefined,
        maxDiscount: maxDiscount !== undefined ? (maxDiscount ? parseFloat(maxDiscount) : null) : undefined,
        maxUses: maxUses !== undefined ? (maxUses ? parseInt(maxUses) : null) : undefined,
        ...(isActive !== undefined && { isActive }),
        startsAt: startsAt !== undefined ? (startsAt ? new Date(startsAt) : null) : undefined,
        expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : undefined,
      },
    });

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Coupon update error:", error);
    return NextResponse.json({ error: "Kupon guncellenemedi" }, { status: 500 });
  }
}

// DELETE - Kupon sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.coupon.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Coupon delete error:", error);
    return NextResponse.json({ error: "Kupon silinemedi" }, { status: 500 });
  }
}
