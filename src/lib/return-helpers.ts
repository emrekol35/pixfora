import { prisma } from "@/lib/db";

// İade nedenleri
export const RETURN_REASONS = [
  { value: "defective", label: "Kusurlu / Bozuk Urun" },
  { value: "wrong_item", label: "Yanlis Urun Gonderildi" },
  { value: "changed_mind", label: "Fikir Degisikligi" },
  { value: "damaged", label: "Hasarli Urun (Kargo)" },
  { value: "not_as_described", label: "Urun Tarifine Uymuyor" },
  { value: "other", label: "Diger" },
] as const;

export type ReturnReasonValue = (typeof RETURN_REASONS)[number]["value"];

// İade numarası üret
export async function generateReturnNumber(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const num = Math.floor(100000 + Math.random() * 900000);
    const returnNumber = `RT-${num}`;
    const existing = await prisma.return.findUnique({
      where: { returnNumber },
      select: { id: true },
    });
    if (!existing) return returnNumber;
    attempts++;
  }
  // Fallback — timestamp based
  return `RT-${Date.now().toString().slice(-8)}`;
}

// Sipariş iade edilebilir mi kontrol et
export function canRequestReturn(order: {
  status: string;
  updatedAt: Date | string;
}): { allowed: boolean; reason?: string } {
  if (order.status !== "DELIVERED") {
    return { allowed: false, reason: "Sadece teslim edilmis siparisler icin iade talebi olusturulabilir." };
  }

  const deliveredDate = new Date(order.updatedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 14) {
    return { allowed: false, reason: "Iade suresi (14 gun) dolmustur." };
  }

  return { allowed: true };
}

// İade tutarı hesapla
export function calculateRefundAmount(
  items: { price: number; quantity: number }[]
): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Durum label'ları
export const RETURN_STATUS_LABELS: Record<string, string> = {
  PENDING: "Beklemede",
  APPROVED: "Onaylandi",
  REJECTED: "Reddedildi",
  RECEIVED: "Teslim Alindi",
  REFUNDED: "Iade Edildi",
  CANCELLED: "Iptal Edildi",
};

export const RETURN_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-warning",
  APPROVED: "bg-primary",
  REJECTED: "bg-danger",
  RECEIVED: "bg-blue-500",
  REFUNDED: "bg-success",
  CANCELLED: "bg-muted",
};

// İade nedeni label'ını getir
export function getReturnReasonLabel(value: string): string {
  const found = RETURN_REASONS.find((r) => r.value === value);
  return found?.label || value;
}
