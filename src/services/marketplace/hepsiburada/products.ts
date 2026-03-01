import { HepsiburadaClient } from "./client";

// ---------- Types ----------

export interface HepsiburadaProductItem {
  categoryId: number;
  merchant: string; // merchantId (UUID)
  attributes: Record<string, unknown>;
}

export interface HepsiburadaProductStatus {
  merchantSku: string;
  hepsiburadaSku?: string;
  status?: string;
  statusDetail?: string;
  errors?: string[];
}

export interface HepsiburadaProductListResponse {
  data?: HepsiburadaRemoteProduct[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
}

export interface HepsiburadaRemoteProduct {
  merchantSku: string;
  hepsiburadaSku?: string;
  productName?: string;
  barcode?: string;
  categoryId?: number;
  brand?: string;
  price?: number;
  stock?: number;
  status?: string;
  images?: string[];
}

// ---------- Product Service ----------

/** Ürünleri Hepsiburada'ya gönder */
export async function importProducts(
  client: HepsiburadaClient,
  items: HepsiburadaProductItem[]
): Promise<{ success: boolean; message?: string; trackingId?: string }> {
  return client.request<{ success: boolean; message?: string; trackingId?: string }>({
    method: "POST",
    service: "mpop",
    path: "/product/api/products/import",
    body: items,
  });
}

/** Ürün durumunu kontrol et */
export async function checkProductStatus(
  client: HepsiburadaClient,
  trackingId?: string
): Promise<HepsiburadaProductStatus[]> {
  const response = await client.request<{ data?: HepsiburadaProductStatus[] } | HepsiburadaProductStatus[]>({
    method: "POST",
    service: "mpop",
    path: "/product/api/products/check-product-status",
    body: trackingId ? { trackingId } : {},
  });

  if (Array.isArray(response)) return response;
  return (response as { data?: HepsiburadaProductStatus[] }).data || [];
}

/** Mağaza ürünlerini listele */
export async function listMerchantProducts(
  client: HepsiburadaClient,
  page: number = 0,
  size: number = 100
): Promise<HepsiburadaProductListResponse> {
  return client.request<HepsiburadaProductListResponse>({
    method: "GET",
    service: "mpop",
    path: `/product/api/products/all-products-of-merchant/${client.merchantId}`,
    params: { page, size },
  });
}

// ---------- Mapping ----------

export interface LocalProductForHepsiburada {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  weight: number | null;
  hasVariants: boolean;
  images: { url: string; order: number }[];
  variants: {
    id: string;
    sku: string | null;
    barcode: string | null;
    price: number | null;
    stock: number;
    options: Record<string, string>;
  }[];
  hepsiburadaCategoryId: number;
  brandName: string;
  attributes: Record<string, unknown> | null;
}

/** Göreceli URL'yi mutlak URL'ye çevir */
function toAbsoluteUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://pixfora.com").replace(/\/$/, "");
  return `${siteUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** Fiyatı Türk formatına çevir (virgüllü) */
function formatPrice(price: number): string {
  return price.toFixed(2).replace(".", ",");
}

/** KDV oranını belirle */
function getVatRate(price: number): string {
  // Varsayılan KDV oranı
  if (price <= 0) return "0";
  return "10";
}

/** Yerel ürünü Hepsiburada formatına çevir */
export function mapProductToHepsiburada(
  product: LocalProductForHepsiburada,
  merchantId: string
): HepsiburadaProductItem[] {
  const items: HepsiburadaProductItem[] = [];

  // Resimleri sırala ve mutlak URL'ye çevir
  const sortedImages = product.images
    .sort((a, b) => a.order - b.order)
    .slice(0, 5)
    .map((img) => toAbsoluteUrl(img.url));

  // Resim alanlarını oluştur
  const imageAttrs: Record<string, string> = {};
  sortedImages.forEach((url, i) => {
    imageAttrs[`Image${i + 1}`] = url;
  });

  // Varyantlı ürün — her varyant ayrı item
  if (product.hasVariants && product.variants.length > 0) {
    for (const variant of product.variants) {
      const barcode = variant.barcode || variant.sku || `${product.sku}-${variant.id}`;
      const variantPrice = variant.price ?? product.price;
      const merchantSku = (variant.sku || barcode).toUpperCase().replace(/\s+/g, "");

      // Varyant özelliklerini ekle
      const variantAttrs: Record<string, string> = {};
      if (variant.options) {
        for (const [key, value] of Object.entries(variant.options)) {
          const keyLower = key.toLowerCase();
          if (keyLower.includes("renk") || keyLower.includes("color")) {
            variantAttrs["renk_variant_property"] = value;
          } else if (keyLower.includes("beden") || keyLower.includes("size") || keyLower.includes("ebat")) {
            variantAttrs["ebatlar_variant_property"] = value;
          }
        }
      }

      items.push({
        categoryId: product.hepsiburadaCategoryId,
        merchant: merchantId,
        attributes: {
          merchantSku,
          VaryantGroupID: product.sku || product.id,
          Barcode: barcode,
          UrunAdi: product.name,
          UrunAciklamasi: product.description || product.name,
          Marka: product.brandName,
          price: formatPrice(variantPrice),
          stock: String(variant.stock),
          tax_vat_rate: getVatRate(variantPrice),
          ...imageAttrs,
          ...variantAttrs,
          ...(product.attributes || {}),
        },
      });
    }
  } else {
    // Basit ürün
    const barcode = product.barcode || product.sku || product.id;
    const merchantSku = (product.sku || barcode).toUpperCase().replace(/\s+/g, "");

    items.push({
      categoryId: product.hepsiburadaCategoryId,
      merchant: merchantId,
      attributes: {
        merchantSku,
        VaryantGroupID: product.sku || product.id,
        Barcode: barcode,
        UrunAdi: product.name,
        UrunAciklamasi: product.description || product.name,
        Marka: product.brandName,
        price: formatPrice(product.price),
        stock: String(product.stock),
        tax_vat_rate: getVatRate(product.price),
        ...imageAttrs,
        ...(product.attributes || {}),
      },
    });
  }

  return items;
}
