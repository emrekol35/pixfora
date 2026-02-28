"use client";

import { useState } from "react";

interface Props {
  initialSettings: Record<string, string>;
}

interface SettingField {
  key: string;
  label: string;
  type: string;
  placeholder?: string;
}

interface SettingGroup {
  key: string;
  title: string;
  fields: SettingField[];
}

const SETTING_GROUPS: SettingGroup[] = [
  {
    key: "general",
    title: "Genel Ayarlar",
    fields: [
      { key: "site_name", label: "Site Adi", type: "text", placeholder: "Pixfora" },
      { key: "site_logo", label: "Logo URL", type: "text", placeholder: "/uploads/logo.png" },
      { key: "site_phone", label: "Telefon", type: "text", placeholder: "+90 555 000 0000" },
      { key: "site_email", label: "E-posta", type: "email", placeholder: "info@pixfora.com" },
      { key: "site_address", label: "Adres", type: "textarea", placeholder: "Istanbul, Turkiye" },
      { key: "site_description", label: "Site Aciklamasi", type: "textarea", placeholder: "E-ticaret sitesi" },
    ],
  },
  {
    key: "payment",
    title: "Odeme Ayarlari",
    fields: [
      { key: "credit_card_enabled", label: "Kredi Karti ile Odeme", type: "checkbox" },
      { key: "bank_transfer_enabled", label: "Havale/EFT ile Odeme", type: "checkbox" },
      { key: "cash_on_delivery_enabled", label: "Kapida Odeme", type: "checkbox" },
    ],
  },
  {
    key: "bank_accounts",
    title: "Banka Hesap Bilgileri",
    fields: [
      { key: "bank_account_1_name", label: "1. Banka Adi", type: "text", placeholder: "Ziraat Bankasi" },
      { key: "bank_account_1_holder", label: "1. Hesap Sahibi", type: "text", placeholder: "Pixfora Ticaret A.S." },
      { key: "bank_account_1_iban", label: "1. IBAN", type: "text", placeholder: "TR00 0000 0000 0000 0000 0000 00" },
      { key: "bank_account_2_name", label: "2. Banka Adi", type: "text", placeholder: "Is Bankasi" },
      { key: "bank_account_2_holder", label: "2. Hesap Sahibi", type: "text", placeholder: "Pixfora Ticaret A.S." },
      { key: "bank_account_2_iban", label: "2. IBAN", type: "text", placeholder: "TR00 0000 0000 0000 0000 0000 00" },
      { key: "bank_account_3_name", label: "3. Banka Adi", type: "text", placeholder: "Garanti BBVA" },
      { key: "bank_account_3_holder", label: "3. Hesap Sahibi", type: "text", placeholder: "Pixfora Ticaret A.S." },
      { key: "bank_account_3_iban", label: "3. IBAN", type: "text", placeholder: "TR00 0000 0000 0000 0000 0000 00" },
    ],
  },
  {
    key: "shipping",
    title: "Kargo Ayarlari",
    fields: [
      { key: "free_shipping_threshold", label: "Ucretsiz Kargo Limiti (TL)", type: "number", placeholder: "500" },
      { key: "default_shipping_company", label: "Varsayilan Kargo Firmasi", type: "text", placeholder: "yurtici" },
      { key: "flat_shipping_rate", label: "Sabit Kargo Ucreti (TL)", type: "number", placeholder: "39.90" },
      { key: "shipping_sender_name", label: "Gonderici Adi", type: "text", placeholder: "Pixfora" },
      { key: "shipping_sender_phone", label: "Gonderici Telefon", type: "text", placeholder: "05001234567" },
      { key: "shipping_sender_city", label: "Gonderici Sehir", type: "text", placeholder: "Istanbul" },
      { key: "shipping_sender_district", label: "Gonderici Ilce", type: "text", placeholder: "Kadikoy" },
      { key: "shipping_sender_address", label: "Gonderici Adres", type: "textarea", placeholder: "Depo adresi..." },
      { key: "shipping_auto_tracking_enabled", label: "Otomatik Kargo Takibi", type: "checkbox" },
    ],
  },
  {
    key: "shipping_carriers",
    title: "Kargo Firma Ayarlari",
    fields: [
      { key: "shipping_yurtici_enabled", label: "Yurtici Kargo Aktif", type: "checkbox" },
      { key: "shipping_yurtici_username", label: "Yurtici Kullanici Adi", type: "text", placeholder: "" },
      { key: "shipping_yurtici_password", label: "Yurtici Sifre", type: "password", placeholder: "" },
      { key: "shipping_yurtici_customer_code", label: "Yurtici Musteri Kodu", type: "text", placeholder: "" },
      { key: "shipping_aras_enabled", label: "Aras Kargo Aktif", type: "checkbox" },
      { key: "shipping_aras_username", label: "Aras Kullanici Adi", type: "text", placeholder: "" },
      { key: "shipping_aras_password", label: "Aras Sifre", type: "password", placeholder: "" },
      { key: "shipping_aras_customer_code", label: "Aras Musteri Kodu", type: "text", placeholder: "" },
      { key: "shipping_mng_enabled", label: "MNG Kargo Aktif", type: "checkbox" },
      { key: "shipping_mng_customer_number", label: "MNG Musteri No", type: "text", placeholder: "" },
      { key: "shipping_mng_password", label: "MNG Sifre", type: "password", placeholder: "" },
    ],
  },
  {
    key: "stock_alerts",
    title: "Stok Uyarilari",
    fields: [
      { key: "stock_alert_enabled", label: "Stok Uyarilarini Etkinlestir", type: "checkbox" },
      { key: "stock_alert_threshold", label: "Stok Uyari Esigi (adet)", type: "number", placeholder: "5" },
      { key: "stock_alert_email", label: "Uyari E-posta Adresi", type: "email", placeholder: "admin@pixfora.com" },
    ],
  },
  {
    key: "email",
    title: "E-posta Ayarlari",
    fields: [
      { key: "smtp_host", label: "SMTP Sunucu", type: "text", placeholder: "smtp.gmail.com" },
      { key: "smtp_port", label: "SMTP Port", type: "number", placeholder: "587" },
      { key: "smtp_user", label: "SMTP Kullanici Adi", type: "text", placeholder: "info@pixfora.com" },
      { key: "smtp_password", label: "SMTP Sifre", type: "password", placeholder: "••••••••" },
      { key: "sender_email", label: "Gonderici E-posta", type: "email", placeholder: "noreply@pixfora.com" },
      { key: "sender_name", label: "Gonderici Adi", type: "text", placeholder: "Pixfora" },
    ],
  },
];

