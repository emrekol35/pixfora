import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Urunun yayinlanmis sorularini getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const questions = await prisma.productQuestion.findMany({
      where: { productId: id, isPublished: true },
      include: {
        user: { select: { name: true } },
        answeredBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Product questions GET error:", error);
    return NextResponse.json(
      { error: "Sorular alinamadi" },
      { status: 500 }
    );
  }
}

// POST - Yeni soru sor
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Soru sormak icin giris yapin" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { question } = body;

    if (!question || question.trim().length < 10) {
      return NextResponse.json(
        { error: "Soru en az 10 karakter olmalidir" },
        { status: 400 }
      );
    }

    // Urun var mi?
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Urun bulunamadi" },
        { status: 404 }
      );
    }

    const newQuestion = await prisma.productQuestion.create({
      data: {
        productId: id,
        userId: session.user.id,
        question: question.trim(),
      },
    });

    return NextResponse.json({
      message: "Sorunuz gonderildi, onaylandiktan sonra yayinlanacak",
      id: newQuestion.id,
    });
  } catch (error) {
    console.error("Product question POST error:", error);
    return NextResponse.json(
      { error: "Soru gonderilemedi" },
      { status: 500 }
    );
  }
}
