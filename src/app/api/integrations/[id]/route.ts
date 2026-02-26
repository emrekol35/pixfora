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

    const integration = await prisma.integration.findUnique({
      where: { id },
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Entegrasyon bulunamadi" },
        { status: 404 }
      );
    }

    return NextResponse.json(integration);
  } catch (error) {
    console.error("Entegrasyon bulunamadi:", error);
    return NextResponse.json(
      { error: "Entegrasyon bulunamadi" },
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
    const { service, config, isActive } = body;

    const integration = await prisma.integration.update({
      where: { id },
      data: {
        ...(service !== undefined && { service }),
        ...(config !== undefined && { config }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(integration);
  } catch (error) {
    console.error("Entegrasyon guncellenemedi:", error);
    return NextResponse.json(
      { error: "Entegrasyon guncellenemedi" },
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

    await prisma.integration.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Entegrasyon silindi" });
  } catch (error) {
    console.error("Entegrasyon silinemedi:", error);
    return NextResponse.json(
      { error: "Entegrasyon silinemedi" },
      { status: 500 }
    );
  }
}
