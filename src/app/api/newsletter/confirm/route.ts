import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token gerekli" }, { status: 400 });
    }

    const newsletter = await prisma.newsletter.findUnique({
      where: { token },
    });

    if (!newsletter) {
      return NextResponse.json({ error: "Gecersiz veya suresi dolmus token" }, { status: 404 });
    }

    if (newsletter.isConfirmed) {
      return NextResponse.json({ message: "Abonelik zaten onaylanmis" });
    }

    await prisma.newsletter.update({
      where: { id: newsletter.id },
      data: {
        isConfirmed: true,
        token: null,
        confirmedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Aboneliginiz basariyla onaylandi" });
  } catch (error) {
    console.error("Newsletter confirm error:", error);
    return NextResponse.json({ error: "Bir hata olustu" }, { status: 500 });
  }
}
