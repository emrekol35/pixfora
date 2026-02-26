import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST - Iletisim formu gonder (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Ad, e-posta, konu ve mesaj zorunludur" },
        { status: 400 }
      );
    }

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject,
        message,
      },
    });

    return NextResponse.json({ contactMessage }, { status: 201 });
  } catch (error) {
    console.error("Contact message error:", error);
    return NextResponse.json(
      { error: "Mesaj gonderilemedi" },
      { status: 500 }
    );
  }
}

// GET - Tum mesajlari getir (admin)
export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const [messages, unreadCount] = await Promise.all([
      prisma.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.contactMessage.count({
        where: { isRead: false },
      }),
    ]);

    return NextResponse.json({ messages, unreadCount });
  } catch (error) {
    console.error("Contact messages fetch error:", error);
    return NextResponse.json(
      { error: "Mesajlar getirilemedi" },
      { status: 500 }
    );
  }
}
