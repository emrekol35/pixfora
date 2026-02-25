import nodemailer from "nodemailer";

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

// Siparis Onay Maili
export function orderConfirmationEmail(order: {
  orderNumber: string;
  total: number;
  items: { name: string; quantity: number; price: number }[];
  paymentMethod: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pixfora.com";
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";
  const formatPrice = (p: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p);

  const paymentLabel =
    order.paymentMethod === "CREDIT_CARD" ? "Kredi Karti" :
    order.paymentMethod === "BANK_TRANSFER" ? "Havale / EFT" :
    "Kapida Odeme";

  const itemsHtml = order.items
    .map((i) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatPrice(i.price * i.quantity)}</td></tr>`)
    .join("");

  return {
    subject: `${siteName} - Siparisiniz Alindi (#${order.orderNumber})`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="color:#2563eb;margin-top:0">Siparisiniz Alindi!</h2>
        <p>Siparis numaraniz: <strong>#${order.orderNumber}</strong></p>
        <p>Odeme Yontemi: <strong>${paymentLabel}</strong></p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Urun</th><th style="padding:8px;text-align:center">Adet</th><th style="padding:8px;text-align:right">Tutar</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot><tr><td colspan="2" style="padding:8px;font-weight:bold;text-align:right">Toplam:</td><td style="padding:8px;font-weight:bold;text-align:right;color:#2563eb">${formatPrice(order.total)}</td></tr></tfoot>
        </table>
        <p><a href="${siteUrl}" style="color:#2563eb">Siparislerinizi takip etmek icin tiklayiniz</a></p>
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | Bu e-posta otomatik olarak gonderilmistir.</p>
      </div>
    </div>`,
  };
}

// Kargoya Verildi Maili
export function shippingNotificationEmail(order: {
  orderNumber: string;
  trackingNumber: string;
  shippingCompany: string;
}) {
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
    subject: `${siteName} - Siparisiniz Kargoya Verildi (#${order.orderNumber})`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="color:#16a34a;margin-top:0">Siparisiniz Kargoya Verildi!</h2>
        <p>Siparis numaraniz: <strong>#${order.orderNumber}</strong></p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:4px 0"><strong>Kargo Firmasi:</strong> ${companyName}</p>
          <p style="margin:4px 0"><strong>Takip Numarasi:</strong> ${order.trackingNumber}</p>
        </div>
        <p><a href="${siteUrl}" style="color:#2563eb">Siparislerinizi takip etmek icin tiklayiniz</a></p>
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | Bu e-posta otomatik olarak gonderilmistir.</p>
      </div>
    </div>`,
  };
}

// Odeme Onay Maili (Havale/EFT)
export function paymentConfirmationEmail(order: {
  orderNumber: string;
  total: number;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pixfora.com";
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";
  const formatPrice = (p: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p);

  return {
    subject: `${siteName} - Odemeniz Onaylandi (#${order.orderNumber})`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="color:#16a34a;margin-top:0">Odemeniz Onaylandi!</h2>
        <p>Siparis numaraniz: <strong>#${order.orderNumber}</strong></p>
        <p>Toplam tutar: <strong>${formatPrice(order.total)}</strong></p>
        <p>Siparisiniz hazirlama asamasina alindi.</p>
        <p><a href="${siteUrl}" style="color:#2563eb">Siparislerinizi takip etmek icin tiklayiniz</a></p>
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | Bu e-posta otomatik olarak gonderilmistir.</p>
      </div>
    </div>`,
  };
}

// Havale Bilgileri Maili
export function bankTransferInfoEmail(order: {
  orderNumber: string;
  total: number;
  bankAccounts: { bankName: string; iban: string; accountHolder: string }[];
}) {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";
  const formatPrice = (p: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p);

  const banksHtml = order.bankAccounts
    .map((b) => `<div style="background:#f5f5f5;border-radius:8px;padding:12px;margin:8px 0"><p style="margin:2px 0;font-weight:bold">${b.bankName}</p><p style="margin:2px 0">IBAN: ${b.iban}</p><p style="margin:2px 0">Hesap Sahibi: ${b.accountHolder}</p></div>`)
    .join("");

  return {
    subject: `${siteName} - Havale Bilgileri (#${order.orderNumber})`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="margin-top:0">Havale/EFT Bilgileri</h2>
        <p>Siparis numaraniz: <strong>#${order.orderNumber}</strong></p>
        <p>Odenecek tutar: <strong style="color:#2563eb">${formatPrice(order.total)}</strong></p>
        <p style="color:#dc2626;font-weight:bold">Aciklama kisimna siparis numaranizi yazmayi unutmayiniz!</p>
        ${banksHtml}
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | Bu e-posta otomatik olarak gonderilmistir.</p>
      </div>
    </div>`,
  };
}
