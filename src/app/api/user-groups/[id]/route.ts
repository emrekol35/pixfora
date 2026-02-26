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
    const group = await prisma.userGroup.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!group) {
      return NextResponse.json({ error: "Grup bulunamadi" }, { status: 404 });
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error("User group get error:", error);
    return NextResponse.json({ error: "Grup alinamadi" }, { status: 500 });
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
    const { name, discountPercent } = body;

    if (!name) {
      return NextResponse.json({ error: "Grup adi zorunlu" }, { status: 400 });
    }

    const group = await prisma.userGroup.update({
      where: { id },
      data: {
        name,
        discountPercent: discountPercent !== undefined ? parseFloat(discountPercent) : 0,
      },
    });

    return NextResponse.json({ group });
  } catch (error) {
    console.error("User group update error:", error);
    return NextResponse.json({ error: "Grup guncellenemedi" }, { status: 500 });
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

    const userCount = await prisma.user.count({ where: { groupId: id } });
    if (userCount > 0) {
      return NextResponse.json(
        { error: `Bu grupta ${userCount} musteri var. Once musterileri baska gruba tasiyin.` },
        { status: 400 }
      );
    }

    await prisma.userGroup.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User group delete error:", error);
    return NextResponse.json({ error: "Grup silinemedi" }, { status: 500 });
  }
}
