// Trendyol Public Discovery API response tipleri

export interface TrendyolProductResponse {
  result: TrendyolProductData;
  isSuccess: boolean;
  statusCode: number;
}

export interface TrendyolProductData {
  id: number;
  name: string;
  brand: { id: number; name: string };
  category: { id: number; name: string; hierarchy: string };
  url: string;
  description: string;
  contentDescriptions: TrendyolContentDescription[];
  images: string[]; // relative paths like "/ty123/product.jpg"
  price: {
    sellingPrice: number;
    originalPrice: number;
    discountedPrice: number;
  };
  ratingScore?: {
    averageRating: number;
    totalRatingCount: number;
    totalCommentCount: number;
  };
  allVariants?: TrendyolVariantGroup[];
  variants?: TrendyolVariant[];
  attributes?: TrendyolAttribute[];
  productGroupId?: number;
  merchantId?: number;
  color?: string;
  promotions?: unknown[];
  hasStock?: boolean;
}

export interface TrendyolContentDescription {
  description: string;
  bold?: boolean;
}

export interface TrendyolVariantGroup {
  attributeId: number;
  attributeName: string;
  attributeType: string;
  attributeValue: string;
  stamps: unknown[];
  price: {
    sellingPrice: number;
    originalPrice: number;
    discountedPrice: number;
  };
  hasStock?: boolean;
  itemNumber?: number;
  barcode?: string;
  url?: string;
  listingId?: string;
}

export interface TrendyolVariant {
  attributeId: number;
  attributeName: string;
  attributeType: string;
  attributeValue: string;
  price?: {
    sellingPrice: number;
    originalPrice: number;
  };
  barcode?: string;
}

export interface TrendyolAttribute {
  key: { name: string; id: number };
  value: { name: string; id: number };
}

export interface TrendyolImportResult {
  url: string;
  contentId: string;
  status: "success" | "failed" | "duplicate";
  productId?: string;
  productName?: string;
  error?: string;
}

export interface TrendyolImportOptions {
  categoryId?: string;
  defaultStock?: number;
}
