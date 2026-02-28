import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "E-posta adresi gerekli" }, { status: 400 });
    }

    const newsletter = await prisma.newsletter.findUnique({
      where: { email },
    });

    if (!newsletter) {
      return NextResponse.json({ message: "Abonelik bulunamadi" });
    }

    await prisma.newsletter.delete({ where: { email } });

    return NextResponse.json({ message: "Aboneliginiz basariyla iptal edildi" });
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return NextResponse.json({ error: "Bir hata olustu" }, { status: 500 });
  }
}
