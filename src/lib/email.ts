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
        <div style="text-align:center;margin:24px 0">
          <a href="${siteUrl}/siparis-takip" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">Siparisimi Takip Et</a>
        </div>
        <p style="font-size:13px;color:#666">Siparis takip sayfasinda siparis numaranizi ve e-posta adresinizi girerek kargo durumunuzu ogrenebilirsiniz.</p>
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

// Siparis Durum Degisikligi Maili
export function orderStatusChangeEmail(order: {
  orderNumber: string;
  status: string;
  statusLabel: string;
  trackingNumber?: string | null;
  shippingCompany?: string | null;
}) {
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
    const companyName = companyNames[order.shippingCompany || ""] || order.shippingCompany || "Kargo";
    trackingHtml = `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>Kargo Firmasi:</strong> ${companyName}</p>
        <p style="margin:4px 0"><strong>Takip Numarasi:</strong> ${order.trackingNumber}</p>
      </div>
      <div style="text-align:center;margin:24px 0">
        <a href="${siteUrl}/siparis-takip" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">Siparisimi Takip Et</a>
      </div>`;
  }

  return {
    subject: `${siteName} - Siparis Durumu: ${order.statusLabel} (#${order.orderNumber})`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <div style="text-align:center;margin-bottom:20px">
          <span style="font-size:48px">${icon}</span>
        </div>
        <h2 style="color:${color};margin-top:0;text-align:center">Siparis Durumu: ${order.statusLabel}</h2>
        <p style="text-align:center">Siparis numaraniz: <strong>#${order.orderNumber}</strong></p>
        ${trackingHtml}
        <div style="text-align:center;margin:24px 0">
          <a href="${siteUrl}/hesabim/siparislerim" style="color:#2563eb;text-decoration:underline">Siparis detaylarini goruntuleyiniz</a>
        </div>
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

// Dusuk Stok Uyari Maili (Admin icin)
export function lowStockAlertEmail(products: {
  name: string;
  sku: string | null;
  stock: number;
  slug: string;
}[]) {
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
    subject: `${siteName} - Dusuk Stok Uyarisi (${products.length} urun)`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#dc2626;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName} - Stok Uyarisi</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="color:#dc2626;margin-top:0">Dusuk Stoklu Urunler</h2>
        <p>Asagidaki <strong>${products.length}</strong> urunun stogu kritik seviyenin altina dustu:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="background:#f5f5f5">
              <th style="padding:8px;text-align:left">Urun</th>
              <th style="padding:8px;text-align:center">SKU</th>
              <th style="padding:8px;text-align:center">Stok</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div style="text-align:center;margin:24px 0">
          <a href="${siteUrl}/admin/urunler" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">Urunleri Yonet</a>
        </div>
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | Bu e-posta otomatik olarak gonderilmistir.</p>
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
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pixfora.com";
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";
  const formatPrice = (p: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p);

  return {
    subject: `${siteName} - ${data.productName} tekrar stokta!`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="margin-top:0">Merhaba${data.name ? ` ${data.name}` : ""},</h2>
        <p>Takip ettiginiz urun tekrar stokta! Hemen satin alabilirsiniz:</p>
        <div style="margin:16px 0;padding:16px;border:1px solid #eee;border-radius:12px;display:flex;align-items:center;gap:16px">
          ${data.productImage ? `<img src="${data.productImage}" alt="" style="width:80px;height:80px;object-fit:cover;border-radius:8px" />` : `<div style="width:80px;height:80px;background:#f5f5f5;border-radius:8px"></div>`}
          <div>
            <p style="margin:0;font-weight:600;font-size:16px">${data.productName}</p>
            <p style="margin:8px 0 0;color:#2563eb;font-weight:bold;font-size:18px">${formatPrice(data.productPrice)}</p>
          </div>
        </div>
        <div style="text-align:center;margin:24px 0">
          <a href="${siteUrl}/urun/${data.productSlug}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Urunu Incele</a>
        </div>
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | Bu e-posta otomatik olarak gonderilmistir.</p>
      </div>
    </div>`,
  };
}

export function abandonedCartEmail(user: {
  name: string;
  items: { name: string; price: number; image: string | null }[];
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pixfora.com";
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";
  const formatPrice = (p: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p);

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
    subject: `${siteName} - Sepetinizde urunler bekliyor!`,
    html: `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="background:#2563eb;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">${siteName}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="margin-top:0">Merhaba${user.name ? ` ${user.name}` : ""},</h2>
        <p>Sepetinizde bekleyen urunler var! Hemen siparisinizi tamamlayin:</p>
        <div style="margin:16px 0">${itemsHtml}</div>
        <div style="text-align:center;margin:24px 0">
          <a href="${siteUrl}/sepet" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">Sepetime Git</a>
        </div>
      </div>
      <div style="padding:16px;background:#f5f5f5;text-align:center;font-size:12px;color:#888">
        <p>${siteName} | Bu e-posta otomatik olarak gonderilmistir.</p>
      </div>
    </div>`,
  };
}
