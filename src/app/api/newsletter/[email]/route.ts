import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 401 });
  }

  const { email } = await params;
  const decoded = decodeURIComponent(email);

  try {
    await prisma.newsletter.delete({
      where: { email: decoded },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Abone bulunamadi veya silinemedi." },
      { status: 404 }
    );
  }
}
