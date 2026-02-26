import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// PUT - Admin: Soruyu cevapla / yayinla
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { answer, isPublished } = body;

    const question = await prisma.productQuestion.findUnique({
      where: { id },
    });

    if (!question) {
      return NextResponse.json({ error: "Soru bulunamadi" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (answer !== undefined) {
      updateData.answer = answer;
      updateData.answeredById = session.user.id;
      updateData.answeredAt = new Date();
    }

    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
    }

    const updated = await prisma.productQuestion.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Admin question PUT error:", error);
    return NextResponse.json({ error: "Soru guncellenemedi" }, { status: 500 });
  }
}

// DELETE - Admin: Soruyu sil
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.productQuestion.delete({ where: { id } });

    return NextResponse.json({ message: "Soru silindi" });
  } catch (error) {
    console.error("Admin question DELETE error:", error);
    return NextResponse.json({ error: "Soru silinemedi" }, { status: 500 });
  }
}
