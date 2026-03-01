import { N11Client } from "./client";

// ---------- Types ----------

export interface N11ShipmentPackage {
  billingAddress: N11Address;
  shippingAddress: N11Address;
  orderNumber: string;
  id: string | null; // paket numarası
  customerEmail: string;
  customerfullName: string;
  customerId: number;
  taxId: string | null;
  taxOffice: string | null;
  tcIdentityNumber: string | null;
  cargoSenderNumber: string | null;
  cargoTrackingNumber: string | null;
  cargoTrackingLink: string | null;
  shipmentCompanyId: number | null;
  cargoProviderName: string | null;
  shipmentMethod: number;
  installmentChargeWithVATprice: number;
  lines: N11OrderLine[];
  lastModifiedDate: number; // timestamp ms
  agreedDeliveryDate: number;
  totalAmount: number;
  totalDiscountAmount: number;
  packageHistories: { createdDate: number; status: string }[];
  shipmentPackageStatus: string;
  sellerId: number;
}

export interface N11Address {
  address: string;
  city: string;
  district: string;
  neighborhood?: string;
  fullName: string;
  gsm: string;
  tcId?: string;
  postalCode?: string;
  taxId?: string | null;
  taxHouse?: string | null;
  invoiceType?: number;
}

export interface N11OrderLine {
  quantity: number;
  productId: number;
  productName: string;
  stockCode: string;
  variantAttributes: { name: string; value: string }[];
  price: number;
  dueAmount: number;
  sellerInvoiceAmount: number;
  orderLineId: number;
  orderItemLineItemStatusName: string;
  totalSellerDiscountPrice: number;
  vatRate: number;
  commissionRate: number;
  barcode?: string | null;
}

export interface N11OrderFilterParams {
  startDate?: number; // timestamp ms (GMT+3)
  endDate?: number;
  status?: string; // Created, Picking, Shipped, Cancelled, Delivered, UnPacked, UnSupplied
  orderNumber?: string;
  packageIds?: string;
  page?: number;
  size?: number;
  orderByDirection?: "ASC" | "DESC";
  orderByField?: string;
}

export interface N11ShipmentPackagesResponse {
  pageCount: number;
  totalPages: number;
  page: number;
  size: number;
  content: N11ShipmentPackage[];
}

// ---------- Order Service ----------

/** Siparişleri listele (GetShipmentPackages) */
export async function getOrders(
  client: N11Client,
  params: N11OrderFilterParams = {}
): Promise<N11ShipmentPackagesResponse> {
  return client.request<N11ShipmentPackagesResponse>({
    method: "GET",
    path: "/rest/delivery/v1/shipmentPackages",
    params: {
      startDate: params.startDate,
      endDate: params.endDate,
      status: params.status,
      orderNumber: params.orderNumber,
      packageIds: params.packageIds,
      page: params.page ?? 0,
      size: params.size ?? 100,
      orderByDirection: params.orderByDirection ?? "DESC",
      orderByField: params.orderByField,
    } as Record<string, string | number | undefined>,
  });
}

/** Sipariş kalemlerini onayla (UpdateOrder - Picking) */
export async function approveOrderLines(
  client: N11Client,
  lineIds: number[]
): Promise<{ content: { lineId: number; status: string; reasons: string }[] }> {
  return client.request({
    method: "PUT",
    path: "/rest/order/v1/update",
    body: {
      lines: lineIds.map((lineId) => ({ lineId })),
      status: "Picking",
    },
  });
}

// ---------- Mapping ----------

export interface MappedN11Order {
  n11OrderNumber: string;
  n11PackageId: string | null;
  orderStatus: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: {
    fullName: string;
    city: string;
    district: string;
    address: string;
    phone: string;
  };
  items: {
    orderLineId: number;
    productId: number;
    stockCode: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discount: number;
    barcode: string | null;
  }[];
  totalAmount: number;
  totalDiscount: number;
  orderDate: Date;
  cargoTrackingNumber: string | null;
  cargoProvider: string | null;
  rawData: N11ShipmentPackage;
}

/** N11 siparişini yerel formata çevir */
export function mapN11OrderToLocal(pkg: N11ShipmentPackage): MappedN11Order {
  const addr = pkg.shippingAddress;

  return {
    n11OrderNumber: pkg.orderNumber,
    n11PackageId: pkg.id || null,
    orderStatus: pkg.shipmentPackageStatus,
    customerName: pkg.customerfullName || addr?.fullName || "",
    customerEmail: pkg.customerEmail || "",
    shippingAddress: {
      fullName: addr?.fullName || "",
      city: addr?.city || "",
      district: addr?.district || "",
      address: addr?.address || "",
      phone: addr?.gsm || "",
    },
    items: pkg.lines.map((line) => ({
      orderLineId: line.orderLineId,
      productId: line.productId,
      stockCode: line.stockCode,
      productName: line.productName,
      quantity: line.quantity,
      unitPrice: line.price,
      totalPrice: line.price * line.quantity - line.totalSellerDiscountPrice,
      discount: line.totalSellerDiscountPrice,
      barcode: line.barcode || null,
    })),
    totalAmount: pkg.totalAmount,
    totalDiscount: pkg.totalDiscountAmount,
    orderDate: new Date(pkg.lastModifiedDate),
    cargoTrackingNumber: pkg.cargoTrackingNumber || null,
    cargoProvider: pkg.cargoProviderName || null,
    rawData: pkg,
  };
}
