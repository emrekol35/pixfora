import { create } from "zustand";

interface ExperimentAssignment {
  variantId: string;
  variantName: string;
  config: Record<string, unknown>;
}

interface ExperimentState {
  assignments: Record<string, ExperimentAssignment>;
  isLoaded: boolean;
  fetchAssignments: (visitorId: string) => Promise<void>;
  getVariant: (testName: string) => ExperimentAssignment | null;
}

export const useExperimentStore = create<ExperimentState>((set, get) => ({
  assignments: {},
  isLoaded: false,

  fetchAssignments: async (visitorId: string) => {
    try {
      const res = await fetch(
        `/api/experiments/assign?visitorId=${encodeURIComponent(visitorId)}`
      );
      if (!res.ok) throw new Error("Experiment fetch failed");
      const data = await res.json();
      set({ assignments: data.assignments || {}, isLoaded: true });
    } catch {
      // Hata durumunda yine loaded olarak isaretlerr — kontrol grubu gibi davranir
      set({ isLoaded: true });
    }
  },

  getVariant: (testName: string) => {
    const { assignments } = get();
    return assignments[testName] || null;
  },
}));
