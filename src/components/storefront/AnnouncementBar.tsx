"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Announcement {
  id: string;
  text: string;
  link: string | null;
  bgColor: string;
  textColor: string;
}

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // localStorage'dan dismiss durumlarini oku
    const dismissedIds = new Set<string>();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("announcement-dismissed-")) {
        dismissedIds.add(key.replace("announcement-dismissed-", ""));
      }
    }
    setDismissed(dismissedIds);

    // Aktif duyurulari cek
    fetch("/api/announcements/active")
      .then((res) => res.json())
      .then((data) => {
        if (data.announcements?.length > 0) {
          setAnnouncements(data.announcements);
        }
      })
      .catch(console.error);
  }, []);

  // Birden fazla duyuru varsa otomatik gecis
  useEffect(() => {
    const visibleAnnouncements = announcements.filter((a) => !dismissed.has(a.id));
    if (visibleAnnouncements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % visibleAnnouncements.length);
    }, 5000); // 5 saniyede bir gecis

    return () => clearInterval(interval);
  }, [announcements, dismissed]);

  const handleDismiss = useCallback((id: string) => {
    localStorage.setItem(`announcement-dismissed-${id}`, "true");
    setDismissed((prev) => new Set([...prev, id]));
  }, []);

  // Gorunecek duyurular
  const visibleAnnouncements = announcements.filter((a) => !dismissed.has(a.id));
  if (visibleAnnouncements.length === 0) return null;

  const safeIndex = currentIndex % visibleAnnouncements.length;
  const current = visibleAnnouncements[safeIndex];

  const content = (
    <div className="flex items-center justify-center gap-2 min-h-[2.25rem]">
      <p className="text-sm font-medium text-center truncate max-w-[90%]">
        {current.text}
      </p>
      {current.link && (
        <svg className="w-3.5 h-3.5 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  );

  return (
    <div
      className="relative w-full px-10"
      style={{ backgroundColor: current.bgColor, color: current.textColor }}
    >
      {current.link ? (
        <Link href={current.link} className="block">
          {content}
        </Link>
      ) : (
        content
      )}

      {/* Kapat butonu */}
      <button
        onClick={() => handleDismiss(current.id)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: current.textColor }}
        aria-label="Duyuruyu kapat"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Birden fazla duyuru gostergesi */}
      {visibleAnnouncements.length > 1 && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-1">
          {visibleAnnouncements.map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-opacity ${
                i === safeIndex ? "opacity-100" : "opacity-40"
              }`}
              style={{ backgroundColor: current.textColor }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
