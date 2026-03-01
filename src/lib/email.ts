import nodemailer from "nodemailer";
import { EmailLocale, getEmailTranslations } from "./email-i18n";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("[Email] SMTP yapilandirilmamis, email gonderilmedi:", options.subject);
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `Pixfora <noreply@pixfora.com>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log("[Email] Gonderildi:", options.to, options.subject);
    return true;
  } catch (error) {
    console.error("[Email] Gonderim hatasi:", error);
    return false;
  }
}

// Helper: locale-aware price formatter
function createPriceFormatter(locale: EmailLocale) {
  return (p: number) =>
    new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
      style: "currency",
      currency: locale === "tr" ? "TRY" : "USD",
    }).format(p);
}

// Siparis Onay Maili
export function orderConfirmationEmail(order: {
  orderNumber: string;
  total: number;
  items: { name: string; quantity: number; price: number }[];
  paymentMethod: string;
}, locale: EmailLocale = "tr") {
  const t = getEmailTranslations(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pixfora.com";
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";
  const formatPrice = createPriceFormatter(locale);

  const paymentLabel =
    t.orderConfirmation.paymentLabels[order.paymentMethod] ||
    t.orderConfirmation.paymentLabels.CASH_ON_DELIVERY;

  const itemsHtml = order.items
    .map((i) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatPrice(i.price * i.quantity)}</td></tr>`)
    .join("");

  return {
    subject: `${siteName} - ${t.orderConfirmation.subject(order.orderNumber)}`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="color:#2563eb;margin-top:0">${t.orderConfirmation.title}</h2>
        <p>${t.orderNumberLabel} <strong>#${order.orderNumber}</strong></p>
        <p>${t.orderConfirmation.paymentMethodLabel} <strong>${paymentLabel}</strong></p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">${t.orderConfirmation.productCol}</th><th style="padding:8px;text-align:center">${t.orderConfirmation.quantityCol}</th><th style="padding:8px;text-align:right">${t.orderConfirmation.amountCol}</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot><tr><td colspan="2" style="padding:8px;font-weight:bold;text-align:right">${t.orderConfirmation.totalLabel}</td><td style="padding:8px;font-weight:bold;text-align:right;color:#2563eb">${formatPrice(order.total)}</td></tr></tfoot>
        </table>
        <p><a href="${siteUrl}" style="color:#2563eb">${t.orderConfirmation.trackOrders}</a></p>
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | ${t.autoEmail}</p>
      </div>
    </div>`,
  };
}

// Kargoya Verildi Maili
export function shippingNotificationEmail(order: {
  orderNumber: string;
  trackingNumber: string;
  shippingCompany: string;
}, locale: EmailLocale = "tr") {
  const t = getEmailTranslations(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pixfora.com";
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";

  const companyNames: Record<string, string> = {
    yurtici: "Yurtici Kargo",
    aras: "Aras Kargo",
    mng: "MNG Kargo",
    ptt: "PTT Kargo",
    surat: "Surat Kargo",
  };

  const companyName = companyNames[order.shippingCompany] || order.shippingCompany;

  return {
    subject: `${siteName} - ${t.shippingNotification.subject(order.orderNumber)}`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="color:#16a34a;margin-top:0">${t.shippingNotification.title}</h2>
        <p>${t.orderNumberLabel} <strong>#${order.orderNumber}</strong></p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:4px 0"><strong>${t.shippingNotification.shippingCompanyLabel}</strong> ${companyName}</p>
          <p style="margin:4px 0"><strong>${t.shippingNotification.trackingNumberLabel}</strong> ${order.trackingNumber}</p>
        </div>
        <div style="text-align:center;margin:24px 0">
          <a href="${siteUrl}/siparis-takip" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">${t.shippingNotification.trackOrder}</a>
        </div>
        <p style="font-size:13px;color:#666">${t.shippingNotification.trackingHelp}</p>
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | ${t.autoEmail}</p>
      </div>
    </div>`,
  };
}

