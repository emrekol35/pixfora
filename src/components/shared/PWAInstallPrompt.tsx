"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Daha once kapatmis mi kontrol et
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // 7 gun gecmemisse gosterme
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // 3 saniye sonra goster
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!showBanner || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-16 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up">
      <div className="bg-white rounded-xl shadow-xl border border-border p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-xl">📱</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Pixfora&apos;yi yukleyin!</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ana ekraniniza ekleyerek daha hizli erisim saglayin.
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
            onClick={handleInstall}
            className="flex-1 px-3 py-2 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
          >
            Yukle
          </button>
        </div>
      </div>
    </div>
  );
}
