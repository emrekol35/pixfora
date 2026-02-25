import { yurticiKargo } from "./yurtici";
import { arasKargo } from "./aras";
import { mngKargo } from "./mng";
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

export async function getAllRates(
  weight: number,
  desi: number,
  city: string
): Promise<ShippingRate[]> {
  const rates = await Promise.all(
    Object.values(providers).map((p) =>
      p.calculateRate(weight, desi, city).catch(() => null)
    )
  );
  return rates.filter((r): r is ShippingRate => r !== null);
}

export type { ShippingProvider, ShippingRate, ShipmentRequest, ShipmentResult, TrackingResult } from "./types";
