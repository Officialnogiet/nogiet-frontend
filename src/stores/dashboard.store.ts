import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DashboardView } from "../../types";

export interface MapLayerState {
  states: boolean;
  lgas: boolean;
  oilBlocks: boolean;
  pipelines: boolean;
  satelliteView: boolean;
  emissionHotspots: boolean;
}

export const DEFAULT_LAYERS: MapLayerState = {
  states: false,
  lgas: false,
  oilBlocks: false,
  pipelines: false,
  satelliteView: false,
  emissionHotspots: true,
};

interface DashboardState {
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isFilterOpen: boolean;
  setFilterOpen: (open: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  selectedFacility: any | null;
  setSelectedFacility: (facility: any | null) => void;
  isExpanded: boolean;
  setExpanded: (expanded: boolean) => void;
  showAlerts: boolean;
  toggleAlerts: () => void;
  mapLayers: MapLayerState;
  toggleMapLayer: (layer: keyof MapLayerState) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      activeView: "LIVE_MAP" as DashboardView,
      setActiveView: (view: DashboardView) => set({ activeView: view, isFilterOpen: false }),
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      isFilterOpen: false,
      setFilterOpen: (open: boolean) => set({ isFilterOpen: open }),
      darkMode: true,
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      selectedFacility: null,
      setSelectedFacility: (facility: any | null) => set({ selectedFacility: facility }),
      isExpanded: false,
      setExpanded: (expanded: boolean) => set({ isExpanded: expanded }),
      showAlerts: false,
      toggleAlerts: () => set((s) => ({ showAlerts: !s.showAlerts })),
      mapLayers: DEFAULT_LAYERS,
      toggleMapLayer: (layer: keyof MapLayerState) =>
        set((s) => ({ mapLayers: { ...s.mapLayers, [layer]: !s.mapLayers[layer] } })),
    }),
    {
      name: "nogiet-dashboard",
      version: 3,
      partialize: (state) => ({
        darkMode: state.darkMode,
        sidebarCollapsed: state.sidebarCollapsed,
        mapLayers: state.mapLayers,
      }),
      migrate: (persisted: any, version: number) => {
        if (version < 3) {
          try {
            const old = localStorage.getItem("nogiet-map-layers");
            if (old) {
              persisted.mapLayers = { ...DEFAULT_LAYERS, ...JSON.parse(old) };
              localStorage.removeItem("nogiet-map-layers");
            }
          } catch { /* ignore */ }
        }
        return persisted;
      },
    },
  ),
);
