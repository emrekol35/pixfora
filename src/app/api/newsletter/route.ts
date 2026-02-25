import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Gecerli bir e-posta adresi girin" }, { status: 400 });
    }

    const existing = await prisma.newsletter.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: "Zaten abone" });
    }

    await prisma.newsletter.create({ data: { email } });

    return NextResponse.json({ message: "Basariyla abone olundu" });
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json({ error: "Bir hata olustu" }, { status: 500 });
  }
}
