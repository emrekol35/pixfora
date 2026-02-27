import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  sanitizeString,
  validateEmail,
  validateName,
  validateLength,
} from "@/lib/validation";

// POST - Iletisim formu gonder (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Honeypot spam koruması — gizli alan dolu ise bot
    if (body.website || body.url || body.honeypot) {
      // Sessizce başarılı gibi dön (bot'a ipucu verme)
      return NextResponse.json({ success: true }, { status: 201 });
    }

    // Input doğrulama
    const nameCheck = validateName(name);
    if (!nameCheck.valid) {
      return NextResponse.json({ error: nameCheck.error }, { status: 400 });
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }

    const subjectCheck = validateLength(subject, "Konu", 2, 200);
    if (!subjectCheck.valid) {
      return NextResponse.json({ error: subjectCheck.error }, { status: 400 });
    }

    const messageCheck = validateLength(message, "Mesaj", 10, 5000);
    if (!messageCheck.valid) {
      return NextResponse.json({ error: messageCheck.error }, { status: 400 });
    }

    // Sanitizasyon
    const cleanName = sanitizeString(name);
    const cleanEmail = email.trim().toLowerCase();
    const cleanSubject = sanitizeString(subject);
    const cleanMessage = sanitizeString(message);

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        phone: phone?.trim() || null,
        subject: cleanSubject,
        message: cleanMessage,
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
