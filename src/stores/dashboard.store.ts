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
  emissionGrid: boolean;
}

export const DEFAULT_LAYERS: MapLayerState = {
  states: true,
  lgas: false,
  oilBlocks: true,
  pipelines: false,
  satelliteView: false,
  emissionHotspots: true,
  emissionGrid: true,
};

/** Concrete satellite providers — the legend's "all" virtual entry just selects every one. */
export type GridProvider = 'carbon_mapper' | 'imeo' | 'tropomi';
export const ALL_GRID_PROVIDERS: GridProvider[] = ['carbon_mapper', 'imeo', 'tropomi'];
export type GridStatistic = 'max' | 'average' | 'sum';

/**
 * Per-provider instrument allowlist.
 * `null` for a provider = "all instruments allowed" (the default).
 * Empty array `[]` = "no instruments allowed" (provider effectively muted at sub-level).
 */
export type InstrumentAllowlist = Partial<Record<GridProvider, string[] | null>>;

export interface GridControlsState {
  /** Multi-select: each entry is an active provider. Empty = mirror "no source selected". */
  providers: GridProvider[];
  /** Per-provider instrument allowlist — supports Carbon Mapper, IMEO, TROPOMI uniformly. */
  instrumentsByProvider: InstrumentAllowlist;
  statistic: GridStatistic;
  showAlerts: boolean;
  alertThresholdKgHr: number;
}

export const DEFAULT_GRID_CONTROLS: GridControlsState = {
  providers: [...ALL_GRID_PROVIDERS],
  instrumentsByProvider: { carbon_mapper: null, imeo: null, tropomi: null },
  statistic: 'max',
  showAlerts: true,
  alertThresholdKgHr: 200,
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
  gridControls: GridControlsState;
  setGridControls: (s: Partial<GridControlsState>) => void;
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
      gridControls: DEFAULT_GRID_CONTROLS,
      setGridControls: (next: Partial<GridControlsState>) =>
        set((s) => {
          // Always maintain a fully-shaped object so consumers never crash on a missing field
          // — even if the merge originated from an older persisted snapshot.
          const merged: GridControlsState = {
            ...DEFAULT_GRID_CONTROLS,
            ...s.gridControls,
            ...next,
            instrumentsByProvider: {
              ...DEFAULT_GRID_CONTROLS.instrumentsByProvider,
              ...(s.gridControls?.instrumentsByProvider ?? {}),
              ...(next?.instrumentsByProvider ?? {}),
            },
          };
          return { gridControls: merged };
        }),
    }),
    {
      name: "nogiet-dashboard",
      version: 7,
      partialize: (state) => ({
        darkMode: state.darkMode,
        sidebarCollapsed: state.sidebarCollapsed,
        mapLayers: state.mapLayers,
        gridControls: state.gridControls,
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
        if (version < 4) {
          persisted.mapLayers = { ...DEFAULT_LAYERS, ...(persisted.mapLayers ?? {}) };
          persisted.gridControls = { ...DEFAULT_GRID_CONTROLS, ...(persisted.gridControls ?? {}) };
        }
        if (version < 6) {
          // (legacy v5→v6) Used to add gridControls.imeoInstruments. Replaced in v7 below.
          persisted.gridControls = {
            ...DEFAULT_GRID_CONTROLS,
            ...(persisted.gridControls ?? {}),
            imeoInstruments: persisted.gridControls?.imeoInstruments ?? null,
          };
        }
        if (version < 7) {
          // imeoInstruments → instrumentsByProvider (per-provider allowlist).
          const prev = persisted.gridControls ?? {};
          const next: InstrumentAllowlist = {
            carbon_mapper: prev.instrumentsByProvider?.carbon_mapper ?? null,
            imeo: prev.instrumentsByProvider?.imeo ?? prev.imeoInstruments ?? null,
            tropomi: prev.instrumentsByProvider?.tropomi ?? null,
          };
          persisted.gridControls = {
            ...DEFAULT_GRID_CONTROLS,
            ...prev,
            instrumentsByProvider: next,
          };
          delete persisted.gridControls.imeoInstruments;
        }
        if (version < 5) {
          // gridControls.provider (single value) → providers (array)
          const prev = persisted.gridControls ?? {};
          let providers: GridProvider[] = ALL_GRID_PROVIDERS;
          if (Array.isArray(prev.providers) && prev.providers.length > 0) {
            providers = prev.providers.filter((p: string): p is GridProvider =>
              (ALL_GRID_PROVIDERS as string[]).includes(p),
            );
            if (providers.length === 0) providers = [...ALL_GRID_PROVIDERS];
          } else if (typeof prev.provider === 'string' && prev.provider !== 'all') {
            providers = (ALL_GRID_PROVIDERS as string[]).includes(prev.provider)
              ? [prev.provider as GridProvider]
              : [...ALL_GRID_PROVIDERS];
          }
          persisted.gridControls = {
            ...DEFAULT_GRID_CONTROLS,
            ...prev,
            providers,
          };
          delete persisted.gridControls.provider;
          // Promote layer defaults that should be on
          persisted.mapLayers = {
            ...DEFAULT_LAYERS,
            ...(persisted.mapLayers ?? {}),
            states: persisted.mapLayers?.states ?? true,
            oilBlocks: persisted.mapLayers?.oilBlocks ?? true,
            emissionGrid: persisted.mapLayers?.emissionGrid ?? true,
          };
        }
        // Final safety: guarantee every required gridControls field exists, regardless of
        // which version branch the persisted state took (defends against partial writes / HMR).
        persisted.gridControls = {
          ...DEFAULT_GRID_CONTROLS,
          ...(persisted.gridControls ?? {}),
          instrumentsByProvider: {
            ...DEFAULT_GRID_CONTROLS.instrumentsByProvider,
            ...(persisted.gridControls?.instrumentsByProvider ?? {}),
          },
          providers:
            Array.isArray(persisted.gridControls?.providers) && persisted.gridControls.providers.length > 0
              ? persisted.gridControls.providers
              : [...ALL_GRID_PROVIDERS],
        };
        return persisted;
      },
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return;
        // Re-hydrate guard — guarantees the live state is fully shaped, even if a
        // previous session persisted an older snapshot or migration silently failed.
        const gc = (state as DashboardState).gridControls;
        if (!gc || !gc.instrumentsByProvider) {
          (state as DashboardState).gridControls = {
            ...DEFAULT_GRID_CONTROLS,
            ...(gc ?? {}),
            instrumentsByProvider: {
              ...DEFAULT_GRID_CONTROLS.instrumentsByProvider,
              ...((gc?.instrumentsByProvider) ?? {}),
            },
          } as GridControlsState;
        }
      },
    },
  ),
);
