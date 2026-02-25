import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Siparis detayi
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: { images: { take: 1, orderBy: { order: "asc" } } },
            },
            variant: true,
          },
        },
        user: { select: { name: true, email: true, phone: true } },
        shippingAddress: true,
        billingAddress: true,
        payments: true,
        coupon: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Siparis bulunamadi" }, { status: 404 });
    }

    // Yetki kontrolu - admin veya siparis sahibi
    if (session?.user?.role !== "ADMIN" && order.userId !== session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Order get error:", error);
    return NextResponse.json({ error: "Siparis alinamadi" }, { status: 500 });
  }
}

// PUT - Siparis guncelle (admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { status, trackingNumber, shippingCompany, paymentStatus, note } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (status) updateData.status = status;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (shippingCompany !== undefined) updateData.shippingCompany = shippingCompany;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (note !== undefined) updateData.note = note;

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        user: { select: { name: true, email: true } },
      },
    });

    // Iptal durumunda stok iade
    if (status === "CANCELLED") {
      for (const item of order.items) {
        if (item.variantId) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ error: "Siparis guncellenemedi" }, { status: 500 });
  }
}
