import { HepsiburadaClient } from "./client";

// ---------- Types ----------

export interface HepsiburadaListingItem {
  HepsiburadaSku?: string;
  MerchantSku: string;
  Price?: string; // Virgüllü format: "49,90"
  AvailableStock?: number;
  DispatchTime?: number; // gün
  CargoCompany1?: string;
  CargoCompany2?: string;
  CargoCompany3?: string;
  MaximumPurchasableQuantity?: number;
}

export interface HepsiburadaListingInfo {
  hepsiburadaSku?: string;
  merchantSku?: string;
  productName?: string;
  availableStock?: number;
  price?: number;
  dispatchTime?: number;
  isSalable?: boolean;
}

export interface HepsiburadaListingUpdateResponse {
  success?: boolean;
  inventoryUploadId?: string;
  message?: string;
  errors?: string[];
}

// ---------- Listing Service ----------

/** Stok/Fiyat/Teslimat güncelle (max 4000 SKU/istek) */
export async function updateListings(
  client: HepsiburadaClient,
  items: HepsiburadaListingItem[]
): Promise<HepsiburadaListingUpdateResponse> {
  // 4000 sınırına göre parçala
  const MAX_ITEMS = 4000;
  if (items.length <= MAX_ITEMS) {
    return client.request<HepsiburadaListingUpdateResponse>({
      method: "POST",
      service: "listing",
      path: `/Listings/HepsiburadaSku/inventoryuploads`,
      body: { listings: items },
    });
  }

  // Birden fazla istek gerekli
  let lastResponse: HepsiburadaListingUpdateResponse = {};
  for (let i = 0; i < items.length; i += MAX_ITEMS) {
    const chunk = items.slice(i, i + MAX_ITEMS);
    lastResponse = await client.request<HepsiburadaListingUpdateResponse>({
      method: "POST",
      service: "listing",
      path: `/Listings/HepsiburadaSku/inventoryuploads`,
      body: { listings: chunk },
    });
  }
  return lastResponse;
}

/** Listing bilgilerini sorgula */
export async function getListings(
  client: HepsiburadaClient,
  page: number = 0,
  size: number = 100
): Promise<{ listings: HepsiburadaListingInfo[]; total: number }> {
  const response = await client.request<{
    data?: HepsiburadaListingInfo[];
    listings?: HepsiburadaListingInfo[];
    totalElements?: number;
    total?: number;
  }>({
    method: "GET",
    service: "listing",
    path: `/listings/merchantid/${client.merchantId}`,
    params: { offset: page * size, limit: size },
  });

  const listings = response.data || response.listings || [];
  const total = response.totalElements || response.total || 0;
  return { listings, total };
}

/** Fiyatı Türk formatına çevir */
export function formatPriceForHB(price: number): string {
  return price.toFixed(2).replace(".", ",");
}
