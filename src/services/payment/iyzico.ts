import Iyzipay from "iyzipay";
import type { PaymentRequest, PaymentResult, RefundRequest, RefundResult, InstallmentInfo } from "./types";

let _iyzipay: Iyzipay | null = null;

function getClient(): Iyzipay {
  if (!_iyzipay) {
    _iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY || "",
      secretKey: process.env.IYZICO_SECRET_KEY || "",
      uri: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
    });
  }
  return _iyzipay;
}

function buildPaymentData(req: PaymentRequest) {
  return {
    locale: Iyzipay.LOCALE.TR,
    conversationId: req.orderId,
    price: req.amount.toFixed(2),
    paidPrice: req.amount.toFixed(2),
    currency: Iyzipay.CURRENCY.TRY,
    installment: String(req.installment || 1),
    basketId: req.orderNumber,
    paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    paymentCard: req.card
      ? {
          cardHolderName: req.card.holderName,
          cardNumber: req.card.number,
          expireMonth: req.card.expireMonth,
          expireYear: req.card.expireYear,
          cvc: req.card.cvc,
          registerCard: "0",
        }
      : undefined,
    buyer: {
      id: req.buyer.id,
      name: req.buyer.name,
      surname: req.buyer.surname,
      gsmNumber: req.buyer.phone,
      email: req.buyer.email,
      identityNumber: "11111111111",
      lastLoginDate: new Date().toISOString().split("T")[0] + " 00:00:00",
      registrationDate: new Date().toISOString().split("T")[0] + " 00:00:00",
      registrationAddress: req.buyer.address,
      ip: req.buyer.ip,
      city: req.buyer.city,
      country: req.buyer.country || "Turkey",
      zipCode: req.buyer.zipCode || "00000",
    },
    shippingAddress: {
      contactName: req.shippingAddress.name,
      city: req.shippingAddress.city,
      country: "Turkey",
      address: req.shippingAddress.address,
      zipCode: req.shippingAddress.zipCode || "00000",
    },
    billingAddress: {
      contactName: req.billingAddress.name,
      city: req.billingAddress.city,
      country: "Turkey",
      address: req.billingAddress.address,
      zipCode: req.billingAddress.zipCode || "00000",
    },
    basketItems: req.items.map((item) => ({
      id: item.id,
      name: item.name,
      category1: item.category,
      itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
      price: (item.price * item.quantity).toFixed(2),
    })),
    callbackUrl: req.callbackUrl,
  };
}

export async function initiate3DPayment(req: PaymentRequest): Promise<PaymentResult> {
  return new Promise((resolve) => {
    const data = buildPaymentData(req);

    getClient().threedsInitialize.create(data, (err: Error | null, result: Record<string, unknown>) => {
      if (err) {
        resolve({ success: false, errorMessage: err.message });
        return;
      }

      if (result.status === "success") {
        resolve({
          success: true,
          htmlContent: result.threeDSHtmlContent as string,
          conversationId: result.conversationId as string,
        });
      } else {
        resolve({
          success: false,
          errorMessage: (result.errorMessage as string) || "Odeme baslatma hatasi",
          errorCode: result.errorCode as string,
        });
      }
    });
  });
}

export async function complete3DPayment(paymentId: string): Promise<PaymentResult> {
  return new Promise((resolve) => {
    getClient().threedsPayment.create(
      {
        locale: Iyzipay.LOCALE.TR,
        paymentId,
      },
      (err: Error | null, result: Record<string, unknown>) => {
        if (err) {
          resolve({ success: false, errorMessage: err.message });
          return;
        }

        if (result.status === "success") {
          resolve({
            success: true,
            paymentId: result.paymentId as string,
            conversationId: result.conversationId as string,
            fraudStatus: result.fraudStatus as number,
            paidPrice: parseFloat(result.paidPrice as string),
          });
        } else {
          resolve({
            success: false,
            errorMessage: (result.errorMessage as string) || "Odeme tamamlama hatasi",
            errorCode: result.errorCode as string,
          });
        }
      }
    );
  });
}

export async function getInstallmentInfo(binNumber: string, price: number): Promise<InstallmentInfo[]> {
  return new Promise((resolve) => {
    getClient().installmentInfo.create(
      {
        locale: Iyzipay.LOCALE.TR,
        conversationId: `inst_${Date.now()}`,
        binNumber,
        price: price.toFixed(2),
      },
      (err: Error | null, result: Record<string, unknown>) => {
        if (err) {
          resolve([]);
          return;
        }

        if (result.status === "success" && result.installmentDetails) {
          const details = result.installmentDetails as Array<{
            bankName: string;
            installmentPrices: Array<{
              installmentNumber: number;
              totalPrice: number;
              installmentPrice: number;
            }>;
          }>;

          const installments: InstallmentInfo[] = [];
          for (const detail of details) {
            for (const inst of detail.installmentPrices || []) {
              if (inst.installmentNumber > 1) {
                installments.push({
                  bankName: detail.bankName || "",
                  installmentCount: inst.installmentNumber,
                  totalPrice: typeof inst.totalPrice === "string" ? parseFloat(inst.totalPrice) : inst.totalPrice,
                  installmentPrice: typeof inst.installmentPrice === "string" ? parseFloat(inst.installmentPrice) : inst.installmentPrice,
                });
              }
            }
          }
          resolve(installments);
        } else {
          resolve([]);
        }
      }
    );
  });
}

export async function refundPayment(req: RefundRequest): Promise<RefundResult> {
  return new Promise((resolve) => {
    getClient().refund.create(
      {
        locale: Iyzipay.LOCALE.TR,
        conversationId: req.conversationId || "",
        paymentTransactionId: req.paymentTransactionId,
        price: req.amount.toFixed(2),
        currency: Iyzipay.CURRENCY.TRY,
        ip: req.ip,
      },
      (err: Error | null, result: Record<string, unknown>) => {
        if (err) {
          resolve({ success: false, errorMessage: err.message });
          return;
        }

        if (result.status === "success") {
          resolve({
            success: true,
            paymentId: result.paymentId as string,
          });
        } else {
          resolve({
            success: false,
            errorMessage: (result.errorMessage as string) || "Iade hatasi",
          });
        }
      }
    );
  });
}