// Odeme Onay Maili (Havale/EFT)
export function paymentConfirmationEmail(order: {
  orderNumber: string;
  total: number;
}, locale: EmailLocale = "tr") {
  const t = getEmailTranslations(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pixfora.com";
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";
  const formatPrice = createPriceFormatter(locale);

  return {
    subject: `${siteName} - ${t.paymentConfirmation.subject(order.orderNumber)}`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="color:#16a34a;margin-top:0">${t.paymentConfirmation.title}</h2>
        <p>${t.orderNumberLabel} <strong>#${order.orderNumber}</strong></p>
        <p>${t.paymentConfirmation.totalAmount} <strong>${formatPrice(order.total)}</strong></p>
        <p>${t.paymentConfirmation.preparingOrder}</p>
        <p><a href="${siteUrl}" style="color:#2563eb">${t.paymentConfirmation.trackOrders}</a></p>
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | ${t.autoEmail}</p>
      </div>
    </div>`,
  };
}

// Siparis Durum Degisikligi Maili
export function orderStatusChangeEmail(order: {
  orderNumber: string;
  status: string;
  statusLabel: string;
  trackingNumber?: string | null;
  shippingCompany?: string | null;
}, locale: EmailLocale = "tr") {
  const t = getEmailTranslations(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pixfora.com";
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";

  const statusColors: Record<string, string> = {
    CONFIRMED: "#2563eb",
    PROCESSING: "#6366f1",
    SHIPPED: "#9333ea",
    DELIVERED: "#16a34a",
    CANCELLED: "#dc2626",
    REFUNDED: "#6b7280",
  };

  const statusIcons: Record<string, string> = {
    CONFIRMED: "&#9989;",
    PROCESSING: "&#9881;&#65039;",
    SHIPPED: "&#128666;",
    DELIVERED: "&#127881;",
    CANCELLED: "&#10060;",
    REFUNDED: "&#128176;",
  };

  const color = statusColors[order.status] || "#2563eb";
  const icon = statusIcons[order.status] || "";

  const companyNames: Record<string, string> = {
    yurtici: "Yurtici Kargo",
    aras: "Aras Kargo",
    mng: "MNG Kargo",
    ptt: "PTT Kargo",
    surat: "Surat Kargo",
  };

  let trackingHtml = "";
  if (order.status === "SHIPPED" && order.trackingNumber) {
    const companyName = companyNames[order.shippingCompany || ""] || order.shippingCompany || t.orderStatusChange.defaultCompanyName;
    trackingHtml = `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>${t.orderStatusChange.shippingCompanyLabel}</strong> ${companyName}</p>
        <p style="margin:4px 0"><strong>${t.orderStatusChange.trackingNumberLabel}</strong> ${order.trackingNumber}</p>
      </div>
      <div style="text-align:center;margin:24px 0">
        <a href="${siteUrl}/siparis-takip" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">${t.orderStatusChange.trackOrder}</a>
      </div>`;
  }

  return {
    subject: `${siteName} - ${t.orderStatusChange.subject(order.statusLabel, order.orderNumber)}`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <div style="text-align:center;margin-bottom:20px">
          <span style="font-size:48px">${icon}</span>
        </div>
        <h2 style="color:${color};margin-top:0;text-align:center">${t.orderStatusChange.statusTitle(order.statusLabel)}</h2>
        <p style="text-align:center">${t.orderNumberLabel} <strong>#${order.orderNumber}</strong></p>
        ${trackingHtml}
        <div style="text-align:center;margin:24px 0">
          <a href="${siteUrl}/hesabim/siparislerim" style="color:#2563eb;text-decoration:underline">${t.orderStatusChange.viewOrderDetails}</a>
        </div>
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | ${t.autoEmail}</p>
      </div>
    </div>`,
  };
}

// Havale Bilgileri Maili
export function bankTransferInfoEmail(order: {
  orderNumber: string;
  total: number;
  bankAccounts: { bankName: string; iban: string; accountHolder: string }[];
}, locale: EmailLocale = "tr") {
  const t = getEmailTranslations(locale);
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";
  const formatPrice = createPriceFormatter(locale);

  const banksHtml = order.bankAccounts
    .map((b) => `<div style="background:#f5f5f5;border-radius:8px;padding:12px;margin:8px 0"><p style="margin:2px 0;font-weight:bold">${b.bankName}</p><p style="margin:2px 0">IBAN: ${b.iban}</p><p style="margin:2px 0">${t.bankTransferInfo.accountHolder} ${b.accountHolder}</p></div>`)
    .join("");

  return {
    subject: `${siteName} - ${t.bankTransferInfo.subject(order.orderNumber)}`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="margin-top:0">${t.bankTransferInfo.title}</h2>
        <p>${t.orderNumberLabel} <strong>#${order.orderNumber}</strong></p>
        <p>${t.bankTransferInfo.amountToPay} <strong style="color:#2563eb">${formatPrice(order.total)}</strong></p>
        <p style="color:#dc2626;font-weight:bold">${t.bankTransferInfo.ibanReminder}</p>
        ${banksHtml}
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | ${t.autoEmail}</p>
      </div>
    </div>`,
  };
}

// Dusuk Stok Uyari Maili (Admin icin)
export function lowStockAlertEmail(products: {
  name: string;
  sku: string | null;
  stock: number;
  slug: string;
}[], locale: EmailLocale = "tr") {
  const t = getEmailTranslations(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pixfora.com";
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";

  const rowsHtml = products
    .map(
      (p) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${p.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${p.sku || "-"}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:${p.stock <= 0 ? "#dc2626" : "#f59e0b"};font-weight:bold">${p.stock}</td>
        </tr>`
    )
    .join("");

  return {
    subject: `${siteName} - ${t.lowStockAlert.subject(products.length)}`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#dc2626;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName} - ${t.lowStockAlert.headerTitle}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="color:#dc2626;margin-top:0">${t.lowStockAlert.title}</h2>
        <p>${t.lowStockAlert.description(products.length)}</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="background:#f5f5f5">
              <th style="padding:8px;text-align:left">${t.lowStockAlert.productCol}</th>
              <th style="padding:8px;text-align:center">${t.lowStockAlert.skuCol}</th>
              <th style="padding:8px;text-align:center">${t.lowStockAlert.stockCol}</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div style="text-align:center;margin:24px 0">
          <a href="${siteUrl}/admin/urunler" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">${t.lowStockAlert.manageProducts}</a>
        </div>
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | ${t.autoEmail}</p>
      </div>
    </div>`,
  };
}

// Terk Edilen Sepet Kurtarma Maili
export function stockBackInStockEmail(data: {
  name: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  productPrice: number;
}, locale: EmailLocale = "tr") {
  const t = getEmailTranslations(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pixfora.com";
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";
  const formatPrice = createPriceFormatter(locale);

  return {
    subject: `${siteName} - ${t.backInStock.subject(data.productName)}`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="margin-top:0">${t.hello(data.name)}</h2>
        <p>${t.backInStock.body}</p>
        <div style="margin:16px 0;padding:16px;border:1px solid #eee;border-radius:12px;display:flex;align-items:center;gap:16px">
          ${data.productImage ? `<img src="${data.productImage}" alt="" style="width:80px;height:80px;object-fit:cover;border-radius:8px" />` : `<div style="width:80px;height:80px;background:#f5f5f5;border-radius:8px"></div>`}
          <div>
            <p style="margin:0;font-weight:600;font-size:16px">${data.productName}</p>
            <p style="margin:8px 0 0;color:#2563eb;font-weight:bold;font-size:18px">${formatPrice(data.productPrice)}</p>
          </div>
        </div>
        <div style="text-align:center;margin:24px 0">
          <a href="${siteUrl}/urun/${data.productSlug}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">${t.backInStock.viewProduct}</a>
        </div>
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | ${t.autoEmail}</p>
      </div>
    </div>`,
  };
}

export function abandonedCartEmail(user: {
  name: string;
  items: { name: string; price: number; image: string | null }[];
}, locale: EmailLocale = "tr") {
  const t = getEmailTranslations(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pixfora.com";
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";
  const formatPrice = createPriceFormatter(locale);

  const itemsHtml = user.items
    .map(
      (item) =>
        `<div style="display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid #eee">
          ${item.image ? `<img src="${item.image}" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:8px" />` : `<div style="width:60px;height:60px;background:#f5f5f5;border-radius:8px"></div>`}
          <div>
            <p style="margin:0;font-weight:500">${item.name}</p>
            <p style="margin:4px 0 0;color:#2563eb;font-weight:bold">${formatPrice(item.price)}</p>
          </div>
        </div>`
    )
    .join("");

  return {
    subject: `${siteName} - ${t.abandonedCart.subject}`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="margin-top:0">${t.hello(user.name)}</h2>
        <p>${t.abandonedCart.body}</p>
        <div style="margin:16px 0">${itemsHtml}</div>
        <div style="text-align:center;margin:24px 0">
          <a href="${siteUrl}/sepet" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">${t.abandonedCart.goToCart}</a>
        </div>
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | ${t.autoEmail}</p>
      </div>
    </div>`,
  };
}

// ============================================================
// IADE E-POSTALARI
// ============================================================

// Iade Talebi Alindi
export function returnRequestEmail(data: {
  orderNumber: string;
  returnNumber: string;
  refundAmount: number;
  items: { name: string; quantity: number; price: number }[];
}, locale: EmailLocale = "tr") {
  const t = getEmailTranslations(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pixfora.com";
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";
  const formatPrice = createPriceFormatter(locale);

  const itemsHtml = data.items
    .map((i) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatPrice(i.price * i.quantity)}</td></tr>`)
    .join("");

  return {
    subject: `${siteName} - ${t.returnRequest.subject(data.returnNumber)}`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="color:#2563eb;margin-top:0">${t.returnRequest.title}</h2>
        <p>${t.returnRequest.returnNumberLabel} <strong>#${data.returnNumber}</strong></p>
        <p>${t.returnRequest.orderNumberLabel} <strong>#${data.orderNumber}</strong></p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">${t.returnRequest.productCol}</th><th style="padding:8px;text-align:center">${t.returnRequest.quantityCol}</th><th style="padding:8px;text-align:right">${t.returnRequest.amountCol}</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot><tr><td colspan="2" style="padding:8px;font-weight:bold;text-align:right">${t.returnRequest.refundAmountLabel}</td><td style="padding:8px;font-weight:bold;text-align:right;color:#2563eb">${formatPrice(data.refundAmount)}</td></tr></tfoot>
        </table>
        <p>${t.returnRequest.pendingReview}</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${siteUrl}/hesabim/iadelerim" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">${t.returnRequest.trackReturns}</a>
        </div>
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | ${t.autoEmail}</p>
      </div>
    </div>`,
  };
}

// Iade Onaylandi
export function returnApprovedEmail(data: {
  orderNumber: string;
  returnNumber: string;
  adminNote?: string | null;
}, locale: EmailLocale = "tr") {
  const t = getEmailTranslations(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pixfora.com";
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";

  return {
    subject: `${siteName} - ${t.returnApproved.subject(data.returnNumber)}`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="color:#16a34a;margin-top:0;text-align:center">${t.returnApproved.title}</h2>
        <p>${t.returnApproved.returnNumberLabel} <strong>#${data.returnNumber}</strong></p>
        <p>${t.returnApproved.orderNumberLabel} <strong>#${data.orderNumber}</strong></p>
        ${data.adminNote ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0"><p style="margin:0"><strong>${t.returnApproved.storeNote}</strong> ${data.adminNote}</p></div>` : ""}
        <p>${t.returnApproved.instructions}</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${siteUrl}/hesabim/iadelerim" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">${t.returnApproved.returnDetails}</a>
        </div>
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | ${t.autoEmail}</p>
      </div>
    </div>`,
  };
}

// Iade Reddedildi
export function returnRejectedEmail(data: {
  orderNumber: string;
  returnNumber: string;
  reason: string;
}, locale: EmailLocale = "tr") {
  const t = getEmailTranslations(locale);
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pixfora.com";

  return {
    subject: `${siteName} - ${t.returnRejected.subject(data.returnNumber)}`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="color:#dc2626;margin-top:0;text-align:center">${t.returnRejected.title}</h2>
        <p>${t.returnRejected.returnNumberLabel} <strong>#${data.returnNumber}</strong></p>
        <p>${t.returnRejected.orderNumberLabel} <strong>#${data.orderNumber}</strong></p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0"><strong>${t.returnRejected.rejectionReason}</strong> ${data.reason}</p>
        </div>
        <p>${t.returnRejected.contactUs}</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${siteUrl}/iletisim" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">${t.returnRejected.contactButton}</a>
        </div>
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | ${t.autoEmail}</p>
      </div>
    </div>`,
  };
}

// Iade Tamamlandi (Para Iade Edildi)
export function returnRefundedEmail(data: {
  orderNumber: string;
  returnNumber: string;
  amount: number;
}, locale: EmailLocale = "tr") {
  const t = getEmailTranslations(locale);
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pixfora.com";
  const formatPrice = createPriceFormatter(locale);

  return {
    subject: `${siteName} - ${t.returnRefunded.subject(data.returnNumber)}`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="color:#16a34a;margin-top:0;text-align:center">${t.returnRefunded.title}</h2>
        <p>${t.returnRefunded.returnNumberLabel} <strong>#${data.returnNumber}</strong></p>
        <p>${t.returnRefunded.orderNumberLabel} <strong>#${data.orderNumber}</strong></p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;text-align:center">
          <p style="margin:0;font-size:13px;color:#666">${t.returnRefunded.refundAmountLabel}</p>
          <p style="margin:8px 0 0;font-size:24px;font-weight:bold;color:#16a34a">${formatPrice(data.amount)}</p>
        </div>
        <p>${t.returnRefunded.refundNotice}</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${siteUrl}/hesabim/iadelerim" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">${t.returnRefunded.returnDetails}</a>
        </div>
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | ${t.autoEmail}</p>
      </div>
    </div>`,
  };
}

// Teslimat onay e-postasi
export function deliveryConfirmationEmail(data: {
  orderNumber: string;
  deliveryDate: string;
}, locale: EmailLocale = "tr") {
  const t = getEmailTranslations(locale);
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pixfora.com";

  return {
    subject: `${siteName} - ${t.deliveryConfirmation.subject(data.orderNumber)}`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="color:#16a34a;margin-top:0;text-align:center">${t.deliveryConfirmation.title}</h2>
        <p>${t.orderNumberLabel} <strong>#${data.orderNumber}</strong></p>
        <p>${t.deliveryConfirmation.deliveryDateLabel} <strong>${data.deliveryDate}</strong></p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;text-align:center">
          <p style="margin:0;font-size:16px;color:#16a34a;font-weight:bold">${t.deliveryConfirmation.deliverySuccess}</p>
        </div>
        <p>${t.deliveryConfirmation.reviewPrompt}</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${siteUrl}/hesabim/siparislerim" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">${t.deliveryConfirmation.viewOrders}</a>
        </div>
        <p style="color:#888;font-size:13px">${t.deliveryConfirmation.returnNotice}</p>
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | ${t.autoEmail}</p>
      </div>
    </div>`,
  };
}

// ============================================================
// ONERI E-POSTASI
// ============================================================
export function recommendationEmail(data: {
  userName: string;
  products: {
    name: string;
    price: number;
    image: string | null;
    slug: string;
  }[];
}, locale: EmailLocale = "tr") {
  const t = getEmailTranslations(locale);
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pixfora.com";
  const formatPrice = createPriceFormatter(locale);

  const productCards = data.products
    .map(
      (p) => `
      <td style="width:50%;padding:8px;vertical-align:top">
        <a href="${siteUrl}/urun/${p.slug}" style="text-decoration:none;color:#333;display:block;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
          ${
            p.image
              ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:160px;object-fit:cover" />`
              : `<div style="width:100%;height:160px;background:#f3f4f6"></div>`
          }
          <div style="padding:12px">
            <p style="margin:0;font-size:13px;font-weight:600;line-height:1.3">${p.name}</p>
            <p style="margin:8px 0 0;font-size:15px;font-weight:bold;color:#2563eb">${formatPrice(p.price)}</p>
          </div>
        </a>
      </td>`
    )
    .reduce((rows: string[], card, i) => {
      if (i % 2 === 0) rows.push(`<tr>${card}`);
      else rows[rows.length - 1] += `${card}</tr>`;
      if (i === data.products.length - 1 && i % 2 === 0) rows[rows.length - 1] += `<td style="width:50%;padding:8px"></td></tr>`;
      return rows;
    }, [])
    .join("");

  return {
    subject: `${siteName} - ${t.recommendation.subject}`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="margin-top:0;text-align:center;color:#1f2937">${t.recommendation.title}</h2>
        <p>${t.hello()} <strong>${data.userName}</strong>,</p>
        <p>${t.recommendation.body}</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          ${productCards}
        </table>
        <div style="text-align:center;margin:24px 0">
          <a href="${siteUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">${t.recommendation.discoverAll}</a>
        </div>
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | ${t.autoEmail}</p>
      </div>
    </div>`,
  };
}

// Newsletter Onay Maili
export function newsletterConfirmationEmail(email: string, token: string, locale: EmailLocale = "tr") {
  const t = getEmailTranslations(locale);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pixfora.com";
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";

  return {
    subject: `${siteName} - ${t.newsletterConfirmation.subject}`,
    html: `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#fff;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="margin:0;color:#fff;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:32px 24px">
        <h2 style="margin-top:0;color:#1f2937;text-align:center">${t.newsletterConfirmation.title}</h2>
        <p style="color:#4b5563;font-size:14px;line-height:1.6">
          ${t.hello()}<br/><br/>
          ${siteName} ${t.newsletterConfirmation.body}
        </p>
        <div style="text-align:center;margin:32px 0">
          <a href="${siteUrl}/bulten/onayla?token=${token}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">
            ${t.newsletterConfirmation.confirmButton}
          </a>
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center">
          ${t.newsletterConfirmation.ignoreNotice}
        </p>
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | <a href="${siteUrl}/bulten/abonelikten-cik?email=${encodeURIComponent(email)}" style="color:#888">${t.newsletterConfirmation.unsubscribe}</a></p>
      </div>
    </div>`,
  };
}
