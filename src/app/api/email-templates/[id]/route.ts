import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { id } = await params;

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Sablon bulunamadi" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Sablon bulunamadi:", error);
    return NextResponse.json(
      { error: "Sablon bulunamadi" },
      { status: 500 }
    );
  }
}

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
    const { name, subject, body: templateBody, variables } = body;

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(subject !== undefined && { subject }),
        ...(templateBody !== undefined && { body: templateBody }),
        ...(variables !== undefined && { variables }),
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Sablon guncellenemedi:", error);
    return NextResponse.json(
      { error: "Sablon guncellenemedi" },
      { status: 500 }
    );
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

    await prisma.emailTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Sablon silindi" });
  } catch (error) {
    console.error("Sablon silinemedi:", error);
    return NextResponse.json(
      { error: "Sablon silinemedi" },
      { status: 500 }
    );
  }
}
