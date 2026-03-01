import { TrendyolClient } from "./client";

// ---------- Types ----------

export interface TrendyolProductItem {
  barcode: string;
  title: string;
  productMainId: string; // Ana ürün kodu (SKU)
  brandId: number;
  categoryId: number;
  quantity: number;
  stockCode: string;
  dimensionalWeight?: number;
  description?: string;
  currencyType?: string;
  listPrice: number;
  salePrice: number;
  vatRate?: number;
  cargoCompanyId?: number;
  images: { url: string }[];
  attributes?: { attributeId: number; attributeValueId?: number; customAttributeValue?: string }[];
  deliveryDuration?: number;
  deliveryOption?: { deliveryDuration: number; fastDeliveryType?: string };
}

export interface TrendyolPriceStockItem {
  barcode: string;
  quantity: number;
  salePrice: number;
  listPrice: number;
}

export interface TrendyolDeleteItem {
  barcode: string;
}

export interface TrendyolBatchResponse {
  batchRequestId: string;
}

export interface TrendyolBatchResult {
  id: string;
  status: string; // "COMPLETED" | "IN_PROGRESS" | "FAILED"
  creationDate: number;
  lastModification: number;
  sourceType: string;
  itemCount: number;
  failedItemCount: number;
  items: {
    requestItem: unknown;
    status: string;
    failureReasons?: string[];
  }[];
}

export interface TrendyolFilterParams {
  page?: number;
  size?: number;
  barcode?: string;
  productMainId?: string;
  startDate?: number; // epoch ms
  endDate?: number;
  dateQueryType?: "CREATED_DATE" | "LAST_MODIFIED_DATE";
  approved?: boolean;
  onSale?: boolean;
}

export interface TrendyolProductListResponse {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  content: TrendyolRemoteProduct[];
}

export interface TrendyolRemoteProduct {
  id: string;
  approved: boolean;
  archived: boolean;
  productCode: number;
  merchantId: number;
  productMainId: string;
  barcode: string;
  title: string;
  categoryName: string;
  brandId: number;
  brandName: string;
  quantity: number;
  salePrice: number;
  listPrice: number;
  images: { url: string }[];
  createDateTime: number;
  lastUpdateDate: number;
  blacklisted: boolean;
  onSale: boolean;
  stockCode: string;
}

// ---------- Product Service ----------

/** Trendyol'a ürün oluştur (max 1000 ürün/istek) */
export async function createProducts(
  client: TrendyolClient,
  items: TrendyolProductItem[]
): Promise<TrendyolBatchResponse> {
  return client.request<TrendyolBatchResponse>({
    method: "POST",
    path: client.supplierPath("/v2/products"),
    body: { items },
  });
}

/** Trendyol'da ürün güncelle */
export async function updateProducts(
  client: TrendyolClient,
  items: Partial<TrendyolProductItem>[]
): Promise<TrendyolBatchResponse> {
  return client.request<TrendyolBatchResponse>({
    method: "PUT",
    path: client.supplierPath("/v2/products"),
    body: { items },
  });
}

/** Fiyat ve stok güncelle */
export async function updatePriceAndInventory(
  client: TrendyolClient,
  items: TrendyolPriceStockItem[]
): Promise<TrendyolBatchResponse> {
  return client.request<TrendyolBatchResponse>({
    method: "PUT",
    path: client.supplierPath("/products/price-and-inventory"),
    body: { items },
  });
}

/** Ürünleri filtrele/listele */
export async function filterProducts(
  client: TrendyolClient,
  params: TrendyolFilterParams = {}
): Promise<TrendyolProductListResponse> {
  return client.request<TrendyolProductListResponse>({
    method: "GET",
    path: client.supplierPath("/products"),
    params: {
      page: params.page ?? 0,
      size: params.size ?? 50,
      barcode: params.barcode,
      productMainId: params.productMainId,
      startDate: params.startDate,
      endDate: params.endDate,
      dateQueryType: params.dateQueryType,
      approved: params.approved !== undefined ? String(params.approved) : undefined,
      onSale: params.onSale !== undefined ? String(params.onSale) : undefined,
    } as Record<string, string | number | undefined>,
  });
}

/** Ürünleri sil (barcode ile) */
export async function deleteProducts(
  client: TrendyolClient,
  items: TrendyolDeleteItem[]
): Promise<TrendyolBatchResponse> {
  return client.request<TrendyolBatchResponse>({
    method: "DELETE",
    path: client.supplierPath("/products"),
    body: { items },
  });
}

/** Batch işlem sonucu kontrol et */
export async function checkBatchResult(
  client: TrendyolClient,
  batchRequestId: string
): Promise<TrendyolBatchResult> {
  return client.request<TrendyolBatchResult>({
    method: "GET",
    path: client.supplierPath(
      `/products/batch-requests/${batchRequestId}`
    ),
  });
}

// ---------- Mapping ----------

export interface LocalProductForTrendyol {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  weight: number | null;
  desi: number | null;
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
  trendyolCategoryId: number;
  trendyolBrandId: number;
  attributes: { attributeId: number; attributeValueId?: number; customAttributeValue?: string }[] | null;
}

/** Yerel ürünü Trendyol formatına çevir */
export function mapProductToTrendyol(
  product: LocalProductForTrendyol
): TrendyolProductItem[] {
  const items: TrendyolProductItem[] = [];

  // Varyantlı ürün — her varyant ayrı Trendyol ürünü olarak gider
  if (product.hasVariants && product.variants.length > 0) {
    for (const variant of product.variants) {
      const barcode = variant.barcode || variant.sku || `${product.sku}-${variant.id}`;
      const variantPrice = variant.price ?? product.price;
      const listPrice =
        product.comparePrice && product.comparePrice > variantPrice
          ? product.comparePrice
          : variantPrice;

      items.push({
        barcode,
        title: product.name,
        productMainId: product.sku || product.id,
        brandId: product.trendyolBrandId,
        categoryId: product.trendyolCategoryId,
        quantity: variant.stock,
        stockCode: variant.sku || barcode,
        dimensionalWeight: product.desi ?? undefined,
        description: product.description || product.name,
        listPrice,
        salePrice: variantPrice,
        vatRate: 10,
        images: product.images
          .sort((a, b) => a.order - b.order)
          .map((img) => ({ url: img.url })),
        attributes: product.attributes || undefined,
      });
    }
  } else {
    // Basit ürün
    const barcode = product.barcode || product.sku || product.id;
    const listPrice =
      product.comparePrice && product.comparePrice > product.price
        ? product.comparePrice
        : product.price;

    items.push({
      barcode,
      title: product.name,
      productMainId: product.sku || product.id,
      brandId: product.trendyolBrandId,
      categoryId: product.trendyolCategoryId,
      quantity: product.stock,
      stockCode: product.sku || barcode,
      dimensionalWeight: product.desi ?? undefined,
      description: product.description || product.name,
      listPrice,
      salePrice: product.price,
      vatRate: 10,
      images: product.images
        .sort((a, b) => a.order - b.order)
        .map((img) => ({ url: img.url })),
      attributes: product.attributes || undefined,
    });
  }

  return items;
}
