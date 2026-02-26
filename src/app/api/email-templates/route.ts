import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("E-posta sablonlari alinamadi:", error);
    return NextResponse.json(
      { error: "E-posta sablonlari alinamadi" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const body = await request.json();
    const { name, subject, body: templateBody, variables } = body;

    if (!name || !subject || !templateBody) {
      return NextResponse.json(
        { error: "Ad, konu ve govde zorunlu" },
        { status: 400 }
      );
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        body: templateBody,
        variables,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("E-posta sablonu olusturulamadi:", error);
    return NextResponse.json(
      { error: "E-posta sablonu olusturulamadi" },
      { status: 500 }
    );
  }
}
