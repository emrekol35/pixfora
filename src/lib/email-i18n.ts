// =============================================================
// Email Internationalization (i18n) Dictionary
// Supported locales: Turkish (tr), English (en)
// =============================================================

export type EmailLocale = "tr" | "en";

export interface EmailTranslations {
  // --- Common / Shared ---
  autoEmail: string;
  allRightsReserved: string;
  hello: (name?: string) => string;
  orderNumberLabel: string;

  // --- Order Confirmation ---
  orderConfirmation: {
    subject: (orderNumber: string) => string;
    title: string;
    paymentMethodLabel: string;
    productCol: string;
    quantityCol: string;
    amountCol: string;
    totalLabel: string;
    trackOrders: string;
    paymentLabels: Record<string, string>;
  };

  // --- Shipping Notification ---
  shippingNotification: {
    subject: (orderNumber: string) => string;
    title: string;
    shippingCompanyLabel: string;
    trackingNumberLabel: string;
    trackOrder: string;
    trackingHelp: string;
  };

  // --- Payment Confirmation ---
  paymentConfirmation: {
    subject: (orderNumber: string) => string;
    title: string;
    totalAmount: string;
    preparingOrder: string;
    trackOrders: string;
  };

  // --- Order Status Change ---
  orderStatusChange: {
    subject: (statusLabel: string, orderNumber: string) => string;
    statusTitle: (statusLabel: string) => string;
    shippingCompanyLabel: string;
    trackingNumberLabel: string;
    trackOrder: string;
    viewOrderDetails: string;
    defaultCompanyName: string;
  };

  // --- Bank Transfer Info ---
  bankTransferInfo: {
    subject: (orderNumber: string) => string;
    title: string;
    amountToPay: string;
    ibanReminder: string;
    accountHolder: string;
  };

  // --- Low Stock Alert (Admin) ---
  lowStockAlert: {
    subject: (count: number) => string;
    headerTitle: string;
    title: string;
    description: (count: number) => string;
    productCol: string;
    skuCol: string;
    stockCol: string;
    manageProducts: string;
  };

  // --- Back In Stock ---
  backInStock: {
    subject: (productName: string) => string;
    body: string;
    viewProduct: string;
  };

  // --- Abandoned Cart ---
  abandonedCart: {
    subject: string;
    body: string;
    goToCart: string;
  };

  // --- Return Request ---
  returnRequest: {
    subject: (returnNumber: string) => string;
    title: string;
    returnNumberLabel: string;
    orderNumberLabel: string;
    productCol: string;
    quantityCol: string;
    amountCol: string;
    refundAmountLabel: string;
    pendingReview: string;
    trackReturns: string;
  };

  // --- Return Approved ---
  returnApproved: {
    subject: (returnNumber: string) => string;
    title: string;
    returnNumberLabel: string;
    orderNumberLabel: string;
    storeNote: string;
    instructions: string;
    returnDetails: string;
  };

  // --- Return Rejected ---
  returnRejected: {
    subject: (returnNumber: string) => string;
    title: string;
    returnNumberLabel: string;
    orderNumberLabel: string;
    rejectionReason: string;
    contactUs: string;
    contactButton: string;
  };

  // --- Return Refunded ---
  returnRefunded: {
    subject: (returnNumber: string) => string;
    title: string;
    returnNumberLabel: string;
    orderNumberLabel: string;
    refundAmountLabel: string;
    refundNotice: string;
    returnDetails: string;
  };

  // --- Delivery Confirmation ---
  deliveryConfirmation: {
    subject: (orderNumber: string) => string;
    title: string;
    deliveryDateLabel: string;
    deliverySuccess: string;
    reviewPrompt: string;
    viewOrders: string;
    returnNotice: string;
  };

  // --- Recommendation ---
  recommendation: {
    subject: string;
    title: string;
    body: string;
    discoverAll: string;
  };

  // --- Newsletter Confirmation ---
  newsletterConfirmation: {
    subject: string;
    title: string;
    body: string;
    confirmButton: string;
    ignoreNotice: string;
    unsubscribe: string;
  };
}

