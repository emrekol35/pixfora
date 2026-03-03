// Trendyol HTML sayfa scraping tipleri
// Veri kaynagi: window["__envoy__PROPS"] icindeki JSON

export interface TrendyolEnvoyProps {
  st: number; // 200 = basarili, 404 = bulunamadi
  product: TrendyolProductData;
}

export interface TrendyolProductData {
  id: number;
  name: string;
  productCode?: string;
  productGroupId?: number;
  tax?: number;
  inStock?: boolean;

  brand: { id: number; name: string };
  category: { id: number; name: string; hierarchy: string };
  gender?: { id: number; name: string };

  images: string[]; // Tam CDN URL'leri: https://cdn.dsmcdn.com/...

  // Fiyat merchantListing icinde
  merchantListing?: {
    winnerVariant?: {
      price?: {
        currency?: string;
        discountedPrice?: { value: number; text: string };
        sellingPrice?: { value: number; text: string };
        originalPrice?: { value: number; text: string };
      };
    };
    merchant?: {
      id: number;
      name: string;
      officialName?: string;
    };
    promotions?: TrendyolPromotion[];
  };

  // Beden/renk varyantlari
  variants?: TrendyolSizeVariant[];
  slicingAttributes?: Record<string, string>; // { DsmColor: "Lacivert" }

  // Urun ozellikleri (description yerine)
  attributes?: TrendyolAttribute[];
  hasHtmlContent?: boolean;

  ratingScore?: {
    averageRating: number;
    commentCount: number;
    totalCount: number;
  };

  favoriteCount?: number;
  sizeChartUrl?: string;
}

export interface TrendyolSizeVariant {
  itemNumber: number;
  value: string; // "36", "M", "XL" vb.
  beautifiedValue?: string;
  inStock: boolean;
  barcode?: string;
  isSelected?: boolean;
  price?: {
    value: number;
    text: string;
  };
}

export interface TrendyolPromotion {
  id: number;
  name: string;
  discountType?: number;
  promotionDiscountType?: string;
  promotionEndDate?: string;
  isApplied?: boolean;
}

export interface TrendyolAttribute {
  key: { name: string; id: number };
  value: { name: string; id: number };
  searchable?: boolean;
  type?: string;
  isStarred?: boolean;
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

// ---- Arama/kategori sayfa tipleri ----

export interface TrendyolListProduct {
  id: number;
  name: string;
  brand: string;
  url: string; // relative: /marka/urun-p-{id}
  price: {
    current: number;
    original?: number;
    discounted?: number;
    currency: string;
  };
  image: string; // CDN URL
  ratingScore?: { averageRating: number; totalCount: number };
  merchantName?: string;
  categoryName?: string;
  freeCargo?: boolean;
  hasStock?: boolean;
}

export interface TrendyolListResult {
  products: TrendyolListProduct[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  /** Sonraki sayfayi yuklemek icin Trendyol offset degeri */
  nextOffset?: number;
}
