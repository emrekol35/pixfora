import PDFDocument from "pdfkit";

interface InvoiceData {
  invoiceNo: string;
  date: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
  company?: {
    name: string;
    taxOffice: string;
    taxNumber: string;
  };
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PX-${year}${month}-${random}`;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Pixfora";
    const formatPrice = (p: number) =>
      new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(p);

    // Header
    doc.fontSize(20).font("Helvetica-Bold").text(siteName, 50, 50);
    doc.fontSize(10).font("Helvetica").text("www.pixfora.com", 50, 75);

    // Fatura Bilgileri
    doc.fontSize(16).font("Helvetica-Bold").text(data.company ? "E-FATURA" : "E-ARSIV FATURA", 350, 50, { align: "right" });
    doc.fontSize(10).font("Helvetica");
    doc.text(`Fatura No: ${data.invoiceNo}`, 350, 75, { align: "right" });
    doc.text(`Tarih: ${data.date}`, 350, 90, { align: "right" });
    doc.text(`Siparis No: ${data.orderNumber}`, 350, 105, { align: "right" });

    // Cizgi
    doc.moveTo(50, 130).lineTo(545, 130).stroke();

    // Musteri Bilgileri
    let y = 145;
    doc.fontSize(11).font("Helvetica-Bold").text("Musteri Bilgileri", 50, y);
    y += 18;
    doc.fontSize(9).font("Helvetica");
    doc.text(`Ad Soyad: ${data.customer.name}`, 50, y); y += 14;
    doc.text(`E-posta: ${data.customer.email}`, 50, y); y += 14;
    doc.text(`Telefon: ${data.customer.phone}`, 50, y); y += 14;
    doc.text(`Adres: ${data.customer.address}, ${data.customer.city}`, 50, y); y += 14;

    if (data.company) {
      y += 5;
      doc.fontSize(11).font("Helvetica-Bold").text("Firma Bilgileri", 50, y); y += 18;
      doc.fontSize(9).font("Helvetica");
      doc.text(`Firma: ${data.company.name}`, 50, y); y += 14;
      doc.text(`Vergi Dairesi: ${data.company.taxOffice}`, 50, y); y += 14;
      doc.text(`Vergi No: ${data.company.taxNumber}`, 50, y); y += 14;
    }

    // Tablo Basligi
    y += 20;
    doc.rect(50, y, 495, 22).fill("#2563eb");
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#fff");
    doc.text("Urun", 55, y + 6, { width: 230 });
    doc.text("Adet", 290, y + 6, { width: 60, align: "center" });
    doc.text("Birim Fiyat", 355, y + 6, { width: 80, align: "right" });
    doc.text("Toplam", 440, y + 6, { width: 100, align: "right" });
    doc.fillColor("#333");

    // Tablo Satirlari
    y += 22;
    doc.font("Helvetica").fontSize(9);
    for (const item of data.items) {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      const bgColor = data.items.indexOf(item) % 2 === 0 ? "#f9f9f9" : "#fff";
      doc.rect(50, y, 495, 20).fill(bgColor);
      doc.fillColor("#333");
      doc.text(item.name, 55, y + 5, { width: 230 });
      doc.text(String(item.quantity), 290, y + 5, { width: 60, align: "center" });
      doc.text(formatPrice(item.unitPrice), 355, y + 5, { width: 80, align: "right" });
      doc.text(formatPrice(item.total), 440, y + 5, { width: 100, align: "right" });
      y += 20;
    }

    // Toplamlar
    y += 10;
    doc.moveTo(350, y).lineTo(545, y).stroke();
    y += 8;
    doc.fontSize(9).font("Helvetica");
    doc.text("Ara Toplam:", 355, y, { width: 80, align: "right" });
    doc.text(formatPrice(data.subtotal), 440, y, { width: 100, align: "right" });
    y += 16;

    if (data.shippingCost > 0) {
      doc.text("Kargo:", 355, y, { width: 80, align: "right" });
      doc.text(formatPrice(data.shippingCost), 440, y, { width: 100, align: "right" });
      y += 16;
    }

    if (data.discount > 0) {
      doc.text("Indirim:", 355, y, { width: 80, align: "right" });
      doc.text(`-${formatPrice(data.discount)}`, 440, y, { width: 100, align: "right" });
      y += 16;
    }

    doc.moveTo(350, y).lineTo(545, y).stroke();
    y += 8;
    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("TOPLAM:", 355, y, { width: 80, align: "right" });
    doc.fillColor("#2563eb").text(formatPrice(data.total), 440, y, { width: 100, align: "right" });

    // Footer
    doc.fillColor("#888").fontSize(8).font("Helvetica");
    doc.text(`${siteName} - Bu fatura elektronik ortamda olusturulmustur.`, 50, 770, { align: "center" });

    doc.end();
  });
}
