import type {
  ShippingProvider,
  ShippingRate,
  ShipmentRequest,
  ShipmentResult,
  TrackingResult,
} from "./types";

const API_URL = process.env.MNG_API_URL || "https://service.mngkargo.com.tr/tms";
const API_KEY = process.env.MNG_API_KEY || "";
const API_SECRET = process.env.MNG_API_SECRET || "";
const CUSTOMER_NUMBER = process.env.MNG_CUSTOMER_NUMBER || "";

async function callApi(endpoint: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": API_KEY,
        "X-Api-Secret": API_SECRET,
      },
      body: JSON.stringify(body),
    });
    return (await res.json()) as Record<string, unknown>;
  } catch (error) {
    console.error("MNG API error:", error);
    return { error: "API baglanti hatasi" };
  }
}

export const mngKargo: ShippingProvider = {
  name: "MNG Kargo",
  code: "mng",

  async calculateRate(weight: number, desi: number, _city: string): Promise<ShippingRate> {
    const chargeableWeight = Math.max(weight, desi);
    let price = 38.9;

    if (chargeableWeight > 1) price += (chargeableWeight - 1) * 4.5;
    if (chargeableWeight > 10) price += (chargeableWeight - 10) * 3;

    return {
      provider: "mng",
      providerName: "MNG Kargo",
      price: Math.round(price * 100) / 100,
      estimatedDays: "2-5 is gunu",
    };
  },

  async createShipment(req: ShipmentRequest): Promise<ShipmentResult> {
    if (!API_KEY) {
      const trackingNumber = `MNG${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      return { success: true, trackingNumber };
    }

    const result = await callApi("/order/create", {
      customerNumber: CUSTOMER_NUMBER,
      orderNumber: req.orderNumber,
      receiver: {
        name: req.receiver.name,
        phone: req.receiver.phone,
        city: req.receiver.city,
        district: req.receiver.district,
        address: req.receiver.address,
      },
      parcels: [
        {
          weight: req.parcels.weight,
          volumetricWeight: req.parcels.desi,
          count: req.parcels.count,
        },
      ],
      isCOD: req.isCOD || false,
      codAmount: req.codAmount || 0,
      description: req.description || `Siparis ${req.orderNumber}`,
    });

    if (result.error) {
      return { success: false, errorMessage: result.error as string };
    }

    if (result.trackingNumber) {
      return {
        success: true,
        trackingNumber: result.trackingNumber as string,
        barcode: result.barcode as string,
      };
    }

    return {
      success: false,
      errorMessage: (result.message as string) || "Gonderim olusturulamadi",
    };
  },

  async getTracking(trackingNumber: string): Promise<TrackingResult> {
    if (!API_KEY) {
      return {
        success: true,
        status: "Aktarma Merkezinde",
        statusCode: "TRANSFER",
        events: [
          { date: new Date().toISOString(), status: "Aktarma", location: "Ankara", description: "Aktarma merkezine ulasti" },
        ],
      };
    }

    const result = await callApi("/tracking/query", {
      trackingNumber,
      customerNumber: CUSTOMER_NUMBER,
    });

    if (result.error) {
      return { success: false, status: "", statusCode: "", events: [], errorMessage: result.error as string };
    }

    const movements = (result.movements as Record<string, unknown>[]) || [];
    return {
      success: true,
      status: (result.lastStatus as string) || "",
      statusCode: (result.statusCode as string) || "",
      events: movements.map((m) => ({
        date: (m.date as string) || "",
        status: (m.status as string) || "",
        location: (m.location as string) || "",
        description: (m.description as string) || "",
      })),
    };
  },
};
