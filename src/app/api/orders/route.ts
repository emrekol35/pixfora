import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";

// GET - Siparisleri listele (admin veya kullanici)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (session?.user?.role === "ADMIN") {
      // Admin tum siparisleri gorebilir
      if (status) where.status = status;
    } else if (session?.user?.id) {
      // Kullanici sadece kendi siparislerini gorur
      where.userId = session.user.id;
    } else {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                include: { images: { take: 1, orderBy: { order: "asc" } } },
              },
            },
          },
          user: { select: { name: true, email: true } },
          shippingAddress: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Orders get error:", error);
    return NextResponse.json({ error: "Siparisler alinamadi" }, { status: 500 });
  }
}

// POST - Yeni siparis olustur
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();

    const {
      items, // [{productId, variantId?, quantity, price}]
      shippingAddressId,
      billingAddressId,
      paymentMethod,
      note,
      couponCode,
      guestEmail,
      guestPhone,
      guestName,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Sepet bos" }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: "Odeme yontemi secilmeli" }, { status: 400 });
    }

    // Stok kontrolu & fiyat dogrulama
    let subtotal = 0;
    const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { images: { take: 1, orderBy: { order: "asc" } } },
      });

      if (!product || !product.isActive) {
        return NextResponse.json(
          { error: `Urun bulunamadi: ${item.productId}` },
          { status: 400 }
        );
      }

      let price = product.price;
      let stock = product.stock;
      let variantOptions: Prisma.InputJsonValue | undefined = undefined;

      if (item.variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
        });
        if (!variant || !variant.isActive) {
          return NextResponse.json(
            { error: `Varyant bulunamadi` },
            { status: 400 }
          );
        }
        if (variant.price) price = variant.price;
        stock = variant.stock;
        variantOptions = variant.options as Prisma.InputJsonValue;
      }

      if (stock < item.quantity) {
        return NextResponse.json(
          { error: `Yetersiz stok: ${product.name}` },
          { status: 400 }
        );
      }

      const lineTotal = price * item.quantity;
      subtotal += lineTotal;

      orderItems.push({
        product: { connect: { id: product.id } },
        ...(item.variantId ? { variant: { connect: { id: item.variantId } } } : {}),
        name: product.name,
        sku: product.sku,
        price,
        quantity: item.quantity,
        total: lineTotal,
        options: variantOptions,
      });
    }

    // Kupon kontrolu
    let discount = 0;
    let couponId = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });

      if (coupon && coupon.isActive) {
        const now = new Date();
        const validDate =
          (!coupon.startsAt || coupon.startsAt <= now) &&
          (!coupon.expiresAt || coupon.expiresAt >= now);
        const validUses = !coupon.maxUses || coupon.usedCount < coupon.maxUses;
        const validMin = !coupon.minOrder || subtotal >= coupon.minOrder;

        if (validDate && validUses && validMin) {
          if (coupon.type === "PERCENTAGE") {
            discount = (subtotal * coupon.value) / 100;
            if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
          } else if (coupon.type === "FIXED_AMOUNT") {
            discount = coupon.value;
          }
          couponId = coupon.id;
        }
      }
    }

    // Kargo ucreti (500 TL ustu ucretsiz)
    const shippingCost = subtotal >= 500 ? 0 : 39.9;
    const total = subtotal - discount + shippingCost;

    // Siparis olustur
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: session?.user?.id || null,
        guestEmail: !session?.user?.id ? guestEmail : null,
        guestPhone: !session?.user?.id ? guestPhone : null,
        guestName: !session?.user?.id ? guestName : null,
        status: "PENDING",
        paymentMethod,
        paymentStatus: paymentMethod === "CASH_ON_DELIVERY" ? "PENDING" : "PENDING",
        subtotal,
        shippingCost,
        discount,
        total,
        note,
        shippingAddressId: shippingAddressId || null,
        billingAddressId: billingAddressId || null,
        couponId,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    });

    // Stok dusur
    for (const item of items) {
      if (item.variantId) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Kupon kullanim sayisini artir
    if (couponId) {
      await prisma.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Sepeti temizle
    if (session?.user?.id) {
      await prisma.cartItem.deleteMany({
        where: { userId: session.user.id },
      });
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Order create error:", error);
    return NextResponse.json({ error: "Siparis olusturulamadi" }, { status: 500 });
  }
}
