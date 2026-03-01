import { TrendyolClient } from "./client";

// ---------- Types ----------

export interface TrendyolShipmentPackageListResponse {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  content: TrendyolShipmentPackage[];
}

export interface TrendyolShipmentPackage {
  shipmentPackageId: number;
  orderNumber: string;
  orderDate: number; // epoch ms (GMT+3)
  tcIdentityNumber?: string;
  invoiceAddress: TrendyolAddress;
  shipmentAddress: TrendyolAddress;
  lines: TrendyolOrderLine[];
  packageHistories: TrendyolPackageHistory[];
  shipmentPackageStatus: string;
  deliveryType?: string;
  timeSlotId?: number;
  scheduledDeliveryStoreId?: string;
  estimatedDeliveryStartDate?: number;
  estimatedDeliveryEndDate?: number;
  totalPrice: number;
  taxNumber?: string;
  invoiceLink?: string;
  cargoTrackingNumber?: string;
  cargoTrackingLink?: string;
  cargoSenderNumber?: string;
  cargoProviderName?: string;
  commercialSalePrice?: number;
  agreedDeliveryDate?: number;
  lastModifiedDate: number;
  customerId: number;
  groupDealId?: number;
  fastDelivery?: boolean;
  originShipmentPackageId?: number;
}

export interface TrendyolAddress {
  id: number;
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  cityCode: number;
  district: string;
  districtId: number;
  postalCode?: string;
  countryCode?: string;
  neighborhoodId?: number;
  neighborhood?: string;
  phone?: string;
  fullAddress?: string;
  fullName?: string;
}

export interface TrendyolOrderLine {
  quantity: number;
  salesCampaignId?: number;
  productSize?: string;
  merchantSku: string;
  productName: string;
  productCode: number;
  merchantId: number;
  amount: number;
  discount: number;
  price: number;
  discountDetails?: unknown[];
  currencyCode?: string;
  productColor?: string;
  id: number;
  sku?: string;
  vatBaseAmount?: number;
  barcode: string;
  orderLineItemStatusName?: string;
  fastDeliveryOptions?: unknown[];
}

export interface TrendyolPackageHistory {
  createdDate: number;
  status: string;
}

export interface ShipmentPackageFilterParams {
  startDate?: number; // epoch ms
  endDate?: number;
  page?: number;
  size?: number;
  orderNumber?: string;
  status?: string;
  orderByField?: string;
  orderByDirection?: "ASC" | "DESC";
  shipmentPackageIds?: string;
}

// ---------- Order Service ----------

/** Sipariş paketlerini listele */
export async function getShipmentPackages(
  client: TrendyolClient,
  params: ShipmentPackageFilterParams = {}
): Promise<TrendyolShipmentPackageListResponse> {
  return client.request<TrendyolShipmentPackageListResponse>({
    method: "GET",
    path: client.supplierPath("/orders"),
    params: {
      startDate: params.startDate,
      endDate: params.endDate,
      page: params.page ?? 0,
      size: params.size ?? 50,
      orderNumber: params.orderNumber,
      status: params.status,
      orderByField: params.orderByField ?? "PackageLastModifiedDate",
      orderByDirection: params.orderByDirection ?? "DESC",
      shipmentPackageIds: params.shipmentPackageIds,
    } as Record<string, string | number | undefined>,
  });
}

/** Paket durumunu güncelle (Picking, Invoiced vb.) */
export async function updatePackageStatus(
  client: TrendyolClient,
  shipmentPackageId: number,
  status: "Picking" | "Invoiced" | "Shipped" | "UnSupplied",
  params?: {
    trackingNumber?: string;
    cargoProviderCode?: string;
    invoiceNumber?: string;
  }
): Promise<void> {
  const lines: { lineId: number; quantity: number }[] = [];

  const body: Record<string, unknown> = {
    status,
    lines,
    ...params,
  };

  await client.request({
    method: "PUT",
    path: client.supplierPath(`/shipment-packages/${shipmentPackageId}`),
    body,
  });
}

/** Kargo takip numarası güncelle */
export async function updateTrackingNumber(
  client: TrendyolClient,
  shipmentPackageId: number,
  trackingNumber: string,
  cargoProviderCode: string
): Promise<void> {
  await client.request({
    method: "PUT",
    path: client.supplierPath(`/shipment-packages/${shipmentPackageId}`),
    body: {
      status: "Picking",
      cargoTrackingNumber: trackingNumber,
      cargoProviderCode,
    },
  });
}

/** Sipariş paketini böl */
export async function splitShipmentPackage(
  client: TrendyolClient,
  shipmentPackageId: number,
  splitGroups: {
    lineId: number;
    quantity: number;
  }[][]
): Promise<void> {
  await client.request({
    method: "POST",
    path: client.supplierPath(
      `/shipment-packages/${shipmentPackageId}/split`
    ),
    body: { splitGroups },
  });
}

/** Fatura linki gönder */
export async function sendInvoiceLink(
  client: TrendyolClient,
  shipmentPackageId: number,
  invoiceLink: string
): Promise<void> {
  await client.request({
    method: "POST",
    path: client.supplierPath(
      `/shipment-packages/${shipmentPackageId}/invoice-link`
    ),
    body: { invoiceLink },
  });
}

// ---------- Mapping ----------

export interface MappedTrendyolOrder {
  trendyolOrderNumber: string;
  trendyolPackageId: string;
  shipmentPackageStatus: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    city: string;
    district: string;
    address: string;
    phone: string;
  };
  items: {
    barcode: string;
    merchantSku: string;
    productName: string;
    quantity: number;
    price: number;
    amount: number;
    discount: number;
  }[];
  totalPrice: number;
  orderDate: Date;
  cargoTrackingNumber: string | null;
  cargoProviderName: string | null;
  rawData: TrendyolShipmentPackage;
}

/** Trendyol sipariş paketini yerel formata çevir */
export function mapTrendyolOrderToLocal(
  pkg: TrendyolShipmentPackage
): MappedTrendyolOrder {
  const addr = pkg.shipmentAddress;

  return {
    trendyolOrderNumber: pkg.orderNumber,
    trendyolPackageId: String(pkg.shipmentPackageId),
    shipmentPackageStatus: pkg.shipmentPackageStatus,
    customerName: `${addr.firstName} ${addr.lastName}`.trim(),
    customerPhone: addr.phone || "",
    shippingAddress: {
      firstName: addr.firstName,
      lastName: addr.lastName,
      city: addr.city,
      district: addr.district,
      address: addr.address1 + (addr.address2 ? ` ${addr.address2}` : ""),
      phone: addr.phone || "",
    },
    items: pkg.lines.map((line) => ({
      barcode: line.barcode,
      merchantSku: line.merchantSku,
      productName: line.productName,
      quantity: line.quantity,
      price: line.price,
      amount: line.amount,
      discount: line.discount,
    })),
    totalPrice: pkg.totalPrice,
    orderDate: new Date(pkg.orderDate),
    cargoTrackingNumber: pkg.cargoTrackingNumber || null,
    cargoProviderName: pkg.cargoProviderName || null,
    rawData: pkg,
  };
}
