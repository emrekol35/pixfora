/**
 * CSV yardimci fonksiyonlari
 * Turkce Excel uyumlu: BOM + noktali virgul (;) ayirici
 */

export function parseCsvLine(line: string, separator = ";"): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

export function parseCsv(
  content: string,
  separator = ";"
): { headers: string[]; rows: string[][] } {
  // BOM kaldir
  const clean = content.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0], separator);
  const rows = lines.slice(1).map((line) => parseCsvLine(line, separator));

  return { headers, rows };
}

// CSV sablon header'lari (Turkce)
export const PRODUCT_CSV_HEADERS = [
  "Urun Adi",
  "SKU",
  "Barkod",
  "Fiyat",
  "Karsilastirma Fiyati",
  "Maliyet Fiyati",
  "Stok",
  "Kategori",
  "Marka",
  "Aktif",
  "One Cikan",
  "Kisa Aciklama",
  "Aciklama",
  "Etiketler",
  "SEO Baslik",
  "SEO Aciklama",
];

// Header -> alan adi eslestirmesi
export const HEADER_FIELD_MAP: Record<string, string> = {
  "urun adi": "name",
  "sku": "sku",
  "barkod": "barcode",
  "fiyat": "price",
  "karsilastirma fiyati": "comparePrice",
  "maliyet fiyati": "costPrice",
  "stok": "stock",
  "kategori": "categoryName",
  "marka": "brandName",
  "aktif": "isActive",
  "one cikan": "isFeatured",
  "kisa aciklama": "shortDesc",
  "aciklama": "description",
  "etiketler": "tags",
  "seo baslik": "seoTitle",
  "seo aciklama": "seoDescription",
};

export function generateTemplate(): string {
  const BOM = "\uFEFF";
  return BOM + PRODUCT_CSV_HEADERS.join(";");
}

export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapRowToProduct(row: string[], headers: string[]): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product: Record<string, any> = {};

  headers.forEach((header, index) => {
    const fieldName = HEADER_FIELD_MAP[header.toLowerCase().trim()];
    if (fieldName && index < row.length) {
      const value = row[index];

      if (fieldName === "price" || fieldName === "comparePrice" || fieldName === "costPrice") {
        // Turkce virgulu noktaya cevir
        product[fieldName] = value ? parseFloat(value.replace(",", ".")) : undefined;
      } else if (fieldName === "stock") {
        product[fieldName] = value ? parseInt(value) : 0;
      } else if (fieldName === "isActive") {
        product[fieldName] = value.toLowerCase() !== "hayir" && value !== "0" && value !== "false";
      } else if (fieldName === "isFeatured") {
        product[fieldName] = value.toLowerCase() === "evet" || value === "1" || value === "true";
      } else {
        product[fieldName] = value || undefined;
      }
    }
  });

  return product;
}
