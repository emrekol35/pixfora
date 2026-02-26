import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { alt, folder } = body;

    const media = await prisma.media.update({
      where: { id },
      data: {
        alt: alt || null,
        folder: folder || "general",
      },
    });

    return NextResponse.json({ media });
  } catch (error) {
    console.error("Media update error:", error);
    return NextResponse.json({ error: "Medya guncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { id } = await params;

    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      return NextResponse.json({ error: "Medya bulunamadi" }, { status: 404 });
    }

    // Fiziksel dosyayi sil
    try {
      const filePath = path.join(process.cwd(), "public", media.url);
      await fs.unlink(filePath);
    } catch {
      // Dosya zaten silinmis olabilir, devam et
    }

    await prisma.media.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Media delete error:", error);
    return NextResponse.json({ error: "Medya silinemedi" }, { status: 500 });
  }
}
