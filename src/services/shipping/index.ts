import { yurticiKargo } from "./yurtici";
import { arasKargo } from "./aras";
import { mngKargo } from "./mng";
import { prisma } from "@/lib/db";
import type { ShippingProvider, ShippingRate } from "./types";

const providers: Record<string, ShippingProvider> = {
  yurtici: yurticiKargo,
  aras: arasKargo,
  mng: mngKargo,
};

export function getShippingProvider(code: string): ShippingProvider | null {
  return providers[code] || null;
}

export function getAllProviders(): ShippingProvider[] {
  return Object.values(providers);
}

// Settings DB'den kargo firma kimlik bilgilerini oku, env var fallback
export async function getProviderCredentials(
  providerCode: string
): Promise<Record<string, string>> {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { startsWith: `shipping_${providerCode}_` } },
    });
    const creds: Record<string, string> = {};
    settings.forEach((s) => {
      creds[s.key] = s.value;
    });
    return creds;
  } catch {
    return {};
  }
}

// Sadece aktif kargo firmalarini dondur
export async function getEnabledProviders(): Promise<ShippingProvider[]> {
  try {
    const enabledSettings = await prisma.setting.findMany({
      where: {
        key: { endsWith: "_enabled" },
        value: "true",
      },
    });

    const enabledCodes = enabledSettings
      .map((s) => {
        const match = s.key.match(/^shipping_(\w+)_enabled$/);
        return match ? match[1] : null;
      })
      .filter(Boolean) as string[];

    // Eger hic aktif firma ayarlanmamissa, tum firmalari dondur (geriye uyumluluk)
    if (enabledCodes.length === 0) {
      return Object.values(providers);
    }

    return enabledCodes
      .map((code) => providers[code])
      .filter(Boolean) as ShippingProvider[];
  } catch {
    return Object.values(providers);
  }
}

// Sadece aktif firmalardan fiyat al
export async function getAllRates(
  weight: number,
  desi: number,
  city: string
): Promise<ShippingRate[]> {
  const enabledList = await getEnabledProviders();
  const rates = await Promise.all(
    enabledList.map((p) =>
      p.calculateRate(weight, desi, city).catch(() => null)
    )
  );
  return rates.filter((r): r is ShippingRate => r !== null);
}

export type { ShippingProvider, ShippingRate, ShipmentRequest, ShipmentResult, TrackingResult } from "./types";
