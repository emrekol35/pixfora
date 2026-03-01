import { HepsiburadaClient } from "./client";

// ---------- Types ----------

export interface HepsiburadaOrderResponse {
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  totalPrice: number;
  customerName?: string;
  customerId?: string;
  lines: HepsiburadaOrderLine[];
  shippingAddress?: HepsiburadaAddress;
  invoiceAddress?: HepsiburadaAddress;
  packageNumber?: string;
  cargoCompany?: string;
  cargoTrackingNumber?: string;
}

export interface HepsiburadaOrderLine {
  lineItemId: string;
  orderLineItemId?: string;
  merchantSku: string;
  hepsiburadaSku?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  discount?: number;
  barcode?: string;
  status?: string;
}

export interface HepsiburadaAddress {
  firstName?: string;
  lastName?: string;
  company?: string;
  address?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
}

export interface HepsiburadaOrderFilterParams {
  status?: string;
  beginDate?: string; // ISO date
  endDate?: string;
  limit?: number;
  offset?: number;
  orderNumber?: string;
}

export interface HepsiburadaPackageResponse {
  packageNumber: string;
  status?: string;
  lines?: { lineId: string; quantity: number }[];
}

// ---------- Order Service ----------

/** Siparişleri listele */
export async function getOrders(
  client: HepsiburadaClient,
  params: HepsiburadaOrderFilterParams = {}
): Promise<HepsiburadaOrderResponse[]> {
  const response = await client.request<{
    data?: HepsiburadaOrderResponse[];
    orders?: HepsiburadaOrderResponse[];
    content?: HepsiburadaOrderResponse[];
  }>({
    method: "GET",
    service: "oms",
    path: `/orders/merchantid/${client.merchantId}`,
    params: {
      status: params.status,
      beginDate: params.beginDate,
      endDate: params.endDate,
      limit: params.limit ?? 50,
      offset: params.offset ?? 0,
      orderNumber: params.orderNumber,
    } as Record<string, string | number | undefined>,
  });

  return response.data || response.orders || response.content || [];
}

/** Sipariş detayı al */
export async function getOrderDetail(
  client: HepsiburadaClient,
  orderNumber: string
): Promise<HepsiburadaOrderResponse | null> {
  try {
    return await client.request<HepsiburadaOrderResponse>({
      method: "GET",
      service: "oms",
      path: `/orders/merchantid/${client.merchantId}/${orderNumber}`,
    });
  } catch {
    return null;
  }
}

/** Paket oluştur */
export async function createPackage(
  client: HepsiburadaClient,
  lines: { lineItemId: string; quantity: number }[]
): Promise<HepsiburadaPackageResponse> {
  return client.request<HepsiburadaPackageResponse>({
    method: "POST",
    service: "oms",
    path: `/packages/merchantid/${client.merchantId}`,
    body: { lines },
  });
}

/** Paketi kargoya ver (intransit) */
export async function markInTransit(
  client: HepsiburadaClient,
  packageNumber: string
): Promise<void> {
  await client.request({
    method: "POST",
    service: "oms",
    path: `/packages/merchantid/${client.merchantId}/${packageNumber}/intransit`,
  });
}

/** Paketi teslim edildi olarak işaretle */
export async function markDelivered(
  client: HepsiburadaClient,
  packageNumber: string
): Promise<void> {
  await client.request({
    method: "POST",
    service: "oms",
    path: `/packages/merchantid/${client.merchantId}/${packageNumber}/deliver`,
  });
}

/** Paketi teslim edilmedi olarak işaretle */
export async function markUndelivered(
  client: HepsiburadaClient,
  packageNumber: string
): Promise<void> {
  await client.request({
    method: "POST",
    service: "oms",
    path: `/packages/merchantid/${client.merchantId}/${packageNumber}/undeliver`,
  });
}

/** Paket bilgisini al */
export async function getPackageDetail(
  client: HepsiburadaClient,
  packageNumber: string
): Promise<HepsiburadaPackageResponse | null> {
  try {
    return await client.request<HepsiburadaPackageResponse>({
      method: "GET",
      service: "oms",
      path: `/packages/merchantid/${client.merchantId}/${packageNumber}`,
    });
  } catch {
    return null;
  }
}

/** Line item iptal et */
export async function cancelLineItem(
  client: HepsiburadaClient,
  lineItemId: string
): Promise<void> {
  await client.request({
    method: "POST",
    service: "oms",
    path: `/lineitems/merchantid/${client.merchantId}/${lineItemId}/cancelbymerchant`,
  });
}

/** Kargo şirketini değiştir */
export async function changeCargoCompany(
  client: HepsiburadaClient,
  orderLineId: string,
  cargoCompany: string
): Promise<void> {
  await client.request({
    method: "PUT",
    service: "oms",
    path: `/lineitems/merchantid/${client.merchantId}/${orderLineId}/cargocompany`,
    body: { cargoCompany },
  });
}

// ---------- Mapping ----------

export interface MappedHepsiburadaOrder {
  hbOrderNumber: string;
  hbPackageNumber: string | null;
  orderStatus: string;
  customerName: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    city: string;
    district: string;
    address: string;
    phone: string;
  };
  items: {
    lineItemId: string;
    merchantSku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discount: number;
  }[];
  totalPrice: number;
  orderDate: Date;
  cargoTrackingNumber: string | null;
  cargoCompany: string | null;
  rawData: HepsiburadaOrderResponse;
}

/** Hepsiburada siparişini yerel formata çevir */
export function mapHepsiburadaOrderToLocal(
  order: HepsiburadaOrderResponse
): MappedHepsiburadaOrder {
  const addr = order.shippingAddress;

  return {
    hbOrderNumber: order.orderNumber,
    hbPackageNumber: order.packageNumber || null,
    orderStatus: order.orderStatus,
    customerName: order.customerName || `${addr?.firstName || ""} ${addr?.lastName || ""}`.trim(),
    shippingAddress: {
      firstName: addr?.firstName || "",
      lastName: addr?.lastName || "",
      city: addr?.city || "",
      district: addr?.district || "",
      address: addr?.address || "",
      phone: addr?.phone || "",
    },
    items: order.lines.map((line) => ({
      lineItemId: line.lineItemId,
      merchantSku: line.merchantSku,
      productName: line.productName,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      totalPrice: line.totalPrice || line.unitPrice * line.quantity,
      discount: line.discount || 0,
    })),
    totalPrice: order.totalPrice,
    orderDate: new Date(order.orderDate),
    cargoTrackingNumber: order.cargoTrackingNumber || null,
    cargoCompany: order.cargoCompany || null,
    rawData: order,
  };
}
