import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Kullanicinin tum adreslerini getir
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { title: "asc" }],
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("Address list error:", error);
    return NextResponse.json(
      { error: "Adresler alinamadi" },
      { status: 500 }
    );
  }
}

// POST - Yeni adres olustur
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      firstName,
      lastName,
      phone,
      city,
      district,
      neighborhood,
      address,
      zipCode,
      type = "shipping",
      isDefault = false,
    } = body;

    // Zorunlu alan kontrolu
    if (!title || !firstName || !lastName || !phone || !city || !district || !address) {
      return NextResponse.json(
        { error: "Zorunlu alanlar eksik" },
        { status: 400 }
      );
    }

    // Eger varsayilan olarak ayarlanacaksa, diger varsayilanlari kaldir
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: session.user.id,
        title,
        firstName,
        lastName,
        phone,
        city,
        district,
        neighborhood: neighborhood || null,
        address,
        zipCode: zipCode || null,
        type,
        isDefault,
      },
    });

    return NextResponse.json(newAddress, { status: 201 });
  } catch (error) {
    console.error("Address create error:", error);
    return NextResponse.json(
      { error: "Adres olusturulamadi" },
      { status: 500 }
    );
  }
}
