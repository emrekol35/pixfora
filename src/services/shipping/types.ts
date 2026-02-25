export interface ShipmentRequest {
  orderId: string;
  orderNumber: string;
  sender: {
    name: string;
    phone: string;
    city: string;
    district: string;
    address: string;
  };
  receiver: {
    name: string;
    phone: string;
    city: string;
    district: string;
    address: string;
  };
  parcels: {
    weight: number; // kg
    desi: number;
    count: number;
  };
  description?: string;
  isCOD?: boolean; // Kapida odeme
  codAmount?: number;
}

export interface ShipmentResult {
  success: boolean;
  trackingNumber?: string;
  barcode?: string;
  errorMessage?: string;
}

export interface TrackingResult {
  success: boolean;
  status: string;
  statusCode: string;
  events: TrackingEvent[];
  estimatedDelivery?: string;
  errorMessage?: string;
}

export interface TrackingEvent {
  date: string;
  status: string;
  location: string;
  description: string;
}

export interface ShippingRate {
  provider: string;
  providerName: string;
  price: number;
  estimatedDays: string;
  description?: string;
}

export interface ShippingProvider {
  name: string;
  code: string;
  calculateRate(weight: number, desi: number, city: string): Promise<ShippingRate>;
  createShipment(req: ShipmentRequest): Promise<ShipmentResult>;
  getTracking(trackingNumber: string): Promise<TrackingResult>;
}
