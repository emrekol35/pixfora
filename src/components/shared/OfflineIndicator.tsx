"use client";

import { useEffect, useState } from "react";

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [showOnline, setShowOnline] = useState(false);

  useEffect(() => {
    // Baslangicta kontrol et
    setIsOffline(!navigator.onLine);

    const handleOffline = () => {
      setIsOffline(true);
      setShowOnline(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowOnline(true);
      // 3 saniye sonra online banner'i gizle
      setTimeout(() => setShowOnline(false), 3000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline && !showOnline) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] text-center text-sm font-medium py-2 px-4 transition-all ${
        isOffline
          ? "bg-danger text-white"
          : "bg-success text-white"
      }`}
    >
      {isOffline
        ? "Internet baglantiniz yok. Bazi ozellikler calismayabilir."
        : "Baglanti geri geldi!"}
    </div>
  );
}
