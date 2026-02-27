import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erisim." }, { status: 401 });
    }

    const body = await request.json();
    const { action, ids, updateData, filters } = body;

    // Export-filtered icin ids gerekmez
    if (action !== "export-filtered") {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
          { error: "Urun secilmedi." },
          { status: 400 }
        );
      }
      if (ids.length > 500) {
        return NextResponse.json(
          { error: "Tek seferde en fazla 500 urun islenebilir." },
          { status: 400 }
        );
      }
    }

    const userId = (session.user as { id?: string }).id || null;

    switch (action) {
      case "delete":
        return handleBulkDelete(ids, userId);
      case "update":
        return handleBulkUpdate(ids, updateData, userId);
      case "export":
        return handleBulkExport(ids);
      case "export-filtered":
        return handleFilteredExport(filters);
      case "preview-price":
        return handlePreviewPrice(ids);
      default:
        return NextResponse.json(
          { error: "Gecersiz islem." },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Bulk operation error:", error);
    return NextResponse.json(
      { error: "Toplu islem sirasinda hata olustu." },
      { status: 500 }
    );
  }
}

// Toplu silme
async function handleBulkDelete(ids: string[], userId: string | null) {
  const result = await prisma.product.deleteMany({
    where: { id: { in: ids } },
  });

  await logActivity({
    userId,
    action: "BULK_DELETE",
    entity: "Product",
    details: { count: result.count },
  });

  return NextResponse.json({
    success: true,
    affected: result.count,
    message: `${result.count} urun silindi.`,
  });
}

// Toplu guncelleme
async function handleBulkUpdate(
  ids: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateData: any,
  userId: string | null
) {
  if (!updateData || !updateData.field) {
    return NextResponse.json(
      { error: "Guncellenecek alan belirtilmedi." },
      { status: 400 }
    );
  }

  const { field } = updateData;

  // Basit alan guncellemeleri (updateMany)
  if (field === "isActive" || field === "isFeatured") {
    const result = await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { [field]: updateData.value },
    });

    await logActivity({
      userId,
      action: "BULK_UPDATE",
      entity: "Product",
      details: { count: result.count, field, value: updateData.value },
    });

    return NextResponse.json({
      success: true,
      affected: result.count,
      message: `${result.count} urun guncellendi.`,
    });
  }

  if (field === "categoryId") {
    const result = await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { categoryId: updateData.value || null },
    });

    await logActivity({
      userId,
      action: "BULK_UPDATE",
      entity: "Product",
      details: { count: result.count, field, value: updateData.value },
    });

    return NextResponse.json({
      success: true,
      affected: result.count,
      message: `${result.count} urunun kategorisi degistirildi.`,
    });
  }

  if (field === "stock") {
    const { stockAction, stockValue } = updateData;

    if (stockAction === "set") {
      const result = await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { stock: Number(stockValue) },
      });

      await logActivity({
        userId,
        action: "BULK_STOCK_UPDATE",
        entity: "Product",
        details: { count: result.count, action: "set", value: stockValue },
      });

      return NextResponse.json({
        success: true,
        affected: result.count,
        message: `${result.count} urunun stoku guncellendi.`,
      });
    }

    // Artir/Azalt: her urun icin bireysel guncelleme
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, stock: true },
    });

    const updates = products.map((p) => {
      const newStock =
        stockAction === "increase"
          ? p.stock + Number(stockValue)
          : Math.max(0, p.stock - Number(stockValue));

      return prisma.product.update({
        where: { id: p.id },
        data: { stock: newStock },
      });
    });

    await prisma.$transaction(updates);

    await logActivity({
      userId,
      action: "BULK_STOCK_UPDATE",
      entity: "Product",
      details: {
        count: products.length,
        action: stockAction,
        value: stockValue,
      },
    });

    return NextResponse.json({
      success: true,
      affected: products.length,
      message: `${products.length} urunun stoku guncellendi.`,
    });
  }

  if (field === "price") {
    // type: "fixed" | "percentage", direction: "increase" | "decrease", value: number, rounding: string
    const priceType = updateData.type || updateData.priceType || "percentage";
    const priceDirection = updateData.direction || updateData.priceAction || "increase";
    const priceValue = Number(updateData.value || updateData.priceValue || 0);
    const rounding = updateData.rounding || updateData.roundTo || "none";

    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, price: true },
    });

    const updates = products.map((p) => {
      let newPrice = p.price;

      if (priceType === "fixed") {
        newPrice =
          priceDirection === "increase"
            ? p.price + priceValue
            : p.price - priceValue;
      } else {
        const change = p.price * (priceValue / 100);
        newPrice =
          priceDirection === "increase" ? p.price + change : p.price - change;
      }

      newPrice = Math.max(0, newPrice);

      // Yuvarlama
      if (rounding === "0.99" || rounding === 0.99) {
        newPrice = Math.floor(newPrice) + 0.99;
      } else if (rounding === "0.01") {
        newPrice = Math.floor(newPrice) + 0.01;
      } else if (rounding === "integer" || rounding === 1) {
        newPrice = Math.round(newPrice);
      } else {
        newPrice = Math.round(newPrice * 100) / 100;
      }

      return prisma.product.update({
        where: { id: p.id },
        data: { price: newPrice },
      });
    });

    await prisma.$transaction(updates);

    await logActivity({
      userId,
      action: "BULK_PRICE_UPDATE",
      entity: "Product",
      details: {
        count: products.length,
        type: priceType,
        direction: priceDirection,
        value: priceValue,
      },
    });

    return NextResponse.json({
      success: true,
      affected: products.length,
      message: `${products.length} urunun fiyati guncellendi.`,
    });
  }

  return NextResponse.json(
    { error: "Gecersiz guncelleme alani." },
    { status: 400 }
  );
}

