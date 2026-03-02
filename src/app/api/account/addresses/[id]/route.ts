import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PUT - Adres guncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    // Sahiplik kontrolu
    const existing = await prisma.address.findUnique({ where: { id } });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Adres bulunamadi" }, { status: 404 });
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
      type,
      isDefault,
      isCompany,
      companyName,
      taxOffice,
      taxNumber,
    } = body;

    // Kurumsal adres icin ek validasyon
    if (isCompany === true) {
      if (!companyName || !taxOffice || !taxNumber) {
        return NextResponse.json(
          { error: "Kurumsal adres icin firma adi, vergi dairesi ve vergi numarasi zorunludur" },
          { status: 400 }
        );
      }
    }

    // Eger varsayilan olarak ayarlanacaksa, diger varsayilanlari kaldir
    if (isDefault === true) {
      await prisma.address.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (city !== undefined) updateData.city = city;
    if (district !== undefined) updateData.district = district;
    if (neighborhood !== undefined) updateData.neighborhood = neighborhood || null;
    if (address !== undefined) updateData.address = address;
    if (zipCode !== undefined) updateData.zipCode = zipCode || null;
    if (type !== undefined) updateData.type = type;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isCompany !== undefined) {
      updateData.isCompany = isCompany;
      updateData.companyName = isCompany ? companyName : null;
      updateData.taxOffice = isCompany ? taxOffice : null;
      updateData.taxNumber = isCompany ? taxNumber : null;
    }

    const updated = await prisma.address.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Address update error:", error);
    return NextResponse.json(
      { error: "Adres guncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Adres sil
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    // Sahiplik kontrolu
    const existing = await prisma.address.findUnique({ where: { id } });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Adres bulunamadi" }, { status: 404 });
    }

    await prisma.address.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Address delete error:", error);
    return NextResponse.json(
      { error: "Adres silinemedi" },
      { status: 500 }
    );
  }
}
