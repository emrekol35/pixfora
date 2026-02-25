import type {
  ShippingProvider,
  ShippingRate,
  ShipmentRequest,
  ShipmentResult,
  TrackingResult,
} from "./types";

const API_URL = process.env.YURTICI_API_URL || "https://ws.yurticikargo.com";
const USERNAME = process.env.YURTICI_USERNAME || "";
const PASSWORD = process.env.YURTICI_PASSWORD || "";
const CUSTOMER_CODE = process.env.YURTICI_CUSTOMER_CODE || "";

async function callApi(endpoint: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userName: USERNAME,
        password: PASSWORD,
        custCode: CUSTOMER_CODE,
        ...body,
      }),
    });
    return (await res.json()) as Record<string, unknown>;
  } catch (error) {
    console.error("Yurtici API error:", error);
    return { error: "API baglanti hatasi" };
  }
}

export const yurticiKargo: ShippingProvider = {
  name: "Yurtici Kargo",
  code: "yurtici",

  async calculateRate(weight: number, desi: number, _city: string): Promise<ShippingRate> {
    // Yurtici Kargo ucretlendirme: desi veya kg'dan buyuk olan uzerinden
    const chargeableWeight = Math.max(weight, desi);
    let price = 39.9; // Baz fiyat

    if (chargeableWeight > 1) price += (chargeableWeight - 1) * 5;
    if (chargeableWeight > 10) price += (chargeableWeight - 10) * 3;

    return {
      provider: "yurtici",
      providerName: "Yurtici Kargo",
      price: Math.round(price * 100) / 100,
      estimatedDays: "2-4 is gunu",
    };
  },

  async createShipment(req: ShipmentRequest): Promise<ShipmentResult> {
    if (!USERNAME) {
      // Test modu - gercek API yoksa simule et
      const trackingNumber = `YK${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      return { success: true, trackingNumber };
    }

    const result = await callApi("/ShippingOrderDispatcherService/createShipment", {
      ShipmentOrderVO: {
        cargoKey: req.orderNumber,
        invoiceKey: req.orderNumber,
        receiverCustName: req.receiver.name,
        receiverAddress: req.receiver.address,
        receiverPhone1: req.receiver.phone,
        cityName: req.receiver.city,
        townName: req.receiver.district,
        waybillNo: "",
        ttDocumentId: "",
        dcSelectedCredit: "",
        dcCreditRule: "",
        description: req.description || `Siparis ${req.orderNumber}`,
        isCOD: req.isCOD ? 1 : 0,
        codAmount: req.codAmount || 0,
        shipmentCount: req.parcels.count,
        weight: req.parcels.weight,
        desi: req.parcels.desi,
      },
    });

    if (result.error) {
      return { success: false, errorMessage: result.error as string };
    }

    const data = result.ShippingOrderResultVO as Record<string, unknown> | undefined;
    if (data?.outFlag === "0") {
      return {
        success: true,
        trackingNumber: data.jobId as string,
        barcode: data.cargoKey as string,
      };
    }

    return {
      success: false,
      errorMessage: (data?.outResult as string) || "Gonderim olusturulamadi",
    };
  },

  async getTracking(trackingNumber: string): Promise<TrackingResult> {
    if (!USERNAME) {
      // Test modu
      return {
        success: true,
        status: "Dagitimda",
        statusCode: "IN_DELIVERY",
        events: [
          { date: new Date().toISOString(), status: "Dagitimda", location: "Istanbul", description: "Kargo dagitima cikti" },
          { date: new Date(Date.now() - 86400000).toISOString(), status: "Transfer", location: "Istanbul Aktarma", description: "Aktarma merkezine ulasti" },
        ],
      };
    }

    const result = await callApi("/ShippingOrderDispatcherService/queryShipment", {
      keys: trackingNumber,
      keyType: 0,
      addHistoricalData: true,
    });

    if (result.error) {
      return { success: false, status: "", statusCode: "", events: [], errorMessage: result.error as string };
    }

    const shipment = result.ShippingDeliveryDetailVO as Record<string, unknown> | undefined;
    if (!shipment) {
      return { success: false, status: "", statusCode: "", events: [], errorMessage: "Gonderim bulunamadi" };
    }

    return {
      success: true,
      status: (shipment.operationMessage as string) || "",
      statusCode: (shipment.operationCode as string) || "",
      events: [],
    };
  },
};
