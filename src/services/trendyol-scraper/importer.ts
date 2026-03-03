import sharp from "sharp";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { prisma } from "@/lib/db";
import { generateSlug } from "@/lib/utils";
import { parseContentIdFromUrl, fetchTrendyolProduct } from "./client";
import type {
  TrendyolProductData,
  TrendyolImportResult,
  TrendyolImportOptions,
} from "./types";

const MAX_WIDTH = 1920;
const THUMB_SIZE = 400;
const WEBP_QUALITY = 85;

// ---- Gorsel indirme ve kaydetme ----

async function downloadAndSaveImage(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > 10 * 1024 * 1024) return null; // 10MB limit

    const uploadDir = path.join(
      process.cwd(),
      process.env.UPLOAD_DIR || "public/uploads",
      "products"
    );
    await mkdir(uploadDir, { recursive: true });

    const baseName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Ana gorsel — WebP
      let pipeline = image.clone();
      if (metadata.width && metadata.width > MAX_WIDTH) {
        pipeline = pipeline.resize(MAX_WIDTH, undefined, {
          withoutEnlargement: true,
        });
      }
      const optimized = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();

      const mainFilename = `${baseName}.webp`;
      await writeFile(path.join(uploadDir, mainFilename), optimized);

      // Thumbnail
      const thumbBuffer = await sharp(buffer)
        .resize(THUMB_SIZE, THUMB_SIZE, {
          fit: "cover",
          withoutEnlargement: true,
        })
        .webp({ quality: 75 })
        .toBuffer();

      const thumbFilename = `thumb-${baseName}.webp`;
      await writeFile(path.join(uploadDir, thumbFilename), thumbBuffer);

      // Media kaydı
      await prisma.media.create({
        data: {
          url: `/uploads/products/${mainFilename}`,
          filename: mainFilename,
          mimeType: "image/webp",
          size: optimized.length,
          folder: "products",
        },
      });

      return `/uploads/products/${mainFilename}`;
    } catch {
      // Sharp hatasi — orijinali kaydet
      const filename = `${baseName}.jpg`;
      await writeFile(path.join(uploadDir, filename), buffer);
      return `/uploads/products/${filename}`;
    }
  } catch {
    return null;
  }
}

// ---- Marka bul veya olustur ----

async function findOrCreateBrand(brandName: string): Promise<string> {
  const existing = await prisma.brand.findFirst({
    where: { name: { equals: brandName, mode: "insensitive" } },
  });

  if (existing) return existing.id;

  const slug = generateSlug(brandName);
  const brand = await prisma.brand.create({
    data: {
      name: brandName,
      slug: `${slug}-${Date.now().toString(36)}`,
      isActive: true,
    },
  });

  return brand.id;
}

// ---- Fiyat bilgisini cikar ----

function extractPrice(data: TrendyolProductData): {
  price: number;
  comparePrice: number | null;
} {
  const winnerPrice = data.merchantListing?.winnerVariant?.price;

  if (winnerPrice) {
    const discounted = winnerPrice.discountedPrice?.value || 0;
    const selling = winnerPrice.sellingPrice?.value || 0;
    const original = winnerPrice.originalPrice?.value || 0;

    // discountedPrice = indirimli fiyat (satış fiyati)
    // sellingPrice = normal liste fiyati
    const price = discounted || selling;
    const comparePrice =
      selling > price ? selling : original > price ? original : null;

    return { price, comparePrice };
  }

  // Fallback: ilk varyantin fiyatindan al
  const firstVariant = data.variants?.[0];
  if (firstVariant?.price?.value) {
    return { price: firstVariant.price.value, comparePrice: null };
  }

  return { price: 0, comparePrice: null };
}

// ---- Varyantlari cikar ----

function extractVariants(data: TrendyolProductData): {
  variantTypes: { name: string; options: string[] }[];
  variants: {
    sku: string | null;
    barcode: string | null;
    price: number | null;
    stock: number;
    options: Record<string, string>;
  }[];
} {
  const sizeVariants = data.variants || [];
  if (sizeVariants.length === 0) {
    return { variantTypes: [], variants: [] };
  }

  // Beden varyantlarini topla
  const sizeValues = sizeVariants.map((v) => v.value).filter(Boolean);
  if (sizeValues.length === 0) {
    return { variantTypes: [], variants: [] };
  }

  const variantTypes = [{ name: "Beden", options: sizeValues }];

  // Renk bilgisi varsa ekle
  const color = data.slicingAttributes?.DsmColor;
  if (color) {
    variantTypes.unshift({ name: "Renk", options: [color] });
  }

  const variants = sizeVariants
    .filter((v) => v.value)
    .map((v) => ({
      sku: v.itemNumber ? String(v.itemNumber) : null,
      barcode: v.barcode || null,
      price: v.price?.value || null,
      stock: 0,
      options: {
        ...(color ? { Renk: color } : {}),
        Beden: v.value,
      },
    }));

  return { variantTypes, variants };
}

