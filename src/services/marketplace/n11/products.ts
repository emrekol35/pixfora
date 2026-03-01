import { N11Client } from "./client";

// ---------- Types ----------

export interface N11SkuItem {
  title: string;
  description: string;
  categoryId: number;
  currencyType: string;
  productMainId: string;
  preparingDay: number;
  shipmentTemplate: string;
  maxPurchaseQuantity?: number;
  stockCode: string;
  catalogId?: number | null;
  barcode?: string | null;
  quantity: number;
  images: { url: string; order: number }[];
  attributes: { id: number; valueId: number | null; customValue: string | null }[];
  salePrice: number;
  listPrice: number;
  vatRate: number;
}

export interface N11TaskResponse {
  id: number;
  type: string; // PRODUCT_CREATE, SKU_UPDATE, PRODUCT_UPDATE
  status: string; // IN_QUEUE, REJECT, PROCESSED
  reasons: string[];
}

export interface N11TaskDetailResponse {
  taskId: number;
  status: string;
  skus: {
    content: {
      id: number;
      taskId: number;
      ownerId: number;
      itemCode: string;
      status: string; // SUCCESS, FAIL
      sku: {
        salePrice?: number;
        listPrice?: number;
        currencyType?: string;
        reasons?: string[];
        stock?: number;
      };
      reasons: string[];
    }[];
    totalElements: number;
    totalPages: number;
  };
  createdDate: string;
  modifiedDate: string;
}

export interface N11RemoteProduct {
  n11ProductId: number;
  sellerId: number;
  sellerNickname: string;
  stockCode: string;
  title: string;
  description: string;
  categoryId: number;
  productMainId: string;
  status: string; // Active, Suspended, etc.
  saleStatus: string; // Before_Sale, On_Sale, Out_Of_Stock, Sale_Closed
  preparingDay: number;
  shipmentTemplate: string;
  maxPurchaseQuantity: number;
  catalogId: number | null;
  barcode: string | null;
  groupId: number | null;
  currencyType: string;
  salePrice: number;
  listPrice: number;
  quantity: number;
  attributes: { attributeId: number; attributeName: string; attributeValue: string }[];
  imageUrls: string[];
  vatRate: number;
  commissionRate: number;
}

export interface N11ProductListResponse {
  content: N11RemoteProduct[];
  totalElements: number;
  totalPages: number;
  number: number;
  numberOfElements: number;
  size: number;
}

// ---------- Product Service ----------

/** Ürünleri N11'e yükle (CreateProduct) */
export async function createProducts(
  client: N11Client,
  skus: N11SkuItem[]
): Promise<N11TaskResponse> {
  return client.request<N11TaskResponse>({
    method: "POST",
    path: "/ms/product/tasks/product-create",
    body: {
      payload: {
        integrator: client.integrator,
        skus,
      },
    },
  });
}

/** Fiyat-Stok güncelle (UpdateProductPriceAndStock) */
export async function updatePriceStock(
  client: N11Client,
  skus: { stockCode: string; listPrice?: number; salePrice?: number; quantity?: number; currencyType?: string }[]
): Promise<N11TaskResponse> {
  return client.request<N11TaskResponse>({
    method: "POST",
    path: "/ms/product/tasks/price-stock-update",
    body: {
      payload: {
        integrator: client.integrator,
        skus,
      },
    },
  });
}

/** Task Detail sorgulama */
export async function getTaskDetails(
  client: N11Client,
  taskId: number,
  page: number = 0,
  size: number = 1000
): Promise<N11TaskDetailResponse> {
  return client.request<N11TaskDetailResponse>({
    method: "POST",
    path: "/ms/product/task-details/page-query",
    body: { taskId, pageable: { page, size } },
  });
}

/** Satıcı ürünlerini listele (GetProductQuery) */
export async function listProducts(
  client: N11Client,
  params: {
    page?: number;
    size?: number;
    stockCode?: string;
    saleStatus?: string;
    productStatus?: string;
  } = {}
): Promise<N11ProductListResponse> {
  return client.request<N11ProductListResponse>({
    method: "GET",
    path: "/ms/product-query",
    params: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      stockCode: params.stockCode,
      saleStatus: params.saleStatus,
      productStatus: params.productStatus,
    },
  });
}

// ---------- Mapping ----------

export interface LocalProductForN11 {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
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
  n11CategoryId: number;
  brandName: string;
  shipmentTemplate: string;
  preparingDay: number;
  vatRate: number;
}

/** Göreceli URL'yi mutlak URL'ye çevir */
function toAbsoluteUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://pixfora.com").replace(/\/$/, "");
  return `${siteUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** Yerel ürünü N11 formatına çevir */
export function mapProductToN11(product: LocalProductForN11): N11SkuItem[] {
  const items: N11SkuItem[] = [];

  const sortedImages = product.images
    .sort((a, b) => a.order - b.order)
    .slice(0, 8)
    .map((img, i) => ({ url: toAbsoluteUrl(img.url), order: i }));

  // Marka attribute (id: 1 genelde Marka'dır)
  const baseAttributes: N11SkuItem["attributes"] = [
    { id: 1, valueId: null, customValue: product.brandName },
  ];

  const listPrice = product.comparePrice && product.comparePrice > product.price
    ? product.comparePrice
    : product.price;

  if (product.hasVariants && product.variants.length > 0) {
    for (const variant of product.variants) {
      const variantPrice = variant.price ?? product.price;
      const variantListPrice = product.comparePrice && product.comparePrice > variantPrice
        ? product.comparePrice
        : variantPrice;
      const stockCode = variant.sku || `${product.sku || product.id}-${variant.id}`;

      // Varyant özelliklerini attribute olarak ekle
      const variantAttributes = [...baseAttributes];
      if (variant.options) {
        for (const [key, value] of Object.entries(variant.options)) {
          const keyLower = key.toLowerCase();
          if (keyLower.includes("renk") || keyLower.includes("color")) {
            variantAttributes.push({ id: 429, valueId: null, customValue: value });
          } else if (keyLower.includes("beden") || keyLower.includes("size") || keyLower.includes("numara")) {
            variantAttributes.push({ id: 22, valueId: null, customValue: value });
          }
        }
      }

      items.push({
        title: product.name,
        description: product.description || product.name,
        categoryId: product.n11CategoryId,
        currencyType: "TL",
        productMainId: product.sku || product.id,
        preparingDay: product.preparingDay,
        shipmentTemplate: product.shipmentTemplate,
        stockCode,
        barcode: variant.barcode || null,
        quantity: variant.stock,
        images: sortedImages,
        attributes: variantAttributes,
        salePrice: Number(variantPrice.toFixed(2)),
        listPrice: Number(variantListPrice.toFixed(2)),
        vatRate: product.vatRate,
      });
    }
  } else {
    const stockCode = product.sku || product.id;

    items.push({
      title: product.name,
      description: product.description || product.name,
      categoryId: product.n11CategoryId,
      currencyType: "TL",
      productMainId: product.sku || product.id,
      preparingDay: product.preparingDay,
      shipmentTemplate: product.shipmentTemplate,
      stockCode,
      barcode: product.barcode || null,
      quantity: product.stock,
      images: sortedImages,
      attributes: baseAttributes,
      salePrice: Number(product.price.toFixed(2)),
      listPrice: Number(listPrice.toFixed(2)),
      vatRate: product.vatRate,
    });
  }

  return items;
}