// Secili urunleri export
async function handleBulkExport(ids: string[]) {
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: {
      category: { select: { name: true } },
      brand: { select: { name: true } },
      tags: { select: { tag: true } },
    },
  });

  const csv = productsToCsv(products);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="urunler-${Date.now()}.csv"`,
    },
  });
}

// Filtreli export
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleFilteredExport(filters: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { sku: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters?.categoryId) where.categoryId = filters.categoryId;
  if (filters?.brandId) where.brandId = filters.brandId;
  if (filters?.isActive) where.isActive = filters.isActive === "true";

  const products = await prisma.product.findMany({
    where,
    include: {
      category: { select: { name: true } },
      brand: { select: { name: true } },
      tags: { select: { tag: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const csv = productsToCsv(products);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="urunler-${Date.now()}.csv"`,
    },
  });
}

// Fiyat onizleme
async function handlePreviewPrice(ids: string[]) {
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, price: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ products });
}

// CSV olusturucu
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function productsToCsv(products: any[]): string {
  const BOM = "\uFEFF";
  const SEP = ";";

  const headers = [
    "Urun Adi",
    "SKU",
    "Barkod",
    "Fiyat",
    "Karsilastirma Fiyati",
    "Maliyet Fiyati",
    "Stok",
    "Kategori",
    "Marka",
    "Aktif",
    "One Cikan",
    "Kisa Aciklama",
    "Aciklama",
    "Etiketler",
    "SEO Baslik",
    "SEO Aciklama",
  ];

  const rows = products.map((p) =>
    [
      esc(p.name),
      esc(p.sku || ""),
      esc(p.barcode || ""),
      String(p.price),
      String(p.comparePrice || ""),
      String(p.costPrice || ""),
      String(p.stock),
      esc(p.category?.name || ""),
      esc(p.brand?.name || ""),
      p.isActive ? "Evet" : "Hayir",
      p.isFeatured ? "Evet" : "Hayir",
      esc(p.shortDesc || ""),
      esc(p.description || ""),
      esc(
        (p.tags || []).map((t: { tag: string }) => t.tag).join(", ")
      ),
      esc(p.seoTitle || ""),
      esc(p.seoDescription || ""),
    ].join(SEP)
  );

  return BOM + [headers.join(SEP), ...rows].join("\r\n");
}

function esc(value: string): string {
  if (
    value.includes(";") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
