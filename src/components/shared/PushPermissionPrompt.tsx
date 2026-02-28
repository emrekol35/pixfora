"use client";

import { useEffect, useState, useCallback } from "react";

// Base64 URL encoded string'i Uint8Array'e donustur (VAPID key icin)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const DISMISS_KEY = "push-prompt-dismissed";
const DISMISS_DAYS = 14;
const SHOW_DELAY = 5000; // 5 saniye

export default function PushPermissionPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // Tarayici destegi kontrol
    if (!("Notification" in window) || !("PushManager" in window)) return;
    // Zaten izin verilmis veya reddedilmis
    if (Notification.permission !== "default") return;
    // Service worker yoksa
    if (!("serviceWorker" in navigator)) return;
    // VAPID key yoksa
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;

    // Daha once kapatmis mi
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < DISMISS_DAYS * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    const timer = setTimeout(() => setShowBanner(true), SHOW_DELAY);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = useCallback(async () => {
    setIsSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ).buffer as ArrayBuffer,
      });

      // Subscription'i sunucuya kaydet
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
        }),
      });

      setShowBanner(false);
    } catch (error) {
      console.error("Push subscription error:", error);
      // Kullanici reddettiyse veya hata olustuysa kapat
      setShowBanner(false);
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } finally {
      setIsSubscribing(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-16 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up">
      <div className="bg-white rounded-xl shadow-xl border border-border p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Bildirim almak ister misiniz?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Siparis, kampanya ve firsatlardan aninda haberdar olun.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Kapat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-3 py-2 text-xs font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Simdi Degil
          </button>
          <button
            onClick={handleAccept}
            disabled={isSubscribing}
            className="flex-1 px-3 py-2 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isSubscribing ? "Kaydediliyor..." : "Izin Ver"}
          </button>
        </div>
      </div>
    </div>
  );
}
