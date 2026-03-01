"use client";

// ============================================================
// Client-Side Event Tracking Kutuphanesi
// ============================================================

const VISITOR_COOKIE = "pxf_vid";
const SESSION_KEY = "pxf_sid";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 yil (saniye)
const BATCH_DELAY = 500; // ms
const MAX_QUEUE = 50;

// ---------- Visitor & Session ID ----------

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getVisitorId(): string {
  let vid = getCookie(VISITOR_COOKIE);
  if (!vid) {
    vid = generateId();
    setCookie(VISITOR_COOKIE, vid, COOKIE_MAX_AGE);
  }
  return vid;
}

export function getSessionId(): string {
  if (typeof sessionStorage === "undefined") return generateId();
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = generateId();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

// ---------- Event Queue & Batching ----------

interface QueuedEvent {
  visitorId: string;
  sessionId: string;
  eventType: string;
  eventData?: Record<string, unknown>;
  page?: string;
  referrer?: string;
  testAssignments?: Record<string, unknown>;
}

let eventQueue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let testAssignmentsSnapshot: Record<string, unknown> | null = null;

/** Aktif A/B test atamalarini kaydet — TrackingProvider tarafindan cagrilir */
export function setTestAssignments(
  assignments: Record<string, unknown> | null
) {
  testAssignmentsSnapshot = assignments;
}

function flush() {
  if (eventQueue.length === 0) return;

  const batch = eventQueue.splice(0, MAX_QUEUE);

  const payload = JSON.stringify({ events: batch });

  // sendBeacon ile gonder (sayfa kapansa bile calısır)
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const sent = navigator.sendBeacon("/api/tracking", payload);
    if (sent) return;
  }

  // Fallback: fetch (keepalive)
  fetch("/api/tracking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Tracking hatasi — sessizce gec
  });
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, BATCH_DELAY);
}

// Sayfa kapanirken kalan event'leri gonder
if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flush();
    }
  });
  window.addEventListener("pagehide", flush);
}

// ---------- Public API ----------

/**
 * Event kaydet.
 * @param eventType  Event tipi (ornek: "page_view", "add_to_cart")
 * @param eventData  Opsiyonel detay verisi
 * @param page       Sayfa yolu (default: window.location.pathname)
 */
export function trackEvent(
  eventType: string,
  eventData?: Record<string, unknown>,
  page?: string
) {
  if (typeof window === "undefined") return;

  const event: QueuedEvent = {
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    eventType,
    eventData,
    page: page || window.location.pathname,
    referrer: document.referrer || undefined,
    testAssignments: testAssignmentsSnapshot || undefined,
  };

  eventQueue.push(event);

  if (eventQueue.length >= MAX_QUEUE) {
    flush();
  } else {
    scheduleFlush();
  }
}

/** Sayfa goruntulemesi kaydet */
export function trackPageView(page?: string) {
  trackEvent("page_view", undefined, page);
}
