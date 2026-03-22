import { create } from "zustand";

interface SatelliteSource {
  source_name: string;
  lat: number;
  lon: number;
  sector: string;
  gas: string;
  emission_rate: number;
  persistence: number;
  plume_count: number;
  instrument: string;
  first_detected: string;
  last_detected: string;
}

interface SatelliteStore {
  sources: SatelliteSource[];
  fetchedRegions: string[];
  isStale: boolean;

  /** Merge new sources into the global pool, deduplicating by source_name */
  mergeSources: (incoming: SatelliteSource[], regionBBox: string) => void;
  /** Replace all sources (e.g. on initial load) */
  setSources: (sources: SatelliteSource[], regionBBox: string) => void;
  /** Mark data as stale so the map knows a refresh happened */
  markStale: () => void;
  clearStale: () => void;
  clear: () => void;
}

export const useSatelliteStore = create<SatelliteStore>((set) => ({
  sources: [],
  fetchedRegions: [],
  isStale: false,

  mergeSources: (incoming, regionBBox) =>
    set((state) => {
      const existingMap = new Map(state.sources.map((s) => [s.source_name, s]));
      for (const src of incoming) {
        existingMap.set(src.source_name, src);
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

  markStale: () => set({ isStale: true }),
  clearStale: () => set({ isStale: false }),
  clear: () => set({ sources: [], fetchedRegions: [], isStale: false }),
}));
