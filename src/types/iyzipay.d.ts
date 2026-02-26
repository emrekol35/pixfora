declare module "iyzipay" {
  interface IyzipayConfig {
    apiKey: string;
    secretKey: string;
    uri: string;
  }

  interface ThreedsInitializeRequest {
    locale: string;
    conversationId: string;
    price: string;
    paidPrice: string;
    currency: string;
    installment: string;
    basketId: string;
    paymentChannel: string;
    paymentGroup: string;
    callbackUrl: string;
    paymentCard?: {
      cardHolderName: string;
      cardNumber: string;
      expireMonth: string;
      expireYear: string;
      cvc: string;
      registerCard: string;
    };
    buyer: {
      id: string;
      name: string;
      surname: string;
      gsmNumber: string;
      email: string;
      identityNumber: string;
      lastLoginDate: string;
      registrationDate: string;
      registrationAddress: string;
      ip: string;
      city: string;
      country: string;
      zipCode: string;
    };
    shippingAddress: {
      contactName: string;
      city: string;
      country: string;
      address: string;
      zipCode: string;
    };
    billingAddress: {
      contactName: string;
      city: string;
      country: string;
      address: string;
      zipCode: string;
    };
    basketItems: {
      id: string;
      name: string;
      category1: string;
      itemType: string;
      price: string;
    }[];
  }

  type IyzipayCallback = (err: Error | null, result: Record<string, unknown>) => void;

  class Iyzipay {
    constructor(config: IyzipayConfig);

    threedsInitialize: {
      create(request: ThreedsInitializeRequest, callback: IyzipayCallback): void;
    };

    threedsPayment: {
      create(request: { locale: string; paymentId: string }, callback: IyzipayCallback): void;
    };

    refund: {
      create(
        request: {
          locale: string;
          conversationId: string;
          paymentTransactionId: string;
          price: string;
          currency: string;
          ip: string;
        },
        callback: IyzipayCallback
      ): void;
    };

    installmentInfo: {
      create(
        request: {
          locale: string;
          conversationId: string;
          binNumber: string;
          price: string;
        },
        callback: IyzipayCallback
      ): void;
    };

    static LOCALE: { TR: string; EN: string };
    static CURRENCY: { TRY: string; EUR: string; USD: string; GBP: string };
    static PAYMENT_CHANNEL: { WEB: string; MOBILE: string; MOBILE_WEB: string };
    static PAYMENT_GROUP: { PRODUCT: string; LISTING: string; SUBSCRIPTION: string };
    static BASKET_ITEM_TYPE: { PHYSICAL: string; VIRTUAL: string };
  }

  export = Iyzipay;
}
