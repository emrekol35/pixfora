export const CHART_COLORS = {
  primary: "#3b82f6",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  purple: "#8b5cf6",
  orange: "#f97316",
  pink: "#ec4899",
  palette: [
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#f97316",
    "#06b6d4",
    "#ec4899",
  ],
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  PROCESSING: "#8b5cf6",
  SHIPPED: "#06b6d4",
  DELIVERED: "#22c55e",
  CANCELLED: "#ef4444",
  REFUNDED: "#f97316",
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Beklemede",
  CONFIRMED: "Onaylandi",
  PROCESSING: "Hazirlaniyor",
  SHIPPED: "Kargoda",
  DELIVERED: "Teslim Edildi",
  CANCELLED: "Iptal",
  REFUNDED: "Iade",
};

export const PAYMENT_LABELS: Record<string, string> = {
  CREDIT_CARD: "Kredi Karti",
  BANK_TRANSFER: "Havale/EFT",
  CASH_ON_DELIVERY: "Kapida Odeme",
};

export const SHIPMENT_STATUS_COLORS: Record<string, string> = {
  CREATED: "#f59e0b",
  PICKED_UP: "#3b82f6",
  IN_TRANSIT: "#8b5cf6",
  OUT_FOR_DELIVERY: "#06b6d4",
  DELIVERED: "#22c55e",
  RETURNED: "#f97316",
  FAILED: "#ef4444",
};

export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  CREATED: "Olusturuldu",
  PICKED_UP: "Alindi",
  IN_TRANSIT: "Yolda",
  OUT_FOR_DELIVERY: "Dagitimda",
  DELIVERED: "Teslim Edildi",
  RETURNED: "Iade Edildi",
  FAILED: "Basarisiz",
};

export const RETURN_STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  APPROVED: "#3b82f6",
  REJECTED: "#ef4444",
  RECEIVED: "#8b5cf6",
  REFUNDED: "#22c55e",
  CANCELLED: "#6b7280",
};

export const RETURN_STATUS_LABELS: Record<string, string> = {
  PENDING: "Beklemede",
  APPROVED: "Onaylandi",
  REJECTED: "Reddedildi",
  RECEIVED: "Teslim Alindi",
  REFUNDED: "Iade Edildi",
  CANCELLED: "Iptal",
};