export default function SettingsForm({ initialSettings }: Props) {
  const [settings, setSettings] = useState<Record<string, string>>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mngStatus, setMngStatus] = useState<{ connected: boolean; message: string } | null>(null);
  const [mngTesting, setMngTesting] = useState(false);

  function getValue(key: string): string {
    return settings[key] || "";
  }

  function setValue(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function isChecked(key: string): boolean {
    return settings[key] === "true" || settings[key] === "1";
  }

  async function testMngConnection() {
    setMngTesting(true);
    setMngStatus(null);

    try {
      const customerNumber = getValue("shipping_mng_customer_number");
      const password = getValue("shipping_mng_password");

      if (!customerNumber || !password) {
        setMngStatus({ connected: false, message: "Musteri No ve Sifre alanlari bos olamaz." });
        return;
      }

      const res = await fetch("/api/settings/test-mng", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ customerNumber, password }),
      });

      const data = await res.json();
      setMngStatus({ connected: data.connected, message: data.message });
    } catch {
      setMngStatus({ connected: false, message: "Baglanti testi sirasinda bir hata olustu." });
    } finally {
      setMngTesting(false);
    }
  }

  async function handleSave() {
    setLoading(true);
    setSaved(false);

    try {
      const allSettings = SETTING_GROUPS.flatMap((group) =>
        group.fields.map((field) => ({
          key: field.key,
          value: field.type === "checkbox" ? (isChecked(field.key) ? "true" : "false") : getValue(field.key),
          group: group.key,
        }))
      );

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ settings: allSettings }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || "Kaydetme basarisiz.");
      }
    } catch {
      alert("Bir hata olustu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {SETTING_GROUPS.map((group) => (
        <div key={group.key} className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">{group.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.fields.map((field) => (
              <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                {field.type === "checkbox" ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={field.key}
                      checked={isChecked(field.key)}
                      onChange={(e) => setValue(field.key, e.target.checked ? "true" : "false")}
                      className="w-4 h-4"
                    />
                    <label htmlFor={field.key} className="text-sm">{field.label}</label>
                  </div>
                ) : field.type === "textarea" ? (
                  <>
                    <label className="block text-sm font-medium mb-1">{field.label}</label>
                    <textarea
                      value={getValue(field.key)}
                      onChange={(e) => setValue(field.key, e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder={field.placeholder}
                      rows={3}
                    />
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-medium mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      value={getValue(field.key)}
                      onChange={(e) => setValue(field.key, e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder={field.placeholder}
                    />
                  </>
                )}
              </div>
            ))}
          </div>

          {/* MNG Kargo Baglanti Testi */}
          {group.key === "shipping_carriers" && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <button
                  onClick={testMngConnection}
                  disabled={mngTesting}
                  className="px-4 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {mngTesting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Test Ediliyor...
                    </>
                  ) : (
                    "MNG Kargo Baglanti Testi"
                  )}
                </button>

                {mngStatus && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                      mngStatus.connected
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        mngStatus.connected ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    {mngStatus.connected ? "Bagli" : "Bagli Degil"}
                  </span>
                )}
              </div>
              {mngStatus && (
                <p className={`mt-2 text-sm ${mngStatus.connected ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {mngStatus.message}
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </button>
        {saved && (
          <span className="text-sm text-success font-medium">Ayarlar basariyla kaydedildi!</span>
        )}
      </div>
    </div>
  );
}
