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
    key: "shipping",
    title: "Kargo Ayarlari",
    fields: [
      { key: "free_shipping_threshold", label: "Ucretsiz Kargo Limiti (TL)", type: "number", placeholder: "500" },
      { key: "default_shipping_company", label: "Varsayilan Kargo Firmasi", type: "text", placeholder: "Yurtici Kargo" },
      { key: "flat_shipping_rate", label: "Sabit Kargo Ucreti (TL)", type: "number", placeholder: "39.90" },
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
