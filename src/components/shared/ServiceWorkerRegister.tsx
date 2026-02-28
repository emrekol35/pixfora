"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Yeni SW geldiginde otomatik guncelle
          reg.onupdatefound = () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.onstatechange = () => {
                if (
                  newWorker.state === "activated" &&
                  navigator.serviceWorker.controller
                ) {
                  // Yeni versiyon hazir — sayfayi yeniden yukle
                  window.location.reload();
                }
              };
            }
          };
        })
        .catch((err) => {
          console.error("SW registration failed:", err);
        });
    }
  }, []);

  return null;
}
