import { create } from "zustand";
import type { NormalizedSource } from "../api/emissions.api";

export type SatelliteSource = NormalizedSource;

interface SatelliteStore {
  sources: SatelliteSource[];
  fetchedRegions: string[];
  isStale: boolean;
  activeProviders: string[];

  mergeSources: (incoming: SatelliteSource[], regionBBox: string) => void;
  setSources: (sources: SatelliteSource[], regionBBox: string) => void;
  setActiveProviders: (providers: string[]) => void;
  markStale: () => void;
  clearStale: () => void;
  clear: () => void;
}

export const useSatelliteStore = create<SatelliteStore>((set) => ({
  sources: [],
  fetchedRegions: [],
  isStale: false,
  activeProviders: [],

  mergeSources: (incoming, regionBBox) =>
    set((state) => {
      const existingMap = new Map(state.sources.map((s) => [s.id, s]));
      for (const src of incoming) {
        existingMap.set(src.id, src);
      }
      return {
        sources: Array.from(existingMap.values()),
        fetchedRegions: state.fetchedRegions.includes(regionBBox)
          ? state.fetchedRegions
          : [...state.fetchedRegions, regionBBox],
        isStale: true,
      };
    }),

  setSources: (sources, regionBBox) =>
    set({
      sources,
      fetchedRegions: [regionBBox],
      isStale: true,
    }),

  setActiveProviders: (providers) => set({ activeProviders: providers }),
  markStale: () => set({ isStale: true }),
  clearStale: () => set({ isStale: false }),
  clear: () => set({ sources: [], fetchedRegions: [], isStale: false }),
}));
