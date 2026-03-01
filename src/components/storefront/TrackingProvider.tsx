"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import {
  trackEvent as _trackEvent,
  trackPageView,
  getVisitorId,
  setTestAssignments,
} from "@/lib/tracking";
import { useExperimentStore } from "@/store/experiments";

// ---------- Context ----------

interface TrackingContextValue {
  trackEvent: (
    eventType: string,
    eventData?: Record<string, unknown>
  ) => void;
  visitorId: string | null;
}

const TrackingContext = createContext<TrackingContextValue>({
  trackEvent: () => {},
  visitorId: null,
});

export function useTracking() {
  return useContext(TrackingContext);
}

// ---------- Provider ----------

export default function TrackingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const visitorIdRef = useRef<string | null>(null);
  const prevPathnameRef = useRef<string | null>(null);
  const fetchAssignments = useExperimentStore((s) => s.fetchAssignments);
  const experimentAssignments = useExperimentStore((s) => s.assignments);

  // visitorId'yi client tarafinda baslat + experiment atamalari yukle
  useEffect(() => {
    const vid = getVisitorId();
    visitorIdRef.current = vid;
    fetchAssignments(vid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Experiment atamalari degistiginde tracking snapshot'i guncelle
  useEffect(() => {
    if (Object.keys(experimentAssignments).length > 0) {
      const snapshot: Record<string, string> = {};
      for (const [testName, assignment] of Object.entries(
        experimentAssignments
      )) {
        snapshot[testName] = assignment.variantName;
      }
      setTestAssignments(snapshot);
    }
  }, [experimentAssignments]);

  // Sayfa degisikliklerinde otomatik page_view
  useEffect(() => {
    // Ayni pathname icin tekrar gonderme
    if (prevPathnameRef.current === pathname) return;
    prevPathnameRef.current = pathname;

    trackPageView(pathname);
  }, [pathname]);

  const trackEvent = useCallback(
    (eventType: string, eventData?: Record<string, unknown>) => {
      _trackEvent(eventType, eventData);
    },
    []
  );

  return (
    <TrackingContext.Provider
      value={{ trackEvent, visitorId: visitorIdRef.current }}
    >
      {children}
    </TrackingContext.Provider>
  );
}
