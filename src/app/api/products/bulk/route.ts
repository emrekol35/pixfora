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

    // Export-filtered ve export-price-stock icin ids gerekmez
    if (action !== "export-filtered" && action !== "export-price-stock" && action !== "preview-price-stock" && action !== "apply-price-stock") {
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
      case "export-price-stock":
        return handleExportPriceStock(body.ids);
      case "preview-price-stock":
        return handlePreviewPriceStock(body.rows);
      case "apply-price-stock":
        return handleApplyPriceStock(body.updates, userId);
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

// ---------- Toplu Fiyat/Stok Islemleri ----------

// Fiyat/Stok CSV export (urunler + varyantlar)
async function handleExportPriceStock(ids?: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { isActive: true };
  if (ids && Array.isArray(ids) && ids.length > 0) {
    where.id = { in: ids };
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      variants: {
        where: { isActive: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const BOM = "\uFEFF";
  const SEP = ";";
  const headers = ["SKU", "Barkod", "Urun Adi", "Fiyat", "Karsilastirma Fiyati", "Stok", "Varyant Bilgisi"];
  const rows: string[] = [];

  for (const p of products) {
    if (p.hasVariants && p.variants.length > 0) {
      // Varyantli urun — her varyant icin 1 satir
      for (const v of p.variants) {
        const options = v.options as Record<string, string> | null;
        const variantInfo = options
          ? Object.entries(options).map(([k, val]) => `${k}: ${val}`).join(", ")
          : "-";

        rows.push(
          [
            esc(v.sku || ""),
            esc(v.barcode || ""),
            esc(p.name),
            formatPrice(v.price ?? p.price),
            formatPrice(p.comparePrice),
            String(v.stock),
            esc(variantInfo),
          ].join(SEP)
        );
      }
    } else {
      // Basit urun — 1 satir
      rows.push(
        [
          esc(p.sku || ""),
          esc(p.barcode || ""),
          esc(p.name),
          formatPrice(p.price),
          formatPrice(p.comparePrice),
          String(p.stock),
          "-",
        ].join(SEP)
      );
    }
  }

  const csv = BOM + [headers.join(SEP), ...rows].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fiyat-stok-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

// Fiyat/Stok CSV onizleme — diff hesapla
async function handlePreviewPriceStock(
  rows: { sku: string; barcode: string; price?: number; comparePrice?: number; stock?: number; isVariant: boolean }[]
) {
  if (!rows || !Array.isArray(rows)) {
    return NextResponse.json({ error: "rows dizisi gerekli." }, { status: 400 });
  }

  // Tum SKU ve barkodlari topla
  const skus = rows.map((r) => r.sku).filter(Boolean);
  const barcodes = rows.map((r) => r.barcode).filter(Boolean);

  // Urunleri ve varyantlari DB'den cek
  const [products, variants] = await Promise.all([
    prisma.product.findMany({
      where: {
        OR: [
          ...(skus.length > 0 ? [{ sku: { in: skus } }] : []),
          ...(barcodes.length > 0 ? [{ barcode: { in: barcodes } }] : []),
        ],
      },
      select: { id: true, name: true, sku: true, barcode: true, price: true, comparePrice: true, stock: true },
    }),
    prisma.productVariant.findMany({
      where: {
        OR: [
          ...(skus.length > 0 ? [{ sku: { in: skus } }] : []),
          ...(barcodes.length > 0 ? [{ barcode: { in: barcodes } }] : []),
        ],
      },
      include: {
        product: { select: { name: true } },
      },
    }),
  ]);

  // SKU → kayit eslestirme mapleri
  const productBySku = new Map(products.filter((p) => p.sku).map((p) => [p.sku!, p]));
  const productByBarcode = new Map(products.filter((p) => p.barcode).map((p) => [p.barcode!, p]));
  const variantBySku = new Map(variants.filter((v) => v.sku).map((v) => [v.sku!, v]));
  const variantByBarcode = new Map(variants.filter((v) => v.barcode).map((v) => [v.barcode!, v]));

  const diffs: {
    sku: string;
    barcode: string;
    name: string;
    isVariant: boolean;
    variantInfo: string;
    oldPrice: number;
    newPrice: number | null;
    oldComparePrice: number | null;
    newComparePrice: number | null;
    oldStock: number;
    newStock: number | null;
    matched: boolean;
    hasChange: boolean;
  }[] = [];

  let matchedCount = 0;
  let unmatchedCount = 0;
  let changedCount = 0;
  let unchangedCount = 0;

  for (const row of rows) {
    // Varyant eslestirme
    if (row.isVariant) {
      const variant = (row.sku ? variantBySku.get(row.sku) : null) ||
        (row.barcode ? variantByBarcode.get(row.barcode) : null);

      if (variant) {
        matchedCount++;
        const options = variant.options as Record<string, string> | null;
        const variantInfo = options
          ? Object.entries(options).map(([k, v]) => `${k}: ${v}`).join(", ")
          : "-";

        const oldPrice = variant.price ?? 0;
        const newPrice = row.price !== undefined ? row.price : null;
        const oldStock = variant.stock;
        const newStock = row.stock !== undefined ? row.stock : null;
        const oldComparePrice = null;
        const newComparePrice = null;

        const hasChange =
          (newPrice !== null && newPrice !== oldPrice) ||
          (newStock !== null && newStock !== oldStock);

        if (hasChange) changedCount++;
        else unchangedCount++;

        diffs.push({
          sku: row.sku,
          barcode: row.barcode || "",
          name: variant.product.name,
          isVariant: true,
          variantInfo,
          oldPrice,
          newPrice,
          oldComparePrice,
          newComparePrice,
          oldStock,
          newStock,
          matched: true,
          hasChange,
        });
      } else {
        unmatchedCount++;
        diffs.push({
          sku: row.sku,
          barcode: row.barcode || "",
          name: "",
          isVariant: true,
          variantInfo: "",
          oldPrice: 0,
          newPrice: row.price ?? null,
          oldComparePrice: null,
          newComparePrice: null,
          oldStock: 0,
          newStock: row.stock ?? null,
          matched: false,
          hasChange: false,
        });
      }
    } else {
      // Urun eslestirme
      const product = (row.sku ? productBySku.get(row.sku) : null) ||
        (row.barcode ? productByBarcode.get(row.barcode) : null);

      if (product) {
        matchedCount++;
        const oldPrice = product.price;
        const newPrice = row.price !== undefined ? row.price : null;
        const oldComparePrice = product.comparePrice;
        const newComparePrice = row.comparePrice !== undefined ? row.comparePrice : null;
        const oldStock = product.stock;
        const newStock = row.stock !== undefined ? row.stock : null;

        const hasChange =
          (newPrice !== null && newPrice !== oldPrice) ||
          (newComparePrice !== null && newComparePrice !== oldComparePrice) ||
          (newStock !== null && newStock !== oldStock);

        if (hasChange) changedCount++;
        else unchangedCount++;

        diffs.push({
          sku: row.sku,
          barcode: row.barcode || "",
          name: product.name,
          isVariant: false,
          variantInfo: "-",
          oldPrice,
          newPrice,
          oldComparePrice,
          newComparePrice,
          oldStock,
          newStock,
          matched: true,
          hasChange,
        });
      } else {
        unmatchedCount++;
        diffs.push({
          sku: row.sku,
          barcode: row.barcode || "",
          name: "",
          isVariant: false,
          variantInfo: "-",
          oldPrice: 0,
          newPrice: row.price ?? null,
          oldComparePrice: null,
          newComparePrice: null,
          oldStock: 0,
          newStock: row.stock ?? null,
          matched: false,
          hasChange: false,
        });
      }
    }
  }

  return NextResponse.json({
    diffs,
    matchedCount,
    unmatchedCount,
    changedCount,
    unchangedCount,
  });
}

// Fiyat/Stok CSV uygulama
async function handleApplyPriceStock(
  updates: { sku: string; barcode?: string; isVariant: boolean; price?: number; comparePrice?: number | null; stock?: number }[],
  userId: string | null
) {
  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "updates dizisi gerekli." }, { status: 400 });
  }

  let updatedCount = 0;
  const errors: { sku: string; error: string }[] = [];

  for (const item of updates) {
    try {
      if (item.isVariant) {
        // Varyant guncelle
        const variant = item.sku
          ? await prisma.productVariant.findFirst({ where: { sku: item.sku } })
          : item.barcode
            ? await prisma.productVariant.findFirst({ where: { barcode: item.barcode } })
            : null;

        if (!variant) {
          errors.push({ sku: item.sku || item.barcode || "?", error: "Varyant bulunamadi" });
          continue;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = {};
        if (item.price !== undefined) data.price = item.price;
        if (item.stock !== undefined) data.stock = Math.max(0, item.stock);

        if (Object.keys(data).length > 0) {
          await prisma.productVariant.update({
            where: { id: variant.id },
            data,
          });
          updatedCount++;
        }
      } else {
        // Urun guncelle
        const product = item.sku
          ? await prisma.product.findFirst({ where: { sku: item.sku } })
          : item.barcode
            ? await prisma.product.findFirst({ where: { barcode: item.barcode } })
            : null;

        if (!product) {
          errors.push({ sku: item.sku || item.barcode || "?", error: "Urun bulunamadi" });
          continue;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = {};
        if (item.price !== undefined) data.price = item.price;
        if (item.comparePrice !== undefined) data.comparePrice = item.comparePrice;
        if (item.stock !== undefined) data.stock = Math.max(0, item.stock);

        if (Object.keys(data).length > 0) {
          await prisma.product.update({
            where: { id: product.id },
            data,
          });
          updatedCount++;
        }
      }
    } catch (err) {
      errors.push({
        sku: item.sku || item.barcode || "?",
        error: err instanceof Error ? err.message : "Bilinmeyen hata",
      });
    }
  }

  await logActivity({
    userId,
    action: "BULK_PRICE_STOCK_UPDATE",
    entity: "Product",
    details: {
      totalRequested: updates.length,
      updated: updatedCount,
      errors: errors.length,
    },
  });

  return NextResponse.json({
    success: true,
    updated: updatedCount,
    errors,
    message: `${updatedCount} kayit guncellendi.${errors.length > 0 ? ` ${errors.length} hata.` : ""}`,
  });
}
