import type {
  ShippingProvider,
  ShippingRate,
  ShipmentRequest,
  ShipmentResult,
  TrackingResult,
} from "./types";

const API_URL = process.env.ARAS_API_URL || "https://customerservices.araskargo.com.tr/ArasCargoCustomerIntegrationService";
const USERNAME = process.env.ARAS_USERNAME || "";
const PASSWORD = process.env.ARAS_PASSWORD || "";
const CUSTOMER_CODE = process.env.ARAS_CUSTOMER_CODE || "";

async function callApi(action: string, body: string): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/ArasCargoIntegrationService.svc`, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: `http://tempuri.org/IArasCargoIntegrationService/${action}`,
      },
      body,
    });
    return await res.text();
  } catch (error) {
    console.error("Aras API error:", error);
    return "";
  }
}

export const arasKargo: ShippingProvider = {
  name: "Aras Kargo",
  code: "aras",

  async calculateRate(weight: number, desi: number, _city: string): Promise<ShippingRate> {
    const chargeableWeight = Math.max(weight, desi);
    let price = 42.9;

    if (chargeableWeight > 1) price += (chargeableWeight - 1) * 5.5;
    if (chargeableWeight > 10) price += (chargeableWeight - 10) * 3.5;

    return {
      provider: "aras",
      providerName: "Aras Kargo",
      price: Math.round(price * 100) / 100,
      estimatedDays: "2-4 is gunu",
    };
  },

  async createShipment(req: ShipmentRequest): Promise<ShipmentResult> {
    if (!USERNAME) {
      const trackingNumber = `AK${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      return { success: true, trackingNumber };
    }

    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
      <soap:Body>
        <tem:SetOrder>
          <tem:orderInfo>
            <tem:UserName>${USERNAME}</tem:UserName>
            <tem:Password>${PASSWORD}</tem:Password>
            <tem:TradingWaybillNumber>${req.orderNumber}</tem:TradingWaybillNumber>
            <tem:InvoiceNumber>${req.orderNumber}</tem:InvoiceNumber>
            <tem:ReceiverName>${req.receiver.name}</tem:ReceiverName>
            <tem:ReceiverPhone>${req.receiver.phone}</tem:ReceiverPhone>
            <tem:ReceiverAddress>${req.receiver.address}</tem:ReceiverAddress>
            <tem:ReceiverCityName>${req.receiver.city}</tem:ReceiverCityName>
            <tem:ReceiverTownName>${req.receiver.district}</tem:ReceiverTownName>
            <tem:PieceCount>${req.parcels.count}</tem:PieceCount>
            <tem:Weight>${req.parcels.weight}</tem:Weight>
            <tem:VolumetricWeight>${req.parcels.desi}</tem:VolumetricWeight>
            <tem:IsCOD>${req.isCOD ? 1 : 0}</tem:IsCOD>
            <tem:CODAmount>${req.codAmount || 0}</tem:CODAmount>
            <tem:CustomerCode>${CUSTOMER_CODE}</tem:CustomerCode>
            <tem:Description>${req.description || ""}</tem:Description>
          </tem:orderInfo>
        </tem:SetOrder>
      </soap:Body>
    </soap:Envelope>`;

    const response = await callApi("SetOrder", soapBody);

    if (!response) {
      return { success: false, errorMessage: "API baglanti hatasi" };
    }

    // SOAP yaniti parse et
    const trackingMatch = response.match(/<TrackingNumber>([^<]+)<\/TrackingNumber>/);
    if (trackingMatch) {
      return { success: true, trackingNumber: trackingMatch[1] };
    }

    const errorMatch = response.match(/<ResultMessage>([^<]+)<\/ResultMessage>/);
    return {
      success: false,
      errorMessage: errorMatch ? errorMatch[1] : "Gonderim olusturulamadi",
    };
  },

  async getTracking(trackingNumber: string): Promise<TrackingResult> {
    if (!USERNAME) {
      return {
        success: true,
        status: "Dagitimda",
        statusCode: "IN_DELIVERY",
        events: [
          { date: new Date().toISOString(), status: "Dagitimda", location: "Istanbul", description: "Kargo dagitima cikti" },
        ],
      };
    }

    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
      <soap:Body>
        <tem:GetQueryJSON>
          <tem:loginInfo>
            <tem:UserName>${USERNAME}</tem:UserName>
            <tem:Password>${PASSWORD}</tem:Password>
            <tem:CustomerCode>${CUSTOMER_CODE}</tem:CustomerCode>
          </tem:loginInfo>
          <tem:queryInfo>
            <tem:QueryType>1</tem:QueryType>
            <tem:IntegrationCode>${trackingNumber}</tem:IntegrationCode>
          </tem:queryInfo>
        </tem:GetQueryJSON>
      </soap:Body>
    </soap:Envelope>`;

    const response = await callApi("GetQueryJSON", soapBody);

    if (!response) {
      return { success: false, status: "", statusCode: "", events: [], errorMessage: "API baglanti hatasi" };
    }

    return {
      success: true,
      status: "Sorguya acik",
      statusCode: "ACTIVE",
      events: [],
    };
  },
};
