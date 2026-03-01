"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";

interface Preferences {
  email_orders: boolean;
  email_promotions: boolean;
  email_stock_alerts: boolean;
  email_newsletter: boolean;
  push_orders: boolean;
  push_promotions: boolean;
  push_stock_alerts: boolean;
  push_cart_reminders: boolean;
}

export default function NotificationPreferencesForm({
  initialPreferences,
}: {
  initialPreferences: Preferences;
}) {
  const t = useTranslations("notification");
  const tc = useTranslations("common");
  const [preferences, setPreferences] = useState<Preferences>(initialPreferences);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const CATEGORIES = [
    {
      title: t("orderNotifications"),
      description: t("orderNotificationsDesc"),
      emailKey: "email_orders" as const,
      pushKey: "push_orders" as const,
    },
    {
      title: t("promotionNotifications"),
      description: t("promotionNotificationsDesc"),
      emailKey: "email_promotions" as const,
      pushKey: "push_promotions" as const,
    },
    {
      title: t("stockAlerts"),
      description: t("stockAlertsDesc"),
      emailKey: "email_stock_alerts" as const,
      pushKey: "push_stock_alerts" as const,
    },
    {
      title: t("cartReminders"),
      description: t("cartRemindersDesc"),
      emailKey: null,
      pushKey: "push_cart_reminders" as const,
    },
    {
      title: t("newsletter"),
      description: t("newsletterDesc"),
      emailKey: "email_newsletter" as const,
      pushKey: null,
    },
  ];

  const togglePreference = useCallback((key: keyof Preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    setMessage(null);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: t("savedSuccess") });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || t("unknownError") });
      }
    } catch {
      setMessage({ type: "error", text: t("connectionError") });
    } finally {
      setSaving(false);
    }
  }, [preferences, t]);

  return (
    <div className="space-y-6">
      {/* Bilgilendirme */}
      <p className="text-sm text-muted-foreground">
        {t("infoText")}
      </p>

      {/* Kategori Listesi */}
      <div className="space-y-4">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.title}
            className="bg-card border border-border rounded-xl p-4"
          >
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                {cat.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cat.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              {/* E-posta toggle */}
              {cat.emailKey && (
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences[cat.emailKey]}
                    onClick={() => togglePreference(cat.emailKey!)}
                    className={`relative w-10 h-5.5 rounded-full transition-colors ${
                      preferences[cat.emailKey]
                        ? "bg-primary"
                        : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${
                        preferences[cat.emailKey]
                          ? "translate-x-[18px]"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {t("emailChannel")}
                  </span>
                </label>
              )}

              {/* Push toggle */}
              {cat.pushKey && (
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences[cat.pushKey]}
                    onClick={() => togglePreference(cat.pushKey!)}
                    className={`relative w-10 h-5.5 rounded-full transition-colors ${
                      preferences[cat.pushKey]
                        ? "bg-primary"
                        : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${
                        preferences[cat.pushKey]
                          ? "translate-x-[18px]"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {t("pushChannel")}
                  </span>
                </label>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mesaj */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-success/10 text-success"
              : "bg-danger/10 text-danger"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Kaydet */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
      >
        {saving ? tc("loading") : t("savePreferences")}
      </button>
    </div>
  );
}
