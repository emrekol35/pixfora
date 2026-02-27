import type {
  ShippingProvider,
  ShippingRate,
  ShipmentRequest,
  ShipmentResult,
  TrackingResult,
} from "./types";
import { prisma } from "@/lib/db";

const API_URL =
  process.env.MNG_API_URL || "https://api.mngkargo.com.tr/mngapi/api";

// ---- DB'den credential oku, env var fallback ----
async function getCredentials(): Promise<{
  customerNumber: string;
  password: string;
}> {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: { in: ["shipping_mng_customer_number", "shipping_mng_password"] },
      },
    });
    const map: Record<string, string> = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });
    return {
      customerNumber:
        map.shipping_mng_customer_number ||
        process.env.MNG_CUSTOMER_NUMBER ||
        "",
      password:
        map.shipping_mng_password || process.env.MNG_PASSWORD || "",
    };
  } catch {
    return {
      customerNumber: process.env.MNG_CUSTOMER_NUMBER || "",
      password: process.env.MNG_PASSWORD || "",
    };
  }
}

// ---- Token cache ----
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  // Token hala gecerliyse cache'den don
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const creds = await getCredentials();

  try {
    const res = await fetch(`${API_URL}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerNumber: creds.customerNumber,
        password: creds.password,
        identityType: 1,
      }),
    });

    const data = (await res.json()) as Record<string, unknown>;

    if (!res.ok || !data.token) {
      console.error("MNG token hatasi:", data);
      throw new Error((data.message as string) || "Token alinamadi");
    }

    cachedToken = data.token as string;
    // Token'i 55 dakika gecerli say (genelde 1 saat)
    tokenExpiry = Date.now() + 55 * 60 * 1000;
    return cachedToken;
  } catch (error) {
    console.error("MNG token error:", error);
    cachedToken = null;
    tokenExpiry = 0;
    throw error;
  }
}

async function callApi(
  endpoint: string,
  body: Record<string, unknown>,
  method: "POST" | "GET" = "POST"
): Promise<Record<string, unknown>> {
  try {
    const token = await getToken();

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    if (method === "POST") {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(`${API_URL}${endpoint}`, options);

    // 401 ise token suresi dolmus olabilir, bir kere yenile
    if (res.status === 401) {
      cachedToken = null;
      tokenExpiry = 0;
      const newToken = await getToken();
      const retryRes = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newToken}`,
        },
      });
      return (await retryRes.json()) as Record<string, unknown>;
    }

    return (await res.json()) as Record<string, unknown>;
  } catch (error) {
    console.error("MNG API error:", error);
    return { error: "API baglanti hatasi" };
  }
}

export const mngKargo: ShippingProvider = {
  name: "MNG Kargo",
  code: "mng",

  async calculateRate(
    weight: number,
    desi: number,
    _city: string
  ): Promise<ShippingRate> {
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
    const creds = await getCredentials();

    if (!creds.customerNumber || !creds.password) {
      // Test modu — credential yoksa mock tracking uret
      const trackingNumber = `MNG${Date.now()}${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;
      return { success: true, trackingNumber };
    }

    const result = await callApi("/standardcommand/createOrder", {
      customerNumber: creds.customerNumber,
      orderNumber: req.orderNumber,
      receiver: {
        name: req.receiver.name,
        phone: req.receiver.phone,
        cityCode: req.receiver.city,
        districtName: req.receiver.district,
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
        barcode: (result.barcode as string) || undefined,
      };
    }

    // Bazi API response'larinda farkli alan adlari olabilir
    if (result.data && typeof result.data === "object") {
      const data = result.data as Record<string, unknown>;
      if (data.trackingNumber) {
        return {
          success: true,
          trackingNumber: data.trackingNumber as string,
          barcode: (data.barcode as string) || undefined,
        };
      }
    }

    return {
      success: false,
      errorMessage:
        (result.message as string) || "Gonderim olusturulamadi",
    };
  },

  async getTracking(trackingNumber: string): Promise<TrackingResult> {
    const creds = await getCredentials();

    if (!creds.customerNumber || !creds.password) {
      // Test modu
      return {
        success: true,
        status: "Aktarma Merkezinde",
        statusCode: "TRANSFER",
        events: [
          {
            date: new Date().toISOString(),
            status: "Aktarma",
            location: "Ankara",
            description: "Aktarma merkezine ulasti",
          },
        ],
      };
    }

    const result = await callApi("/standardquery/movements", {
      trackingNumber,
      customerNumber: creds.customerNumber,
    });

    if (result.error) {
      return {
        success: false,
        status: "",
        statusCode: "",
        events: [],
        errorMessage: result.error as string,
      };
    }

    const movements =
      (result.movements as Record<string, unknown>[]) ||
      (result.data &&
        (
          result.data as { movements?: Record<string, unknown>[] }
        ).movements) ||
      [];

    return {
      success: true,
      status: (result.lastStatus as string) || "",
      statusCode: (result.statusCode as string) || "",
      events: (movements as Record<string, unknown>[]).map((m) => ({
        date: (m.date as string) || "",
        status: (m.status as string) || "",
        location: (m.location as string) || "",
        description: (m.description as string) || "",
      })),
    };
  },
};
