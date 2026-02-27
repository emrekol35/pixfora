import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  sanitizeString,
} from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone } = body;

    // Email doğrulama
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }

    // Şifre doğrulama
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.error }, { status: 400 });
    }

    // İsim doğrulama
    const nameCheck = validateName(name);
    if (!nameCheck.valid) {
      return NextResponse.json({ error: nameCheck.error }, { status: 400 });
    }

    // Telefon doğrulama (opsiyonel)
    if (phone) {
      const phoneCheck = validatePhone(phone);
      if (!phoneCheck.valid) {
        return NextResponse.json({ error: phoneCheck.error }, { status: 400 });
      }
    }

    // Sanitizasyon
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = sanitizeString(name);

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu email adresi zaten kayitli." },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        name: cleanName,
        phone: phone?.trim() || null,
      },
    });

    return NextResponse.json(
      { message: "Kayit basarili.", userId: user.id },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Bir hata olustu." },
      { status: 500 }
    );
  }
}
