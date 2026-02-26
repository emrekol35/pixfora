import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST - Stok bildirimi olustur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, variantId, email: guestEmail } = body;

    if (!productId) {
      return NextResponse.json({ error: "Urun ID gerekli" }, { status: 400 });
    }

    // Kullanici girisi kontrol et
    const session = await auth();
    const userId = session?.user?.id || null;
    const email = userId ? session?.user?.email || guestEmail : guestEmail;

    if (!email) {
      return NextResponse.json(
        { error: "E-posta adresi gerekli" },
        { status: 400 }
      );
    }

    // Urun var mi kontrol et
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, stock: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Urun bulunamadi" }, { status: 404 });
    }

    if (product.stock > 0) {
      return NextResponse.json(
        { error: "Bu urun zaten stokta" },
        { status: 400 }
      );
    }

    // Zaten kayit var mi?
    const existing = await prisma.stockNotification.findUnique({
      where: {
        email_productId_variantId: {
          email,
          productId,
          variantId: variantId || null,
        },
      },
    });

    if (existing && !existing.isNotified) {
      return NextResponse.json({
        message: "Zaten bildirim kaydiniz var",
        id: existing.id,
      });
    }

    // Eski bildirim varsa ve bildirim gonderilmisse sil (tekrar kaydedebilsin)
    if (existing && existing.isNotified) {
      await prisma.stockNotification.delete({ where: { id: existing.id } });
    }

    // Yeni kayit olustur
    const notification = await prisma.stockNotification.create({
      data: {
        userId,
        productId,
        variantId: variantId || null,
        email,
      },
    });

    return NextResponse.json({
      message: "Stok bildirimi olusturuldu",
      id: notification.id,
    });
  } catch (error) {
    console.error("Stock notification create error:", error);
    return NextResponse.json(
      { error: "Bildirim olusturulamadi" },
      { status: 500 }
    );
  }
}

// DELETE - Stok bildirimini kaldir
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Urun ID gerekli" }, { status: 400 });
    }

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Giris yapmaniz gerekiyor" }, { status: 401 });
    }

    await prisma.stockNotification.deleteMany({
      where: {
        userId,
        productId,
        isNotified: false,
      },
    });

    return NextResponse.json({ message: "Bildirim kaldirildi" });
  } catch (error) {
    console.error("Stock notification delete error:", error);
    return NextResponse.json(
      { error: "Bildirim kaldirilamadi" },
      { status: 500 }
    );
  }
}

// GET - Kullanicinin stok bildirimleri
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const notifications = await prisma.stockNotification.findMany({
      where: { userId: session.user.id, isNotified: false },
      include: {
        product: {
          select: {
            name: true,
            slug: true,
            stock: true,
            images: { take: 1, select: { url: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Stock notification list error:", error);
    return NextResponse.json(
      { error: "Bildirimler alinamadi" },
      { status: 500 }
    );
  }
}