// ---- Aciklama olustur (ozelliklerden) ----

function buildDescription(data: TrendyolProductData): string {
  const parts: string[] = [];

  // Ozelliklerden HTML tablo olustur
  const attrs = data.attributes || [];
  const starred = attrs.filter((a) => a.isStarred);
  const rest = attrs.filter((a) => !a.isStarred);

  if (starred.length > 0) {
    parts.push("<table><tbody>");
    for (const attr of starred) {
      parts.push(
        `<tr><td><strong>${attr.key.name}</strong></td><td>${attr.value.name}</td></tr>`
      );
    }
    parts.push("</tbody></table>");
  }

  if (rest.length > 0) {
    parts.push("<h4>Tum Ozellikler</h4><table><tbody>");
    for (const attr of rest) {
      parts.push(
        `<tr><td><strong>${attr.key.name}</strong></td><td>${attr.value.name}</td></tr>`
      );
    }
    parts.push("</tbody></table>");
  }

  return parts.join("\n") || data.name;
}

// ---- Ana import fonksiyonu ----

export async function importTrendyolProduct(
  url: string,
  options: TrendyolImportOptions = {}
): Promise<TrendyolImportResult> {
  const contentId = parseContentIdFromUrl(url);
  if (!contentId) {
    return {
      url,
      contentId: "",
      status: "failed",
      error: "Gecersiz Trendyol URL'si. URL -p-{id} icermeli.",
    };
  }

  try {
    // 1. Trendyol'dan urun bilgilerini cek
    const data = await fetchTrendyolProduct(contentId);

    // 2. Marka bul/olustur
    const brandId = data.brand?.name
      ? await findOrCreateBrand(data.brand.name)
      : null;

    // 3. Duplikasyon kontrolu
    const existing = await prisma.product.findFirst({
      where: {
        name: data.name,
        ...(brandId ? { brandId } : {}),
      },
    });

    if (existing) {
      return {
        url,
        contentId,
        status: "duplicate",
        productId: existing.id,
        productName: existing.name,
        error: "Bu urun zaten mevcut.",
      };
    }

    // 4. Gorselleri indir
    const imageUrls: string[] = [];
    const trendyolImages = data.images || [];
    for (const imgPath of trendyolImages.slice(0, 10)) {
      const localUrl = await downloadAndSaveImage(imgPath);
      if (localUrl) imageUrls.push(localUrl);
    }

    // 5. Varyantlari cikar
    const { variantTypes, variants } = extractVariants(data);

    // 6. Slug olustur
    let slug = generateSlug(data.name);
    const slugExists = await prisma.product.findUnique({ where: { slug } });
    if (slugExists) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // 7. Aciklama olustur
    const description = buildDescription(data);

    // 8. Fiyat
    const { price, comparePrice } = extractPrice(data);

    // 9. Etiketler
    const tags: string[] = [];
    if (data.brand?.name) tags.push(data.brand.name);
    if (data.category?.name) tags.push(data.category.name);

    // 10. Urun olustur
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description,
        price,
        comparePrice,
        stock: options.defaultStock ?? 0,
        isActive: false, // Taslak olarak ekle
        isFeatured: false,
        hasVariants: variants.length > 0,
        categoryId: options.categoryId || null,
        brandId,
        seoTitle: `${data.name} | Pixfora`,
        seoDescription: `${data.name}${data.brand?.name ? ` - ${data.brand.name}` : ""} en uygun fiyatla Pixfora'da`,
        images: imageUrls.length
          ? {
              create: imageUrls.map((url, index) => ({
                url,
                alt: data.name,
                order: index,
              })),
            }
          : undefined,
        variantTypes: variantTypes.length
          ? {
              create: variantTypes.map((vt, index) => ({
                name: vt.name,
                order: index,
                options: {
                  create: vt.options.map((opt, optIndex) => ({
                    value: opt,
                    order: optIndex,
                  })),
                },
              })),
            }
          : undefined,
        variants: variants.length
          ? {
              create: variants.map((v) => ({
                sku: v.sku,
                barcode: v.barcode,
                price: v.price,
                stock: v.stock,
                options: v.options,
              })),
            }
          : undefined,
        tags: tags.length
          ? { create: tags.map((tag) => ({ tag })) }
          : undefined,
      },
    });

    return {
      url,
      contentId,
      status: "success",
      productId: product.id,
      productName: product.name,
    };
  } catch (err) {
    return {
      url,
      contentId,
      status: "failed",
      error: err instanceof Error ? err.message : "Bilinmeyen hata",
    };
  }
}
