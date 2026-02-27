/**
 * Input doğrulama ve sanitizasyon fonksiyonları.
 * Tüm public API endpoint'lerinde kullanılır.
 */

// HTML tag'larını temizle
export function sanitizeString(input: string): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>/g, "") // HTML tag'ları kaldır
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

// Email format doğrulama
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { valid: false, error: "Email adresi zorunludur." };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: "Gecerli bir email adresi girin." };
  }
  if (email.length > 254) {
    return { valid: false, error: "Email adresi cok uzun." };
  }
  return { valid: true };
}

// Şifre doğrulama
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: "Sifre zorunludur." };
  }
  if (password.length < 8) {
    return { valid: false, error: "Sifre en az 8 karakter olmalidir." };
  }
  if (password.length > 128) {
    return { valid: false, error: "Sifre en fazla 128 karakter olabilir." };
  }
  return { valid: true };
}

// Telefon format kontrolü (TR)
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || !phone.trim()) {
    return { valid: true }; // Opsiyonel alan
  }
  // Sadece rakam, boşluk, +, - ve parantez
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (!/^\+?\d{10,13}$/.test(cleaned)) {
    return { valid: false, error: "Gecerli bir telefon numarasi girin." };
  }
  return { valid: true };
}

// Pozitif sayı doğrulama
export function validatePositiveNumber(
  value: unknown,
  fieldName: string
): { valid: boolean; parsed: number; error?: string } {
  const num = Number(value);
  if (value === undefined || value === null || value === "") {
    return { valid: false, parsed: 0, error: `${fieldName} zorunludur.` };
  }
  if (isNaN(num)) {
    return { valid: false, parsed: 0, error: `${fieldName} gecerli bir sayi olmalidir.` };
  }
  if (num < 0) {
    return { valid: false, parsed: 0, error: `${fieldName} negatif olamaz.` };
  }
  return { valid: true, parsed: num };
}

// Arama sorgusu temizleme
export function sanitizeSearchQuery(query: string): string {
  if (!query) return "";
  return query
    .replace(/<[^>]*>/g, "") // HTML tag
    .replace(/[{}$]/g, "") // NoSQL injection kalıpları
    .replace(/['";\\]/g, "") // SQL injection kalıpları
    .trim()
    .substring(0, 200); // Max 200 karakter
}

// UUID format doğrulama
export function isValidUUID(id: string): boolean {
  if (!id) return false;
  // cuid veya uuid formatları
  return /^[a-zA-Z0-9_-]{20,36}$/.test(id);
}

// İsim doğrulama
export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || !name.trim()) {
    return { valid: false, error: "Ad zorunludur." };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: "Ad en az 2 karakter olmalidir." };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: "Ad en fazla 100 karakter olabilir." };
  }
  return { valid: true };
}

// String uzunluk doğrulama
export function validateLength(
  value: string,
  fieldName: string,
  min: number,
  max: number
): { valid: boolean; error?: string } {
  if (!value || !value.trim()) {
    if (min > 0) return { valid: false, error: `${fieldName} zorunludur.` };
    return { valid: true };
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    return { valid: false, error: `${fieldName} en az ${min} karakter olmalidir.` };
  }
  if (trimmed.length > max) {
    return { valid: false, error: `${fieldName} en fazla ${max} karakter olabilir.` };
  }
  return { valid: true };
}
