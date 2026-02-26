import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { sendEmail, orderConfirmationEmail, bankTransferInfoEmail } from "@/lib/email";
import { getBankAccounts } from "@/services/payment/bank-transfer";
import { createNotification } from "@/lib/notifications";

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
      shippingProvider: clientShippingProvider,
      shippingCost: clientShippingCost,
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
          } else if (coupon.type === "FREE_SHIPPING") {
            // Indirim yok ama kargo ucretsiz olacak
          }
          couponId = coupon.id;
        }
      }
    }

    // Grup indirimi kontrolu
    if (session?.user?.id) {
      const userWithGroup = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { group: true },
      });
      if (userWithGroup?.group && userWithGroup.group.discountPercent > 0) {
        const groupDiscount = (subtotal * userWithGroup.group.discountPercent) / 100;
        // Kupon indirimi ile grup indirimi karsilastirilir, buyuk olan uygulanir
        if (groupDiscount > discount) {
          discount = groupDiscount;
        }
      }
    }

    // FREE_SHIPPING kupon kontrolu
    let hasFreeShippingCoupon = false;
    if (couponId && couponCode) {
      const appliedCoupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (appliedCoupon?.type === "FREE_SHIPPING") hasFreeShippingCoupon = true;
    }

    // Kargo ucreti (500 TL ustu veya FREE_SHIPPING kuponu ile ucretsiz)
    let shippingCost: number;
    if (subtotal >= 500 || hasFreeShippingCoupon) {
      shippingCost = 0;
    } else if (typeof clientShippingCost === "number" && clientShippingCost >= 0 && clientShippingCost <= 200) {
      // Client'tan gelen kargo ucretini kabul et (makul aralikta)
      shippingCost = clientShippingCost;
    } else {
      shippingCost = 39.9;
    }
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
        shippingCompany: clientShippingProvider || null,
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

    // DB bildirim olustur (giris yapmis kullanici icin)
    if (session?.user?.id) {
      createNotification({
        userId: session.user.id,
        type: "order",
        title: "Siparisiniz Alindi",
        message: `#${order.orderNumber} numarali siparisiniz basariyla olusturuldu.`,
      }).catch(console.error);
    }

    // Email bildirim gonder
    const customerEmail = session?.user?.email || guestEmail;
    if (customerEmail) {
      try {
        if (paymentMethod === "BANK_TRANSFER") {
          // Havale bilgileri maili
          const accounts = await getBankAccounts();
          const emailData = bankTransferInfoEmail({
            orderNumber: order.orderNumber,
            total,
            bankAccounts: accounts,
          });
          sendEmail({ to: customerEmail, ...emailData }).catch(console.error);
        } else if (paymentMethod === "CASH_ON_DELIVERY") {
          // Kapida odeme - siparis onay maili
          const emailData = orderConfirmationEmail({
            orderNumber: order.orderNumber,
            total,
            items: orderItems.map((oi) => ({
              name: typeof oi.name === "string" ? oi.name : "Urun",
              quantity: typeof oi.quantity === "number" ? oi.quantity : 1,
              price: typeof oi.price === "number" ? oi.price : 0,
            })),
            paymentMethod,
          });
          sendEmail({ to: customerEmail, ...emailData }).catch(console.error);
        }
        // CREDIT_CARD icin email iyzico callback'ten gonderilecek
      } catch (emailError) {
        console.error("Email send error:", emailError);
      }
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Order create error:", error);
    return NextResponse.json({ error: "Siparis olusturulamadi" }, { status: 500 });
  }
}
