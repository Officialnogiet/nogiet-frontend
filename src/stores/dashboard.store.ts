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
  states: false,
  lgas: false,
  oilBlocks: true,
  pipelines: true,
  satelliteView: false,
  emissionHotspots: true,
  emissionGrid: true,
};

/** Concrete satellite providers — the legend's "all" virtual entry just selects every one. */
export type GridProvider = 'carbon_mapper' | 'imeo' | 'tropomi' | 'emit';
export const ALL_GRID_PROVIDERS: GridProvider[] = ['carbon_mapper', 'imeo', 'tropomi', 'emit'];
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
  instrumentsByProvider: { carbon_mapper: null, imeo: null, tropomi: null, emit: null },
  statistic: 'max',
  showAlerts: true,
  alertThresholdKgHr: 200,
};

/**
 * Cross-screen drill-in context passed when the user clicks "View Methane Trends"
 * from somewhere else in the app (e.g. the Live Map oil-block detail modal).
 * MethaneTrends reads this on mount and pre-filters its observations + heading
 * to the requested scope, then clears it so a subsequent direct visit doesn't
 * inherit stale state.
 */
export interface TrendsScope {
  /** Filter kind drives which observations are kept (Nigeria-wide, by state, or by oil-block name). */
  kind: 'nigeria' | 'state' | 'oilBlock';
  /** Display + filter value. e.g. "Rivers" for state, "OML 60" for oilBlock. */
  name: string;
  /** Optional state context for an oil-block scope — surfaces in the heading. */
  state?: string | null;
}

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
  trendsScope: TrendsScope | null;
  setTrendsScope: (scope: TrendsScope | null) => void;
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
        set((s) => {
          const willEnable = !s.mapLayers[layer];
          const mapLayers = { ...s.mapLayers, [layer]: willEnable };

          // Oil concessions and administrative boundaries are both dense polygon layers.
          // Keep them mutually exclusive so their borders and labels never pile up.
          if (willEnable && layer === 'oilBlocks') {
            mapLayers.states = false;
            mapLayers.lgas = false;
          } else if (willEnable && (layer === 'states' || layer === 'lgas')) {
            mapLayers.oilBlocks = false;
          }

          return { mapLayers };
        }),
      // Drill-in context populated by the Live Map's oil-block / state click;
      // consumed (and immediately cleared) by MethaneTrends on mount. Not
      // persisted — a fresh browser tab should never inherit a stale scope.
      trendsScope: null,
      setTrendsScope: (scope: TrendsScope | null) => set({ trendsScope: scope }),
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
      version: 10,
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
        if (version < 8) {
          // Swap default layer visibility: oil blocks were on by default, pipelines were off.
          // From v8 onwards pipelines are shown by default and oil blocks are off — they were
          // visually noisy and most users only want to drill into them on demand. Override the
          // persisted values so existing sessions adopt the new defaults on next load.
          persisted.mapLayers = {
            ...DEFAULT_LAYERS,
            ...(persisted.mapLayers ?? {}),
            oilBlocks: false,
            pipelines: true,
          };
        }
        if (version < 9) {
          // v9 reverses the v8 oil-block default: blocks are now the primary
          // drill-in surface (click → detail modal with plumes, facilities,
          // state, LGA), so they must be visible from the start. Override
          // the persisted value so existing sessions pick up the new behaviour
          // without the user having to toggle the layers panel.
          persisted.mapLayers = {
            ...DEFAULT_LAYERS,
            ...(persisted.mapLayers ?? {}),
            oilBlocks: true,
          };
        }
        if (version < 10) {
          // Oil blocks are the default drill-in surface. Administrative polygon layers
          // stay off while it is active to prevent overlapping borders and labels.
          persisted.mapLayers = {
            ...DEFAULT_LAYERS,
            ...(persisted.mapLayers ?? {}),
            states: false,
            lgas: false,
            oilBlocks: true,
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
