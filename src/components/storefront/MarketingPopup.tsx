"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface PopupData {
  id: string;
  title: string;
  content: string;
  image: string | null;
  type: string; // general | exit | promotion
  showOnce: boolean;
  delay: number;
}

export default function MarketingPopup() {
  const tc = useTranslations("common");
  const [popups, setPopups] = useState<PopupData[]>([]);
  const [activePopup, setActivePopup] = useState<PopupData | null>(null);
  const exitListenerAdded = useRef(false);

  useEffect(() => {
    fetch("/api/popups/active")
      .then((res) => res.json())
      .then((data) => {
        if (data.popups?.length > 0) {
          setPopups(data.popups);
        }
      })
      .catch(console.error);
  }, []);

  // Popup'lari tipe gore isle
  useEffect(() => {
    if (popups.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const popup of popups) {
      // Daha once gorulmus mu
      if (popup.showOnce && localStorage.getItem(`popup-seen-${popup.id}`)) {
        continue;
      }

      if (popup.type === "general" || popup.type === "promotion") {
        // Delay sonra goster
        const timer = setTimeout(() => {
          setActivePopup(popup);
        }, popup.delay || 2000);
        timers.push(timer);
        break; // Ayni anda tek popup
      }

      if (popup.type === "exit" && !exitListenerAdded.current) {
        exitListenerAdded.current = true;
        const handleMouseLeave = (e: MouseEvent) => {
          if (e.clientY <= 0) {
            // Daha once gorulmus mu tekrar kontrol
            if (popup.showOnce && localStorage.getItem(`popup-seen-${popup.id}`)) {
              return;
            }
            setActivePopup(popup);
            document.removeEventListener("mouseleave", handleMouseLeave);
          }
        };
        document.addEventListener("mouseleave", handleMouseLeave);

        return () => {
          document.removeEventListener("mouseleave", handleMouseLeave);
        };
      }
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [popups]);

  const handleClose = useCallback(() => {
    if (activePopup) {
      if (activePopup.showOnce) {
        localStorage.setItem(`popup-seen-${activePopup.id}`, "true");
      }
      setActivePopup(null);
    }
  }, [activePopup]);

  // ESC ile kapat
  useEffect(() => {
    if (!activePopup) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [activePopup, handleClose]);

  // Body scroll kilitle
  useEffect(() => {
    if (activePopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activePopup]);

  if (!activePopup) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Kapat butonu */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white transition-colors shadow-sm"
          aria-label={tc("close")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Gorsel */}
        {activePopup.image && (
          <div className="relative w-full aspect-[16/9] overflow-hidden rounded-t-2xl">
            <Image
              src={activePopup.image}
              alt={activePopup.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 512px"
            />
          </div>
        )}

        {/* Icerik */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-foreground mb-3">
            {activePopup.title}
          </h3>
          <div
            className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: activePopup.content }}
          />
        </div>
      </div>
    </div>
  );
}
