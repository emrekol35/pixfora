import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const integrations = await prisma.integration.findMany({
      orderBy: { service: "asc" },
    });

    return NextResponse.json(integrations);
  } catch (error) {
    console.error("Entegrasyonlar alinamadi:", error);
    return NextResponse.json(
      { error: "Entegrasyonlar alinamadi" },
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
    const { service, config, isActive } = body;

    if (!service) {
      return NextResponse.json(
        { error: "Servis adi zorunlu" },
        { status: 400 }
      );
    }

    const integration = await prisma.integration.create({
      data: {
        service,
        config,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    console.error("Entegrasyon olusturulamadi:", error);
    return NextResponse.json(
      { error: "Entegrasyon olusturulamadi" },
      { status: 500 }
    );
  }
}