// ---------------------------------------------------------
// Turkish translations
// ---------------------------------------------------------
const tr: EmailTranslations = {
  autoEmail: "Bu e-posta otomatik olarak gonderilmistir.",
  allRightsReserved: "Tum haklar saklidir.",
  hello: (name?: string) => `Merhaba${name ? ` ${name}` : ""},`,
  orderNumberLabel: "Siparis numaraniz:",

  orderConfirmation: {
    subject: (orderNumber) => `Siparisiniz Alindi (#${orderNumber})`,
    title: "Siparisiniz Alindi!",
    paymentMethodLabel: "Odeme Yontemi:",
    productCol: "Urun",
    quantityCol: "Adet",
    amountCol: "Tutar",
    totalLabel: "Toplam:",
    trackOrders: "Siparislerinizi takip etmek icin tiklayiniz",
    paymentLabels: {
      CREDIT_CARD: "Kredi Karti",
      BANK_TRANSFER: "Havale / EFT",
      CASH_ON_DELIVERY: "Kapida Odeme",
    },
  },

  shippingNotification: {
    subject: (orderNumber) => `Siparisiniz Kargoya Verildi (#${orderNumber})`,
    title: "Siparisiniz Kargoya Verildi!",
    shippingCompanyLabel: "Kargo Firmasi:",
    trackingNumberLabel: "Takip Numarasi:",
    trackOrder: "Siparisimi Takip Et",
    trackingHelp:
      "Siparis takip sayfasinda siparis numaranizi ve e-posta adresinizi girerek kargo durumunuzu ogrenebilirsiniz.",
  },

  paymentConfirmation: {
    subject: (orderNumber) => `Odemeniz Onaylandi (#${orderNumber})`,
    title: "Odemeniz Onaylandi!",
    totalAmount: "Toplam tutar:",
    preparingOrder: "Siparisiniz hazirlama asamasina alindi.",
    trackOrders: "Siparislerinizi takip etmek icin tiklayiniz",
  },

  orderStatusChange: {
    subject: (statusLabel, orderNumber) =>
      `Siparis Durumu: ${statusLabel} (#${orderNumber})`,
    statusTitle: (statusLabel) => `Siparis Durumu: ${statusLabel}`,
    shippingCompanyLabel: "Kargo Firmasi:",
    trackingNumberLabel: "Takip Numarasi:",
    trackOrder: "Siparisimi Takip Et",
    viewOrderDetails: "Siparis detaylarini goruntuleyiniz",
    defaultCompanyName: "Kargo",
  },

  bankTransferInfo: {
    subject: (orderNumber) => `Havale Bilgileri (#${orderNumber})`,
    title: "Havale/EFT Bilgileri",
    amountToPay: "Odenecek tutar:",
    ibanReminder:
      "Aciklama kisimna siparis numaranizi yazmayi unutmayiniz!",
    accountHolder: "Hesap Sahibi:",
  },

  lowStockAlert: {
    subject: (count) => `Dusuk Stok Uyarisi (${count} urun)`,
    headerTitle: "Stok Uyarisi",
    title: "Dusuk Stoklu Urunler",
    description: (count) =>
      `Asagidaki <strong>${count}</strong> urunun stogu kritik seviyenin altina dustu:`,
    productCol: "Urun",
    skuCol: "SKU",
    stockCol: "Stok",
    manageProducts: "Urunleri Yonet",
  },

  backInStock: {
    subject: (productName) => `${productName} tekrar stokta!`,
    body: "Takip ettiginiz urun tekrar stokta! Hemen satin alabilirsiniz:",
    viewProduct: "Urunu Incele",
  },

  abandonedCart: {
    subject: "Sepetinizde urunler bekliyor!",
    body: "Sepetinizde bekleyen urunler var! Hemen siparisinizi tamamlayin:",
    goToCart: "Sepetime Git",
  },

  returnRequest: {
    subject: (returnNumber) => `Iade Talebiniz Alindi (#${returnNumber})`,
    title: "Iade Talebiniz Alindi",
    returnNumberLabel: "Iade numaraniz:",
    orderNumberLabel: "Siparis numarasi:",
    productCol: "Urun",
    quantityCol: "Adet",
    amountCol: "Tutar",
    refundAmountLabel: "Iade Tutari:",
    pendingReview: "Talebiniz en kisa surede degerlendirilecektir.",
    trackReturns: "Iadelerimi Takip Et",
  },

  returnApproved: {
    subject: (returnNumber) =>
      `Iade Talebiniz Onaylandi (#${returnNumber})`,
    title: "Iade Talebiniz Onaylandi!",
    returnNumberLabel: "Iade numaraniz:",
    orderNumberLabel: "Siparis numarasi:",
    storeNote: "Magaza Notu:",
    instructions:
      "Lutfen iade edilecek urunu kargoyla gonderiniz. Urun teslim alindiginda iade islemi tamamlanacaktir.",
    returnDetails: "Iade Detayi",
  },

  returnRejected: {
    subject: (returnNumber) =>
      `Iade Talebiniz Reddedildi (#${returnNumber})`,
    title: "Iade Talebiniz Reddedildi",
    returnNumberLabel: "Iade numaraniz:",
    orderNumberLabel: "Siparis numarasi:",
    rejectionReason: "Red Nedeni:",
    contactUs: "Sorulariniz icin bizimle iletisime gecebilirsiniz.",
    contactButton: "Iletisim",
  },

  returnRefunded: {
    subject: (returnNumber) =>
      `Iade Tutariniz Yatirildi (#${returnNumber})`,
    title: "Iade Islemi Tamamlandi!",
    returnNumberLabel: "Iade numaraniz:",
    orderNumberLabel: "Siparis numarasi:",
    refundAmountLabel: "Iade Tutari",
    refundNotice:
      "Iade tutari orijinal odeme yontinenize yatirilmistir. Hesabiniza yansimasi 3-10 is gunu surebilir.",
    returnDetails: "Iade Detayi",
  },

  deliveryConfirmation: {
    subject: (orderNumber) =>
      `Siparisleriniz Teslim Edildi (#${orderNumber})`,
    title: "Siparisleriniz Teslim Edildi!",
    deliveryDateLabel: "Teslim tarihi:",
    deliverySuccess: "Teslimat Basariyla Tamamlandi",
    reviewPrompt:
      "Siparislerinizden memnun kaldiysiniz, urunlerimizi degerlendirerek diger musterilerimize yardimci olabilirsiniz.",
    viewOrders: "Siparislerimi Gor",
    returnNotice:
      "Herhangi bir sorun yasarsaniz, 14 gun icinde iade talebi olusturabilirsiniz.",
  },

  recommendation: {
    subject: "Size Ozel Urun Onerileri",
    title: "Size Ozel Secilmis Urunler",
    body: "Alisveris gecmisinize gore sectigimiz urunleri gormek ister misiniz?",
    discoverAll: "Tum Urunleri Kesfet",
  },

  newsletterConfirmation: {
    subject: "E-Bulten Aboneliginizi Onaylayin",
    title: "E-Bulten Aboneligi",
    body: "e-bultenine abone oldugunuz icin tesekkur ederiz! Aboneliginizi onaylamak icin asagidaki butona tiklayin.",
    confirmButton: "Aboneligi Onayla",
    ignoreNotice:
      "Bu e-postayi siz talep etmediyseniz, gormezden gelebilirsiniz.",
    unsubscribe: "Abonelikten cik",
  },
};

