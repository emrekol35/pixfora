import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Yorumlari listele (admin)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const isApproved = searchParams.get("isApproved");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (isApproved === "true") where.isApproved = true;
    if (isApproved === "false") where.isApproved = false;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { name: true, slug: true } },
          user: { select: { name: true, email: true } },
        },
        take: limit,
        skip,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({ reviews, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Reviews get error:", error);
    return NextResponse.json({ error: "Yorumlar alinamadi" }, { status: 500 });
  }
}

// POST - Yeni yorum gonder (musteri)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Giris yapmaniz gerekiyor" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, rating, comment } = body;

    if (!productId || !rating) {
      return NextResponse.json({ error: "Urun ID ve puan zorunlu" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Puan 1-5 arasinda olmali" }, { status: 400 });
    }

    // Urun var mi?
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Urun bulunamadi" }, { status: 404 });
    }

    // Satin alma kontrolu - DELIVERED siparisi olmali
    const deliveredOrder = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: "DELIVERED",
        items: { some: { productId } },
      },
    });

    if (!deliveredOrder) {
      return NextResponse.json(
        { error: "Bu urunu satin almadiginiz icin degerlendirme yapamazsiniz" },
        { status: 403 }
      );
    }

    // Tekrar kontrolu
    const existingReview = await prisma.review.findFirst({
      where: { userId: session.user.id, productId },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "Bu urun icin zaten degerlendirme yapmissiniz" },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId: session.user.id,
        rating: parseInt(rating),
        comment: comment || null,
        isApproved: false,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Review create error:", error);
    return NextResponse.json({ error: "Yorum gonderilemedi" }, { status: 500 });
  }
}
