import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { compare, hash } from "bcryptjs";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz erisim." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Kullanici bulunamadi." },
      { status: 404 }
    );
  }

  return NextResponse.json({ user });
}

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz erisim." }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Password change
    if (body.currentPassword && body.newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
      });

      if (!user?.password) {
        return NextResponse.json(
          { error: "Sifre degistirme islemi yapilamadi." },
          { status: 400 }
        );
      }

      const isValid = await compare(body.currentPassword, user.password);

      if (!isValid) {
        return NextResponse.json(
          { error: "Mevcut sifre hatali." },
          { status: 400 }
        );
      }

      if (body.newPassword.length < 6) {
        return NextResponse.json(
          { error: "Yeni sifre en az 6 karakter olmalidir." },
          { status: 400 }
        );
      }

      const hashedPassword = await hash(body.newPassword, 12);

      await prisma.user.update({
        where: { id: session.user.id },
        data: { password: hashedPassword },
      });

      return NextResponse.json({ message: "Sifreniz degistirildi." });
    }

    // Profile info update
    if (body.name !== undefined) {
      if (!body.name || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: "Ad Soyad zorunludur." },
          { status: 400 }
        );
      }

      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          name: body.name.trim(),
          phone: body.phone || null,
        },
        select: { name: true, email: true, phone: true },
      });

      return NextResponse.json({
        message: "Bilgileriniz guncellendi.",
        user: updatedUser,
      });
    }

    return NextResponse.json(
      { error: "Gecersiz istek." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Bir hata olustu." },
      { status: 500 }
    );
  }
}
