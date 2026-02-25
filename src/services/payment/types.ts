export interface PaymentRequest {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency?: string;
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    phone: string;
    ip: string;
    city: string;
    country?: string;
    address: string;
    zipCode?: string;
  };
  shippingAddress: {
    name: string;
    city: string;
    address: string;
    zipCode?: string;
  };
  billingAddress: {
    name: string;
    city: string;
    address: string;
    zipCode?: string;
  };
  items: {
    id: string;
    name: string;
    category: string;
    price: number;
    quantity: number;
  }[];
  card?: {
    holderName: string;
    number: string;
    expireMonth: string;
    expireYear: string;
    cvc: string;
  };
  installment?: number;
  callbackUrl: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  conversationId?: string;
  htmlContent?: string; // 3D Secure redirect HTML
  errorMessage?: string;
  errorCode?: string;
  fraudStatus?: number;
  paidPrice?: number;
}

export interface RefundRequest {
  paymentTransactionId: string;
  amount: number;
  conversationId?: string;
  ip: string;
}

export interface RefundResult {
  success: boolean;
  paymentId?: string;
  errorMessage?: string;
}

export interface InstallmentInfo {
  bankName: string;
  installmentCount: number;
  totalPrice: number;
  installmentPrice: number;
}

export interface BankAccount {
  bankName: string;
  accountHolder: string;
  iban: string;
  branch?: string;
  accountNo?: string;
}