// ---------------------------------------------------------
// English translations
// ---------------------------------------------------------
const en: EmailTranslations = {
  autoEmail: "This email was sent automatically.",
  allRightsReserved: "All rights reserved.",
  hello: (name?: string) => `Hello${name ? ` ${name}` : ""},`,
  orderNumberLabel: "Your order number:",

  orderConfirmation: {
    subject: (orderNumber) =>
      `Your Order Has Been Received (#${orderNumber})`,
    title: "Your Order Has Been Received!",
    paymentMethodLabel: "Payment Method:",
    productCol: "Product",
    quantityCol: "Qty",
    amountCol: "Amount",
    totalLabel: "Total:",
    trackOrders: "Click here to track your orders",
    paymentLabels: {
      CREDIT_CARD: "Credit Card",
      BANK_TRANSFER: "Bank Transfer / Wire",
      CASH_ON_DELIVERY: "Cash on Delivery",
    },
  },

  shippingNotification: {
    subject: (orderNumber) =>
      `Your Order Has Been Shipped (#${orderNumber})`,
    title: "Your Order Has Been Shipped!",
    shippingCompanyLabel: "Shipping Company:",
    trackingNumberLabel: "Tracking Number:",
    trackOrder: "Track My Order",
    trackingHelp:
      "You can check your shipment status on the order tracking page by entering your order number and email address.",
  },

  paymentConfirmation: {
    subject: (orderNumber) =>
      `Your Payment Has Been Confirmed (#${orderNumber})`,
    title: "Your Payment Has Been Confirmed!",
    totalAmount: "Total amount:",
    preparingOrder: "Your order is now being prepared.",
    trackOrders: "Click here to track your orders",
  },

  orderStatusChange: {
    subject: (statusLabel, orderNumber) =>
      `Order Status: ${statusLabel} (#${orderNumber})`,
    statusTitle: (statusLabel) => `Order Status: ${statusLabel}`,
    shippingCompanyLabel: "Shipping Company:",
    trackingNumberLabel: "Tracking Number:",
    trackOrder: "Track My Order",
    viewOrderDetails: "View order details",
    defaultCompanyName: "Carrier",
  },

  bankTransferInfo: {
    subject: (orderNumber) =>
      `Bank Transfer Information (#${orderNumber})`,
    title: "Bank Transfer / Wire Information",
    amountToPay: "Amount to pay:",
    ibanReminder:
      "Please do not forget to include your order number in the payment description!",
    accountHolder: "Account Holder:",
  },

  lowStockAlert: {
    subject: (count) => `Low Stock Alert (${count} products)`,
    headerTitle: "Stock Alert",
    title: "Low Stock Products",
    description: (count) =>
      `The following <strong>${count}</strong> products have fallen below the critical stock level:`,
    productCol: "Product",
    skuCol: "SKU",
    stockCol: "Stock",
    manageProducts: "Manage Products",
  },

  backInStock: {
    subject: (productName) => `${productName} is back in stock!`,
    body: "The product you were following is back in stock! You can buy it now:",
    viewProduct: "View Product",
  },

  abandonedCart: {
    subject: "You have items waiting in your cart!",
    body: "You have items waiting in your cart! Complete your order now:",
    goToCart: "Go to My Cart",
  },

  returnRequest: {
    subject: (returnNumber) =>
      `Your Return Request Has Been Received (#${returnNumber})`,
    title: "Your Return Request Has Been Received",
    returnNumberLabel: "Your return number:",
    orderNumberLabel: "Order number:",
    productCol: "Product",
    quantityCol: "Qty",
    amountCol: "Amount",
    refundAmountLabel: "Refund Amount:",
    pendingReview: "Your request will be reviewed as soon as possible.",
    trackReturns: "Track My Returns",
  },

  returnApproved: {
    subject: (returnNumber) =>
      `Your Return Request Has Been Approved (#${returnNumber})`,
    title: "Your Return Request Has Been Approved!",
    returnNumberLabel: "Your return number:",
    orderNumberLabel: "Order number:",
    storeNote: "Store Note:",
    instructions:
      "Please ship the item to be returned via cargo. The return process will be completed once the item is received.",
    returnDetails: "Return Details",
  },

  returnRejected: {
    subject: (returnNumber) =>
      `Your Return Request Has Been Rejected (#${returnNumber})`,
    title: "Your Return Request Has Been Rejected",
    returnNumberLabel: "Your return number:",
    orderNumberLabel: "Order number:",
    rejectionReason: "Rejection Reason:",
    contactUs:
      "If you have any questions, please feel free to contact us.",
    contactButton: "Contact Us",
  },

  returnRefunded: {
    subject: (returnNumber) =>
      `Your Refund Has Been Processed (#${returnNumber})`,
    title: "Return Process Completed!",
    returnNumberLabel: "Your return number:",
    orderNumberLabel: "Order number:",
    refundAmountLabel: "Refund Amount",
    refundNotice:
      "The refund has been credited to your original payment method. It may take 3-10 business days to appear in your account.",
    returnDetails: "Return Details",
  },

  deliveryConfirmation: {
    subject: (orderNumber) =>
      `Your Order Has Been Delivered (#${orderNumber})`,
    title: "Your Order Has Been Delivered!",
    deliveryDateLabel: "Delivery date:",
    deliverySuccess: "Delivery Completed Successfully",
    reviewPrompt:
      "If you are satisfied with your order, you can help other customers by reviewing our products.",
    viewOrders: "View My Orders",
    returnNotice:
      "If you experience any issues, you can create a return request within 14 days.",
  },

  recommendation: {
    subject: "Product Recommendations Just for You",
    title: "Products Selected Just for You",
    body: "Would you like to see the products we selected based on your shopping history?",
    discoverAll: "Discover All Products",
  },

  newsletterConfirmation: {
    subject: "Confirm Your Newsletter Subscription",
    title: "Newsletter Subscription",
    body: "Thank you for subscribing to our newsletter! Click the button below to confirm your subscription.",
    confirmButton: "Confirm Subscription",
    ignoreNotice:
      "If you did not request this email, you can safely ignore it.",
    unsubscribe: "Unsubscribe",
  },
};

// ---------------------------------------------------------
// Translations map & accessor
// ---------------------------------------------------------
const translations: Record<EmailLocale, EmailTranslations> = { tr, en };

export function getEmailTranslations(locale: EmailLocale = "tr"): EmailTranslations {
  return translations[locale] || translations.tr;
}
