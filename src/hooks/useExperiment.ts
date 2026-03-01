"use client";

import { useExperimentStore } from "@/store/experiments";

/**
 * A/B test hook — bilesen seviyesinde varyant bilgisine erisim.
 * Atama yoksa null doner (kontrol grubu gibi davranir).
 *
 * @param testName — ABTest.name alani ile eslesmeli
 */
export function useExperiment(testName: string) {
  const isLoaded = useExperimentStore((s) => s.isLoaded);
  const assignment = useExperimentStore((s) => s.assignments[testName] || null);

  return {
    /** Varyant bilgisi (null = test yok veya trafik disinda) */
    variant: assignment,
    /** Varyant konfigurasyonu */
    config: (assignment?.config || {}) as Record<string, unknown>,
    /** Kontrol grubu mu? */
    isControl: assignment?.variantName === "Kontrol" || !assignment,
    /** Yukleme tamamlandi mi? */
    isLoading: !isLoaded,
  };
}
