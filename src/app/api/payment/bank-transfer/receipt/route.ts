import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

// POST - Dekont yukle
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Giris yapmaniz gerekli" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const orderId = formData.get("orderId") as string | null;

    if (!file || !orderId) {
      return NextResponse.json({ error: "Dosya ve siparis ID gerekli" }, { status: 400 });
    }

    // Dosya validasyonu
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Desteklenmeyen dosya formati. JPEG, PNG, WebP, GIF veya PDF yukleyiniz." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Dosya boyutu 5MB'yi asamaz" }, { status: 400 });
    }

    // Siparis validasyonu
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, paymentMethod: true, paymentStatus: true, orderNumber: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Siparis bulunamadi" }, { status: 404 });
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Bu siparis size ait degil" }, { status: 403 });
    }

    if (order.paymentMethod !== "BANK_TRANSFER") {
      return NextResponse.json({ error: "Bu siparis havale/EFT ile odenmemektedir" }, { status: 400 });
    }

    if (order.paymentStatus !== "PENDING") {
      return NextResponse.json({ error: "Bu siparisin odemesi zaten alindi" }, { status: 400 });
    }

    // Dosya kaydet
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "receipts");
    await fs.mkdir(uploadsDir, { recursive: true });

    const ext = file.type === "application/pdf" ? "pdf" : "webp";
    const fileName = `${randomUUID()}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    if (file.type === "application/pdf") {
      // PDF olduğu gibi kaydet
      await fs.writeFile(filePath, buffer);
    } else {
      // Image - Sharp ile optimize et
      await sharp(buffer)
        .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(filePath);
    }

    const mediaUrl = `/uploads/receipts/${fileName}`;

    // BankTransferReceipt kaydi olustur
    const receipt = await prisma.bankTransferReceipt.create({
      data: {
        orderId,
        mediaUrl,
        status: "PENDING",
      },
    });

    // Admin kullanicilara bildirim gonder
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    for (const admin of admins) {
      createNotification({
        userId: admin.id,
        type: "order",
        title: "Yeni Dekont Yuklendi",
        message: `#${order.orderNumber} numarali siparis icin dekont yuklendi.`,
        pushUrl: `/admin/siparisler/${orderId}`,
        pushCategory: "push_orders",
      }).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      receipt: {
        id: receipt.id,
        mediaUrl: receipt.mediaUrl,
        status: receipt.status,
        createdAt: receipt.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Receipt upload error:", error);
    return NextResponse.json({ error: "Dekont yukleme hatasi" }, { status: 500 });
  }
}

// GET - Siparise ait dekontlari listele
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Giris yapmaniz gerekli" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "Siparis ID gerekli" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Siparis bulunamadi" }, { status: 404 });
    }

    // Admin veya siparis sahibi erisebilir
    const isAdmin = session.user.role === "ADMIN";
    if (!isAdmin && order.userId !== session.user.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const receipts = await prisma.bankTransferReceipt.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      receipts: receipts.map((r) => ({
        id: r.id,
        mediaUrl: r.mediaUrl,
        status: r.status,
        adminNote: r.adminNote,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Receipt list error:", error);
    return NextResponse.json({ error: "Dekont listeleme hatasi" }, { status: 500 });
  }
}
