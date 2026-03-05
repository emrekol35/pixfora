"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

/**
 * Google Analytics 4 entegrasyonu.
 * Admin ayarlarindan GA4 Measurement ID'yi alir ve
 * musteri sayfalarinda gtag.js yukler.
 * Sayfa degisikliklerinde otomatik page_view event'i gonderir.
 */
export default function GoogleAnalytics() {
  const [measurementId, setMeasurementId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // GA4 ayarlarini cek
  useEffect(() => {
    fetch("/api/settings/public?keys=ga4_enabled,ga4_measurement_id")
      .then((res) => res.json())
      .then((data) => {
        const settings = data.settings || {};
        if (settings.ga4_enabled === "true" && settings.ga4_measurement_id) {
          setMeasurementId(settings.ga4_measurement_id);
        }
      })
      .catch(() => {
        // GA4 ayarlari alinamazsa sessizce devam et
      });
  }, []);

  // Sayfa degisikliklerinde page_view gonder
  useEffect(() => {
    if (!loaded || !measurementId) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (typeof w.gtag === "function") {
      w.gtag("config", measurementId, {
        page_path: url,
      });
    }
  }, [pathname, searchParams, loaded, measurementId]);

  if (!measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        onLoad={() => setLoaded(true)}
      />
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
