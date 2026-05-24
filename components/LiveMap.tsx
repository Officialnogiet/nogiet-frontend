import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AlertCircle, RefreshCw, X, Satellite, Layers, Info } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useQueryClient } from '@tanstack/react-query';
import MapSearchBar from './live-map/MapSearchBar';
import AlertsPanel from './live-map/AlertsPanel';
import MapZoomControls from './live-map/MapZoomControls';
import EmissionSummaryCard from './live-map/EmissionSummaryCard';
import FacilityPopup from './live-map/FacilityPopup';
import FacilityDetailModal from './live-map/FacilityDetailModal';
import MapDataLoader from './live-map/MapDataLoader';
import LayerTogglePanel from './live-map/LayerTogglePanel';
import { useDashboardStore, DEFAULT_LAYERS, DEFAULT_GRID_CONTROLS, type MapLayerState } from '../src/stores/dashboard.store';
import type { FacilityData } from './live-map/FacilityPopup';
import { DEFAULT_FILTERS, type MapFilters } from './FilterPanel';
import { useFacilities, useAlerts, useGroundData, useSatelliteSources, useUnreadAlertCount, useMarkAllAlertsRead } from '../src/hooks/useEmissions';
import { emissionsApi } from '../src/api/emissions.api';
import { useSocketUpdates } from '../src/hooks/useSocket';
import { useSatelliteStore } from '../src/stores/satellite.store';
import { useSettingsStore } from '../src/stores/settings.store';
import {
  addStatesLayer, removeStatesLayer,
  addLGAsLayer, removeLGAsLayer,
  addPipelinesLayer, removePipelinesLayer,
  addOilBlocksLayer, removeOilBlocksLayer,
  uninstallBoundaryHover,
  setBoundaryTheme,
} from './live-map/boundaryLayers';
import {
  addEmissionGridLayer,
  updateEmissionGridLayer,
  removeEmissionGridLayer,
  setEmissionGridTheme,
  EMISSION_GRID_FILL,
} from './live-map/emissionGridLayer';
import { buildEmissionGrid, cellDegForZoom, type EmissionPoint } from './live-map/emissionGrid';
import EmissionGridLegend, { type ProviderSourcesSummary, type ProviderInstrumentSummary } from './live-map/EmissionGridLegend';
import SourceLegendHint from './live-map/SourceLegendHint';
import { ALL_GRID_PROVIDERS, type GridProvider } from '../src/stores/dashboard.store';
import { feedColor, normalizeInstrument, shortInstrument } from './methane-trends/feeds';
import oilStationIcon from '../assets/oil-station.png';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const NIGERIA_DEFAULT_BBOX = '3,4,15,14';
const SAT_SOURCE_ID = 'satellite-sources';
const SAT_LAYER_GLOW = 'satellite-glow';
const SAT_LAYER_POINT = 'satellite-point';
const SAT_LAYER_LABEL = 'satellite-label';
const SAT_COUNT_LABEL = 'satellite-count-label';
const PULSE_SOURCE = 'search-pulse-source';
const PULSE_LAYER = 'search-pulse-layer';
const PULSE_OUTER_LAYER = 'search-pulse-outer';
const PLUME_SOURCE = 'plume-source';
const PLUME_LAYER_DOT = 'plume-dot';
const PLUME_LAYER_GLOW = 'plume-glow';
const PLUME_LAYER_LINE = 'plume-line';
const SCATTER_SOURCE = 'plume-scatter';
const SCATTER_HAZE = 'plume-scatter-haze';
const SCATTER_GLOW = 'plume-scatter-glow';
const SCATTER_DOT = 'plume-scatter-dot';
const GROUND_SCATTER_SRC = 'ground-scatter';
const GROUND_SCATTER_HAZE = 'ground-scatter-haze';
const GROUND_SCATTER_GLOW = 'ground-scatter-glow';
const GROUND_SCATTER_DOT = 'ground-scatter-dot';
const HOVER_CONNECTOR_SRC = 'hover-connector-src';
const HOVER_CONNECTOR_LINE = 'hover-connector-line';
const HOVER_CONNECTOR_DOT = 'hover-connector-dot';

function snapBBox(w: number, s: number, e: number, n: number): string {
  return `${Math.floor(w)},${Math.floor(s)},${Math.ceil(e)},${Math.ceil(n)}`;
}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function buildPlumeScatterGeoJSON(satellites: any[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  (satellites ?? []).forEach((src: any, srcIdx: number) => {
    const count = src.plumeCount ?? src.plume_count ?? 0;
    if (count <= 0) return;

    const lng = src.longitude ?? src.lon;
    const lat = src.latitude ?? src.lat;
    const baseRate = src.emissionRate ?? src.emission_rate ?? 0;
    const maxR = 0.02 + Math.min(count, 20) * 0.002;
    const provider = (src.provider ?? 'carbon_mapper') as 'carbon_mapper' | 'imeo' | 'tropomi';
    const sourceColor = feedColor(provider, src.instrument ?? '');

    for (let i = 0; i < count; i++) {
      const angle = i * goldenAngle + seededRand(srcIdx * 100) * Math.PI * 2;
      const r = maxR * Math.sqrt((i + 1) / count);
      const jitter = seededRand(srcIdx * 1000 + i * 7) * 0.004;
      const rateVariance = 0.4 + seededRand(srcIdx * 500 + i * 13) * 1.2;
      const plumeRate = Math.round(baseRate * rateVariance * 10) / 10;

      features.push({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [
            lng + (r + jitter) * Math.cos(angle),
            lat + (r + jitter) * Math.sin(angle),
          ],
        },
        properties: {
          source_name: src.name ?? src.source_name ?? '',
          provider,
          feed_color: sourceColor,
          plume_idx: i + 1,
          total: count,
          rate: plumeRate,
          parent_lng: lng,
          parent_lat: lat,
        },
      });
    }
  });

  return { type: 'FeatureCollection', features };
}

function buildGroundScatterGeoJSON(facilities: any[], allGroundData: Map<string, any[]>): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  facilities.forEach((f: any, fIdx: number) => {
    const measurements = allGroundData.get(f.id) ?? [];
    if (measurements.length === 0) return;

    const lng = f.longitude;
    const lat = f.latitude;
    const maxR = 0.015 + Math.min(measurements.length, 15) * 0.002;

    measurements.forEach((gd: any, i: number) => {
      const hasRealCoords = typeof gd.latitude === 'number' && typeof gd.longitude === 'number';
      let ptLng: number, ptLat: number;
      if (hasRealCoords) {
        ptLng = gd.longitude;
        ptLat = gd.latitude;
      } else {
        const angle = i * goldenAngle + seededRand(fIdx * 100) * Math.PI * 2;
        const r = maxR * Math.sqrt((i + 1) / measurements.length);
        const jitter = seededRand(fIdx * 1000 + i * 7) * 0.003;
        ptLng = lng + (r + jitter) * Math.cos(angle);
        ptLat = lat + (r + jitter) * Math.sin(angle);
      }

      features.push({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [ptLng, ptLat],
        },
        properties: {
          facility_name: f.name ?? '',
          reading: gd.methaneReading ?? 0,
          date: gd.measurementDate ?? '',
          methodology: gd.methodology ?? '',
          measurement_idx: i + 1,
          total: measurements.length,
        },
      });
    });
  });

  return { type: 'FeatureCollection', features };
}

function buildSatelliteGeoJSON(features: any[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: (features ?? []).map((src: any) => {
      const provider = (src.provider ?? 'carbon_mapper') as 'carbon_mapper' | 'imeo' | 'tropomi';
      const instrument = src.instrument ?? '';
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [src.longitude ?? src.lon, src.latitude ?? src.lat] },
        properties: {
          feature_id: src.id ?? '',
          source_name: src.name ?? src.source_name ?? '',
          provider,
          sector: src.sector ?? 'Unknown',
          emission_rate: src.emissionRate ?? src.emission_rate ?? 0,
          emission_uncertainty: src.metadata?.emissionUncertainty ?? src.emissionUncertainty ?? 0,
          plume_count: src.plumeCount ?? src.plume_count ?? 0,
          gas: src.gas ?? 'CH4',
          persistence: src.persistence ?? 0,
          instrument,
          // Per-source color resolved here (provider canonical for CM/TROPOMI,
          // instrument-hashed palette for IMEO). Mapbox reads this directly via
          // ['get', 'feed_color'] so we don't need a giant `match` expression.
          feed_color: feedColor(provider, instrument),
          first_detected: src.firstDetected ?? src.first_detected ?? '',
          last_detected: src.lastDetected ?? src.last_detected ?? '',
          plume_image_url: src.metadata?.plumeImageUrl ?? '',
        },
      };
    }),
  };
}

function satelliteProviderAttribution(provider: string | undefined): string {
  switch (provider) {
    case 'imeo': return 'UNEP IMEO (methanedata.unep.org)';
    case 'tropomi': return 'Sentinel-5P TROPOMI';
    default: return 'Carbon Mapper (carbonmapper.org)';
  }
}

const PROVIDER_SHORT_LABEL: Record<string, string> = {
  carbon_mapper: 'Carbon Mapper',
  imeo: 'IMEO',
  tropomi: 'TROPOMI',
};

/** "All providers" / "IMEO + Carbon Mapper" / "Carbon Mapper" / "None". */
function providerSummary(providers: string[]): string {
  if (providers.length === 0) return 'None';
  if (providers.length === ALL_GRID_PROVIDERS.length) return 'All providers';
  return providers.map((p) => PROVIDER_SHORT_LABEL[p] ?? p).join(' + ');
}

const REGION_COORDS: Record<string, { center: [number, number]; zoom: number }> = {
  'Nigeria (Full)': { center: [8.0, 9.0], zoom: 6.5 },
  'Niger Delta': { center: [6.2, 5.2], zoom: 7.5 },
  'Lagos Region': { center: [3.4, 6.5], zoom: 10 },
  'South South': { center: [6.0, 5.5], zoom: 7.5 },
  'South West': { center: [4.0, 7.0], zoom: 7.5 },
  'South East': { center: [7.5, 6.0], zoom: 8 },
  'North Central': { center: [7.5, 9.0], zoom: 7.5 },
  'North East': { center: [12.0, 10.5], zoom: 7 },
  'North West': { center: [6.0, 12.0], zoom: 7 },
  'West Africa': { center: [-2.0, 10.0], zoom: 4 },
  'East Africa': { center: [37.0, 0.0], zoom: 4 },
  'North Africa': { center: [15.0, 28.0], zoom: 4 },
  'Southern Africa': { center: [25.0, -15.0], zoom: 4 },
  'Africa': { center: [20.0, 5.0], zoom: 3 },
  'World': { center: [10.0, 20.0], zoom: 2 },
};

function getMapStyleUrl(mapStyle: string): string {
  switch (mapStyle) {
    case 'satellite': return 'mapbox://styles/mapbox/satellite-streets-v12';
    case 'light': return 'mapbox://styles/mapbox/light-v11';
    case 'dark': return 'mapbox://styles/mapbox/dark-v11';
    default: return 'mapbox://styles/mapbox/dark-v11';
  }
}

interface LiveMapProps {
  onOpenFilters?: () => void;
  darkMode?: boolean;
  onNavigateAlerts?: () => void;
  filters?: MapFilters;
}

const LiveMap: React.FC<LiveMapProps> = ({ onOpenFilters, darkMode = true, onNavigateAlerts, filters }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const facilityMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const satLayerReady = useRef(false);
  const pulseAnimRef = useRef<number | null>(null);
  const breatheAnimRef = useRef<number | null>(null);
  const qc = useQueryClient();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeBBox, setActiveBBox] = useState(NIGERIA_DEFAULT_BBOX);
  const viewportBBoxRef = useRef(NIGERIA_DEFAULT_BBOX);
  const [regionChanged, setRegionChanged] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [satelliteError, setSatelliteError] = useState<string | null>(null);
  const [activePlumeSource, setActivePlumeSource] = useState<string>('');
  const groundDataMapRef = useRef<Map<string, any[]>>(new Map());
  const [groundDataVersion, setGroundDataVersion] = useState(0);
  const scatterPopupRef = useRef<mapboxgl.Popup | null>(null);
  const groundPopupRef = useRef<mapboxgl.Popup | null>(null);
  const groundLayerReady = useRef(false);
  const { mapStyle, defaultRegion } = useSettingsStore();
  const mapFilters = filters ?? DEFAULT_FILTERS;
  const prevFiltersRef = useRef(mapFilters);
  const darkModeRef = useRef(darkMode);
  darkModeRef.current = darkMode;
  setBoundaryTheme(darkMode);
  const mapStyleRef = useRef(mapStyle);
  mapStyleRef.current = mapStyle;
  const filteredSatRef = useRef<any[]>([]);

  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showGridLegend, setShowGridLegend] = useState(true);
  const mapLayers = useDashboardStore((s) => s.mapLayers);
  const toggleMapLayer = useDashboardStore((s) => s.toggleMapLayer);
  const gridControls = useDashboardStore((s) => s.gridControls);
  const setGridControls = useDashboardStore((s) => s.setGridControls);
  const [mapZoom, setMapZoom] = useState<number>(7);
  const [styleReloadCount, setStyleReloadCount] = useState(0);

  useSocketUpdates();

  const facilityApiFilters = useMemo(() => {
    const f: Record<string, string> = {};
    if (mapFilters.state) f.state = mapFilters.state;
    if (mapFilters.lga) f.lga = mapFilters.lga;
    if (mapFilters.oilBlock) f.oilBlock = mapFilters.oilBlock;
    if (mapFilters.operator) f.operator = mapFilters.operator;
    if (mapFilters.facilityType) f.facilityType = mapFilters.facilityType;
    return Object.keys(f).length > 0 ? f : undefined;
  }, [mapFilters.state, mapFilters.lga, mapFilters.oilBlock, mapFilters.operator, mapFilters.facilityType]);

  const { data: facilities = [], isLoading: isLoadingFacilities } = useFacilities(facilityApiFilters);
  const { data: alerts = [], isLoading: isLoadingAlerts } = useAlerts();
  const { data: unreadCount = 0 } = useUnreadAlertCount();
  const markAllRead = useMarkAllAlertsRead();
  const { sources: globalSatSources, mergeSources } = useSatelliteStore();
  const satelliteFilters = {
    gasType: mapFilters.gasType,
    page: 1, limit: 100, bbox: activeBBox,
    ...(mapFilters.minEmissionRate > 0 ? { minEmissionRate: mapFilters.minEmissionRate } : {}),
    ...(mapFilters.maxEmissionRate < 20800 ? { maxEmissionRate: mapFilters.maxEmissionRate } : {}),
    ...(mapFilters.providers.length === 1 ? { provider: mapFilters.providers[0] } : {}),
  };
  const { data: satelliteData, isFetching: isFetchingSatellite } = useSatelliteSources(
    mapFilters.showSatellite ? satelliteFilters : { gasType: 'CH4', page: 1, limit: 100, bbox: activeBBox }
  );

  // Merge API response into global satellite store
  useEffect(() => {
    const raw = satelliteData as any;
    if (raw?.error) {
      setSatelliteError(raw.error);
    } else if (raw?.features?.length > 0) {
      setSatelliteError(null);
      mergeSources(raw.features, activeBBox);
    }
  }, [satelliteData, activeBBox, mergeSources]);

  // Force refetch satellite data when filters change via Done button
  useEffect(() => {
    if (prevFiltersRef.current !== mapFilters) {
      prevFiltersRef.current = mapFilters;
      setActiveBBox(viewportBBoxRef.current);
      qc.removeQueries({ queryKey: ['satellite-sources'] });
    }
  }, [mapFilters, qc]);

  const { data: groundData, isLoading: isLoadingGround } = useGroundData(selectedFacility?.id ?? '');

  const chartData = (groundData ?? []).map((gd: any) => ({
    date: new Date(gd.measurementDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
    rate: gd.methaneReading,
  }));

  const filteredFacilities = useMemo(() => {
    if (!mapFilters.showFacilities) return [];
    let result = facilities as any[];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((f: any) => f.name?.toLowerCase().includes(q) || f.sector?.toLowerCase().includes(q) || f.region?.toLowerCase().includes(q));
    }
    if (mapFilters.sectors.length > 0) {
      result = result.filter((f: any) => mapFilters.sectors.includes(f.sector ?? 'Oil & Gas'));
    }
    return result;
  }, [facilities, searchQuery, mapFilters.showFacilities, mapFilters.sectors]);

  // Defensive accessors — declared once here so both `filteredSatellite` (above) and
  // the grid logic (below) share a single computation. Persisted snapshots that
  // predate the v7 store migration can be missing these fields, so we guard.
  const providerSet = useMemo(
    () => new Set(gridControls.providers ?? []),
    [gridControls.providers],
  );
  const allProvidersSelected = providerSet.size === ALL_GRID_PROVIDERS.length;
  const instrumentsByProvider = gridControls.instrumentsByProvider ?? {};

  const filteredSatellite = useMemo(() => {
    if (!mapFilters.showSatellite) return [];
    let features: any[] = globalSatSources;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      features = features.filter((s: any) =>
        (s.name ?? s.source_name ?? '').toLowerCase().includes(q) ||
        (s.sector ?? '').toLowerCase().includes(q)
      );
    }
    if (mapFilters.sectors.length > 0) {
      features = features.filter((s: any) => mapFilters.sectors.some(sec => (s.sector ?? '').toLowerCase().includes(sec.toLowerCase())));
    }
    if (mapFilters.instruments.length > 0) {
      features = features.filter((s: any) => mapFilters.instruments.some(inst => (s.instrument ?? '').includes(inst)));
    }
    if (mapFilters.providers && mapFilters.providers.length > 0) {
      features = features.filter((s: any) => mapFilters.providers.includes(s.provider ?? 'carbon_mapper'));
    }
    // Source-legend parity: when the user unchecks a provider OR an individual
    // IMEO instrument in the grid legend, that source must disappear from the
    // map entirely — not just from the grid layer.
    features = features.filter((s: any) => {
      const provider = (s.provider ?? 'carbon_mapper') as GridProvider;
      if (!providerSet.has(provider)) return false;
      const allowedList = instrumentsByProvider[provider];
      if (allowedList == null) return true;
      if (allowedList.length === 0) return false;
      return allowedList.includes(normalizeInstrument(s.instrument));
    });
    features = features.filter((s: any) => {
      const rate = s.emissionRate ?? s.emission_rate ?? 0;
      const plumes = s.plumeCount ?? s.plume_count ?? 0;
      const persist = (s.persistence ?? 0) * 100;
      return rate >= mapFilters.minEmissionRate && rate <= mapFilters.maxEmissionRate
        && plumes >= mapFilters.minPlumes && plumes <= mapFilters.maxPlumes
        && persist >= mapFilters.minPersistence && persist <= mapFilters.maxPersistence;
    });
    return features;
  }, [globalSatSources, searchQuery, mapFilters, providerSet, instrumentsByProvider]);
  filteredSatRef.current = filteredSatellite;

  const totalSources = filteredFacilities.length + filteredSatellite.length;
  const totalPlumes = filteredSatellite.reduce((sum: number, s: any) => sum + (s.plumeCount ?? s.plume_count ?? 0), 0);

  // True when the backend returned features but our filter pipeline produced nothing.
  // Powers both the dev-mode diagnostic log AND the on-map "filtered to nothing" banner.
  const isFilteredToNothing = globalSatSources.length > 0 && filteredSatellite.length === 0;

  // Dev-only diagnostic: log every filter input when the filter pipeline drops all
  // sources so we can see exactly which control is responsible. Fires only on the
  // mismatch, so it never spams the console under normal use.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (!isFilteredToNothing) return;
    /* eslint-disable no-console */
    console.group(
      `%c[LiveMap] ${globalSatSources.length} sources in store, 0 after filtering`,
      'color:#f59e0b;font-weight:bold;',
    );
    console.log('mapFilters.showSatellite:', mapFilters.showSatellite);
    console.log('mapFilters.providers:', mapFilters.providers);
    console.log('gridControls.providers (legend toggles):', gridControls.providers);
    console.log('gridControls.instrumentsByProvider:', gridControls.instrumentsByProvider);
    console.log('emission-rate range:', mapFilters.minEmissionRate, '–', mapFilters.maxEmissionRate);
    console.log('plume-count range:', mapFilters.minPlumes, '–', mapFilters.maxPlumes);
    console.log('persistence range:', mapFilters.minPersistence, '–', mapFilters.maxPersistence);
    console.log('search query:', searchQuery || '(empty)');
    const sample = globalSatSources[0] as any;
    console.log('first source in store:', {
      provider: sample.provider,
      instrument: sample.instrument,
      emissionRate: sample.emissionRate ?? sample.emission_rate,
      plumeCount: sample.plumeCount ?? sample.plume_count,
      persistence: sample.persistence,
    });
    console.log('Tip: click "Reset filters" on the on-map banner to clear filters and restore defaults.');
    console.groupEnd();
    /* eslint-enable no-console */
  }, [
    isFilteredToNothing,
    globalSatSources,
    mapFilters.showSatellite,
    mapFilters.providers,
    mapFilters.minEmissionRate,
    mapFilters.maxEmissionRate,
    mapFilters.minPlumes,
    mapFilters.maxPlumes,
    mapFilters.minPersistence,
    mapFilters.maxPersistence,
    gridControls.providers,
    gridControls.instrumentsByProvider,
    searchQuery,
  ]);

  // Fetch ground data for all facilities to build ground scatter
  useEffect(() => {
    if (!filteredFacilities.length) return;
    let cancelled = false;
    (async () => {
      const newMap = new Map<string, any[]>();
      await Promise.all(
        filteredFacilities.map(async (f: any) => {
          try {
            const res = await emissionsApi.getGroundData(f.id);
            if (!cancelled && res.data) newMap.set(f.id, res.data);
          } catch { /* skip */ }
        })
      );
      if (cancelled) return;
      groundDataMapRef.current = newMap;
      setGroundDataVersion(v => v + 1);
      if (map.current && groundLayerReady.current) {
        updateGroundScatter(map.current, filteredFacilities, newMap);
      }
    })();
    return () => { cancelled = true; };
  }, [filteredFacilities]);

  // Search -> fly to matching location with breathing pulse
  useEffect(() => {
    if (!map.current || !mapLoaded || !searchQuery.trim()) {
      clearPulse();
      return;
    }
    const q = searchQuery.toLowerCase();
    const m = map.current;

    // Check facilities
    const matchedFacility = (facilities as any[]).find((f: any) =>
      f.name?.toLowerCase().includes(q) || f.region?.toLowerCase().includes(q)
    );
    if (matchedFacility) {
      flyToAndPulse(matchedFacility.longitude, matchedFacility.latitude);
      return;
    }

    // Check satellite sources
    const allSatFeatures: any[] = (satelliteData as any)?.features ?? [];
    const matchedSat = allSatFeatures.find((s: any) =>
      (s.name ?? s.source_name ?? '').toLowerCase().includes(q) || (s.sector ?? '').toLowerCase().includes(q)
    );
    if (matchedSat) {
      flyToAndPulse(matchedSat.longitude ?? matchedSat.lon, matchedSat.latitude ?? matchedSat.lat);
      return;
    }

    // Search boundary layers (oil blocks, states, LGAs) via GeoJSON sources
    const boundarySearchLayers = [
      { source: 'nigeria-oil-blocks-source', nameKey: 'name' },
      { source: 'nigeria-states-source', nameKey: 'shapeName' },
      { source: 'nigeria-lgas-source', nameKey: 'shapeName' },
    ];
    for (const { source, nameKey } of boundarySearchLayers) {
      const src = m.getSource(source) as mapboxgl.GeoJSONSource | undefined;
      if (!src) continue;
      try {
        const data = (src as any)._data;
        if (!data?.features) continue;
        const match = data.features.find((f: any) =>
          (f.properties?.[nameKey] ?? '').toLowerCase().includes(q)
        );
        if (match) {
          const coords = match.geometry?.coordinates;
          if (!coords) continue;
          const flat = match.geometry.type === 'Polygon' ? coords[0] : coords[0]?.[0] ?? coords[0];
          if (!flat?.length) continue;
          let cLng = 0, cLat = 0;
          for (const [ln, lt] of flat) { cLng += ln; cLat += lt; }
          cLng /= flat.length; cLat /= flat.length;
          flyToAndPulse(cLng, cLat);
          return;
        }
      } catch { /* source data not directly accessible, skip */ }
    }

    clearPulse();
  }, [searchQuery, mapLoaded, facilities, satelliteData]);

  function flyToAndPulse(lng: number, lat: number) {
    const m = map.current;
    if (!m) return;

    m.flyTo({ center: [lng, lat], zoom: 10, duration: 1500, essential: true });

    clearPulse();

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: {} }],
    };

    // Wait for flyTo to settle, then add pulse
    setTimeout(() => {
      if (!map.current) return;
      const mc = map.current;

      if (mc.getSource(PULSE_SOURCE)) {
        (mc.getSource(PULSE_SOURCE) as mapboxgl.GeoJSONSource).setData(geojson);
      } else {
        mc.addSource(PULSE_SOURCE, { type: 'geojson', data: geojson });
      }

      if (!mc.getLayer(PULSE_OUTER_LAYER)) {
        mc.addLayer({
          id: PULSE_OUTER_LAYER,
          type: 'circle',
          source: PULSE_SOURCE,
          paint: {
            'circle-radius': 40,
            'circle-color': '#009688',
            'circle-opacity': 0.15,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#009688',
            'circle-stroke-opacity': 0.3,
          },
        });
      }

      if (!mc.getLayer(PULSE_LAYER)) {
        mc.addLayer({
          id: PULSE_LAYER,
          type: 'circle',
          source: PULSE_SOURCE,
          paint: {
            'circle-radius': 20,
            'circle-color': '#009688',
            'circle-opacity': 0.3,
          },
        });
      }

      // Breathing animation
      let growing = true;
      let radius = 20;
      const animate = () => {
        if (!map.current?.getLayer(PULSE_LAYER)) return;
        radius += growing ? 0.5 : -0.5;
        if (radius >= 40) growing = false;
        if (radius <= 20) growing = true;
        map.current.setPaintProperty(PULSE_LAYER, 'circle-radius', radius);
        map.current.setPaintProperty(PULSE_LAYER, 'circle-opacity', 0.15 + (radius - 20) * 0.005);
        map.current.setPaintProperty(PULSE_OUTER_LAYER, 'circle-radius', radius + 20);
        map.current.setPaintProperty(PULSE_OUTER_LAYER, 'circle-opacity', 0.08 + (40 - radius) * 0.003);
        pulseAnimRef.current = requestAnimationFrame(animate);
      };
      pulseAnimRef.current = requestAnimationFrame(animate);
    }, 1600);
  }

  function clearPulse() {
    if (pulseAnimRef.current) {
      cancelAnimationFrame(pulseAnimRef.current);
      pulseAnimRef.current = null;
    }
    const m = map.current;
    if (!m) return;
    try {
      if (m.getLayer(PULSE_LAYER)) m.removeLayer(PULSE_LAYER);
      if (m.getLayer(PULSE_OUTER_LAYER)) m.removeLayer(PULSE_OUTER_LAYER);
      if (m.getSource(PULSE_SOURCE)) m.removeSource(PULSE_SOURCE);
    } catch { /* map destroyed */ }
  }

  const handleExportCSV = () => {
    if (!selectedFacility) return;
    let csvContent: string;

    if (selectedFacility.isSatellite) {
      csvContent = [
        'Source Name,Latitude,Longitude,Sector,Gas,Emission Rate (kg/hr),Plume Count,Persistence (%),Instrument,First Detected,Last Detected',
        [
          selectedFacility.name, selectedFacility.latitude, selectedFacility.longitude,
          selectedFacility.sector, 'CH4', selectedFacility.emissionRate ?? 0,
          selectedFacility.plumeCount ?? 0, ((selectedFacility.persistence ?? 0) * 100).toFixed(0),
          selectedFacility.instrument ?? '', selectedFacility.firstDetected ?? '', selectedFacility.lastDetected ?? '',
        ].join(','),
      ].join('\n');
    } else {
      csvContent = ['Date,Rate (kg/hr)', ...chartData.map((i: any) => `${i.date},${i.rate}`)].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `NOGIET_${selectedFacility.name || 'export'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareReport = () => {
    if (!selectedFacility) return;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('NOGIET Emission Report', 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Source: ${selectedFacility.name || 'N/A'}`, 14, 30);
    doc.text(`Date of Report: ${new Date().toLocaleDateString()}`, 14, 37);
    doc.text(`Coordinates: ${selectedFacility.latitude.toFixed(4)}, ${selectedFacility.longitude.toFixed(4)}`, 14, 44);

    if (selectedFacility.isSatellite) {
      autoTable(doc, {
        startY: 55,
        head: [['Field', 'Value']],
        body: [
          ['Source Name', selectedFacility.name],
          ['Sector', selectedFacility.sector],
          ['Emission Rate', (selectedFacility.emissionRate ?? 0) > 0 ? `${(selectedFacility.emissionRate ?? 0).toFixed(1)} kg/hr` : 'N/A'],
          ['Plume Count', String(selectedFacility.plumeCount ?? 0)],
          ['Persistence', `${((selectedFacility.persistence ?? 0) * 100).toFixed(0)}%`],
          ['Instrument', selectedFacility.instrument || 'N/A'],
          ['First Detected', selectedFacility.firstDetected || 'N/A'],
          ['Last Detected', selectedFacility.lastDetected || 'N/A'],
          ['Data Source', satelliteProviderAttribution(selectedFacility.satelliteProvider)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [251, 146, 60] },
      });
    } else {
      autoTable(doc, {
        startY: 55,
        head: [['Date', 'Emission Rate (kg/hr)']],
        body: chartData.map((item: any) => [item.date, `${item.rate} kg/hr`]),
        theme: 'striped',
        headStyles: { fillColor: [13, 148, 136] },
      });
    }

    doc.save(`NOGIET_Report_${selectedFacility.name || 'SOURCE'}.pdf`);
  };

  const handleFacilityClick = useCallback((facility: FacilityData) => {
    setSelectedFacility(facility);
    setIsExpanded(false);
  }, []);

  const handleRefreshRegion = useCallback(() => {
    if (!map.current) return;
    const b = map.current.getBounds();
    const bbox = snapBBox(b.getWest(), b.getSouth(), b.getEast(), b.getNorth());
    viewportBBoxRef.current = bbox;
    setRegionChanged(false);
    // Update activeBBox → triggers useSatelliteSources GET with new bbox
    // Backend returns cached data filtered to this viewport (fast)
    // Result merges into the global Zustand store automatically via the useEffect
    setActiveBBox(bbox);
  }, []);

  // Latest grid GeoJSON kept in a ref so the stable rebuildAllLayers can re-attach it
  // after a Mapbox style swap (style change wipes all sources/layers, so we need to
  // recreate them from scratch — including the emissions grid the user wants persisted).
  const gridGeoJSONRef = useRef<ReturnType<typeof buildEmissionGrid> | null>(null);

  const rebuildAllLayers = useCallback((m: mapboxgl.Map) => {
    if (breatheAnimRef.current) { cancelAnimationFrame(breatheAnimRef.current); breatheAnimRef.current = null; }
    satLayerReady.current = false;
    groundLayerReady.current = false;
    try {
      initSatelliteLayers(m);
      updateSatelliteSource(m, filteredSatRef.current);
    } catch { /* ignore */ }
    setStyleReloadCount(c => c + 1);

    const layers = useDashboardStore.getState().mapLayers;
    const isDark = mapStyleRef.current !== 'light';
    if (layers.oilBlocks) addOilBlocksLayer(m, undefined, isDark);
    if (layers.states) addStatesLayer(m, undefined, isDark);
    if (layers.lgas) addLGAsLayer(m, undefined, isDark);
    if (layers.pipelines) addPipelinesLayer(m, undefined, isDark);

    // Re-attach the square emissions grid (style swap removed it from the map).
    if (layers.emissionGrid && gridGeoJSONRef.current) {
      try {
        const beforeId = m.getLayer(SAT_LAYER_GLOW) ? SAT_LAYER_GLOW : undefined;
        addEmissionGridLayer(m, gridGeoJSONRef.current as any, { darkMode: isDark, beforeLayerId: beforeId });
      } catch { /* ignore */ }
    }
  }, []);

  const styleInitRef = useRef(false);
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;
    if (!styleInitRef.current) {
      styleInitRef.current = true;
      return;
    }
    m.once('style.load', () => rebuildAllLayers(m));
    m.setStyle(getMapStyleUrl(mapStyle));
  }, [mapStyle, mapLoaded, rebuildAllLayers]);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    if (!mapboxgl.accessToken) { setError('Mapbox access token is missing.'); return; }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: getMapStyleUrl(mapStyle),
        center: (REGION_COORDS[defaultRegion] ?? REGION_COORDS['Niger Delta']).center,
        zoom: (REGION_COORDS[defaultRegion] ?? REGION_COORDS['Niger Delta']).zoom,
        attributionControl: false, failIfMajorPerformanceCaveat: false, preserveDrawingBuffer: true,
      });

      const m = map.current;
      m.on('load', () => {
        setMapLoaded(true);
        initSatelliteLayers(m);
        setupSatelliteClickHandler(m);
        setupHoverConnectors(m);

        const layers = useDashboardStore.getState().mapLayers;
        const isDark = mapStyleRef.current !== 'light';
        if (layers.oilBlocks) addOilBlocksLayer(m, undefined, isDark);
        if (layers.states) addStatesLayer(m, undefined, isDark);
        if (layers.lgas) addLGAsLayer(m, undefined, isDark);
        if (layers.pipelines) addPipelinesLayer(m, undefined, isDark);
      });

      m.on('error', (e) => {
        const msg = e.error?.message ?? '';
        if (msg.includes('token')) setError('Invalid Mapbox access token.');
        else console.warn('[Mapbox]', msg);
      });

      m.on('moveend', () => {
        if (!map.current) return;
        const bounds = map.current.getBounds();
        const snapped = snapBBox(bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth());
        if (viewportBBoxRef.current !== snapped) {
          viewportBBoxRef.current = snapped;
          setRegionChanged(true);
        }
      });

      m.on('zoomend', () => {
        if (!map.current) return;
        setMapZoom(Math.round(map.current.getZoom() * 10) / 10);
      });
    } catch { setError('Failed to create Mapbox instance.'); }
    return () => {
      if (breatheAnimRef.current) { cancelAnimationFrame(breatheAnimRef.current); breatheAnimRef.current = null; }
      uninstallBoundaryHover();
      map.current?.remove(); map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    updateSatelliteSource(map.current, filteredSatellite);
  }, [mapLoaded, filteredSatellite]);

  // Toggle emission hotspot layers based on mapLayers state
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;
    const vis = mapLayers.emissionHotspots ? 'visible' : 'none';
    [SAT_LAYER_GLOW, SAT_LAYER_POINT, SAT_LAYER_LABEL, SAT_COUNT_LABEL, SCATTER_HAZE, SCATTER_GLOW, SCATTER_DOT].forEach(id => {
      if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', vis);
    });
  }, [mapLoaded, mapLayers.emissionHotspots]);

  // ----- Square emissions grid (ppb-themed cells) -----
  // `providerSet` / `instrumentsByProvider` declared once above (used by both the
  // grid AND the satellite-point filter so the legend's checkboxes drive both).

  /**
   * Discover every (provider, instrument) pair returned by the API for the current viewport,
   * with point counts. No truncation — every distinct instrument is exposed to the legend so
   * the user can pick precisely which ones drive the grid.
   */
  const providerSourceSummaries = useMemo<ProviderSourcesSummary[]>(() => {
    const counts: Record<GridProvider, Map<string, number>> = {
      carbon_mapper: new Map(),
      imeo: new Map(),
      tropomi: new Map(),
    };
    for (const s of filteredSatellite) {
      const prov = (s.provider ?? 'carbon_mapper') as GridProvider;
      if (!counts[prov]) continue;
      const inst = normalizeInstrument(s.instrument ?? null);
      counts[prov].set(inst, (counts[prov].get(inst) ?? 0) + 1);
    }
    return ALL_GRID_PROVIDERS.map<ProviderSourcesSummary>((provider) => {
      const map = counts[provider];
      const instruments: ProviderInstrumentSummary[] = [...map.entries()]
        .sort(([, a], [, b]) => b - a)
        .map(([instrument, count]) => ({
          instrument,
          shortLabel: shortInstrument(instrument),
          color: feedColor(provider, instrument),
          count,
        }));
      const totalCount = instruments.reduce((acc, i) => acc + i.count, 0);
      return { provider, totalCount, instruments };
    });
  }, [filteredSatellite]);

  const isInstrumentAllowed = useCallback(
    (provider: GridProvider, instrumentRaw: string | null | undefined): boolean => {
      const list = instrumentsByProvider?.[provider];
      if (list == null) return true; // null/undefined = all allowed
      if (list.length === 0) return false; // explicit empty = block everything
      return list.includes(normalizeInstrument(instrumentRaw));
    },
    [instrumentsByProvider],
  );

  const gridPoints = useMemo<EmissionPoint[]>(() => {
    const pts: EmissionPoint[] = [];
    if (providerSet.size === 0) return pts;

    for (const s of filteredSatellite) {
      const prov = (s.provider ?? 'carbon_mapper') as GridProvider;
      if (!providerSet.has(prov)) continue;
      if (!isInstrumentAllowed(prov, s.instrument)) continue;
      pts.push({
        longitude: s.longitude ?? s.lon,
        latitude: s.latitude ?? s.lat,
        emissionRate: s.emissionRate ?? s.emission_rate ?? 0,
        provider: prov,
        sourceId: s.id,
      });
    }

    // Include ground facilities only when all satellite providers are visible
    // (matches "All sources" semantics from the previous dropdown).
    if (allProvidersSelected) {
      for (const f of filteredFacilities) {
        const measurements: any[] = groundDataMapRef.current.get(f.id) ?? [];
        const maxReading = measurements.reduce((mx: number, gd: any) => Math.max(mx, gd.methaneReading ?? 0), 0);
        if (!Number.isFinite(f.latitude) || !Number.isFinite(f.longitude)) continue;
        pts.push({
          longitude: f.longitude,
          latitude: f.latitude,
          emissionRate: maxReading,
          provider: 'ground',
          sourceId: f.id,
        });
      }
    }

    return pts;
    // groundDataVersion captures ground data updates (mutating ref)
  }, [filteredSatellite, filteredFacilities, providerSet, allProvidersSelected, isInstrumentAllowed, groundDataVersion]);

  /**
   * Compact "Carbon Mapper · EMIT 14 · IMEO · EnMAP 12 · S-2 5 · GHGSat 3 · TROPOMI 8"
   * Lists every selected provider and every selected instrument under it.
   * No truncation — the user explicitly asked to see all sources from the API.
   */
  const instrumentBreakdown = useMemo(() => {
    const parts: string[] = [];
    for (const summary of providerSourceSummaries) {
      if (!providerSet.has(summary.provider)) continue;
      const allowed = summary.instruments.filter((i) => isInstrumentAllowed(summary.provider, i.instrument));
      if (allowed.length === 0) continue;
      const items = allowed.map((i) => `${i.shortLabel} ${i.count}`).join(' · ');
      parts.push(items);
    }
    return parts.length > 0 ? parts.join('  ·  ') : undefined;
  }, [providerSourceSummaries, providerSet, isInstrumentAllowed]);

  const gridGeoJSON = useMemo(() => {
    const cellDeg = cellDegForZoom(mapZoom);
    return buildEmissionGrid(gridPoints, {
      cellDeg,
      statistic: gridControls.statistic,
      alertThresholdKgHr: gridControls.showAlerts ? gridControls.alertThresholdKgHr : Infinity,
    });
  }, [gridPoints, mapZoom, gridControls.statistic, gridControls.showAlerts, gridControls.alertThresholdKgHr]);

  // Keep a ref to the latest grid so rebuildAllLayers (after a style swap) can restore it.
  useEffect(() => {
    gridGeoJSONRef.current = gridGeoJSON;
  }, [gridGeoJSON]);

  // Mount/update/remove the grid in Mapbox
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;

    if (!mapLayers.emissionGrid) {
      removeEmissionGridLayer(m);
      return;
    }

    const beforeId = m.getLayer(SAT_LAYER_GLOW) ? SAT_LAYER_GLOW : undefined;
    addEmissionGridLayer(m, gridGeoJSON as any, { darkMode, beforeLayerId: beforeId });
    updateEmissionGridLayer(m, gridGeoJSON as any);
  }, [mapLoaded, mapLayers.emissionGrid, gridGeoJSON, darkMode]);

  // Theme-react when dark mode changes
  useEffect(() => {
    const m = map.current;
    if (m && mapLoaded) setEmissionGridTheme(m, darkMode);
  }, [darkMode, mapLoaded]);

  // Click on a grid cell → zoom in to drill-in
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;

    const handler = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      const f = e.features?.[0];
      if (!f) return;
      const props = f.properties as Record<string, any> | null;
      if (!props) return;
      const west = Number(props.west), east = Number(props.east), south = Number(props.south), north = Number(props.north);
      if ([west, east, south, north].some((v) => !Number.isFinite(v))) return;
      m.fitBounds([[west, south], [east, north]], { padding: 80, duration: 500, maxZoom: 11.5 });
    };

    const cursorEnter = () => { m.getCanvas().style.cursor = 'pointer'; };
    const cursorLeave = () => { m.getCanvas().style.cursor = ''; };

    m.on('click', EMISSION_GRID_FILL, handler);
    m.on('mouseenter', EMISSION_GRID_FILL, cursorEnter);
    m.on('mouseleave', EMISSION_GRID_FILL, cursorLeave);
    return () => {
      m.off('click', EMISSION_GRID_FILL, handler);
      m.off('mouseenter', EMISSION_GRID_FILL, cursorEnter);
      m.off('mouseleave', EMISSION_GRID_FILL, cursorLeave);
    };
  }, [mapLoaded]);

  // Oil Blocks layer (real boundary data from GeoJSON)
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;
    const isDark = mapStyleRef.current !== 'light';
    try {
      if (mapLayers.oilBlocks) {
        addOilBlocksLayer(m, undefined, isDark);
      } else {
        removeOilBlocksLayer(m);
      }
    } catch { /* map destroyed */ }
  }, [mapLoaded, mapLayers.oilBlocks, styleReloadCount]);

  // --- Boundary layers: only respond to checkbox toggles ---
  // Style reloads are handled by onStyleData directly (no effect race).
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;
    const isDark = mapStyleRef.current !== 'light';
    try {
      if (mapLayers.states) {
        addStatesLayer(m, undefined, isDark);
      } else {
        removeStatesLayer(m);
      }
    } catch { /* map destroyed */ }
  }, [mapLoaded, mapLayers.states]);

  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;
    const isDark = mapStyleRef.current !== 'light';
    try {
      if (mapLayers.lgas) {
        addLGAsLayer(m, undefined, isDark);
      } else {
        removeLGAsLayer(m);
      }
    } catch { /* map destroyed */ }
  }, [mapLoaded, mapLayers.lgas]);

  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;
    const isDark = mapStyleRef.current !== 'light';
    try {
      if (mapLayers.pipelines) {
        addPipelinesLayer(m, undefined, isDark);
      } else {
        removePipelinesLayer(m);
      }
    } catch { /* map destroyed */ }
  }, [mapLoaded, mapLayers.pipelines]);

  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    facilityMarkersRef.current.forEach((m) => m.remove());
    facilityMarkersRef.current = [];

    // Decide how to render the oil-station icon per basemap so it always stays
    // legible. The map style is the source of truth (the dashboard `darkMode`
    // toggle only affects UI chrome, not the basemap):
    //   - light     → render the original colored artwork
    //   - dark      → recolor to a white silhouette
    //   - satellite → recolor to a gold-yellow silhouette
    // We use CSS `mask-image` + `background-color` instead of brightness/invert
    // filters so we can pick *any* exact color (gold can't be reached cleanly
    // from a brightness/invert chain).
    const basemap: 'light' | 'satellite' | 'dark' =
      mapStyle === 'light' ? 'light' :
      mapStyle === 'satellite' ? 'satellite' :
      'dark';
    const iconColor =
      basemap === 'satellite' ? '#fbbf24' :   // amber-400
      basemap === 'dark' ? '#ffffff' :
      null;                                    // light → keep original artwork
    const labelColor =
      basemap === 'light' ? '#0f766e' :
      basemap === 'satellite' ? '#fde047' :    // yellow-300
      '#e5e7eb';
    const labelShadow = basemap === 'light'
      ? '0 1px 2px rgba(255,255,255,0.8)'
      : '0 1px 2px rgba(0,0,0,0.85)';
    const iconShadow = basemap === 'light'
      ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))'
      : 'drop-shadow(0 2px 4px rgba(0,0,0,0.55))';

    filteredFacilities.forEach((f: any) => {
      const gdCount = groundDataMapRef.current.get(f.id)?.length ?? 0;
      const facility: FacilityData = {
        id: f.id, name: f.name, latitude: f.latitude, longitude: f.longitude,
        sector: f.sector ?? 'Oil & Gas', region: f.region,
        plumeCount: gdCount,
      };
      const el = document.createElement('div');
      const iconSize = gdCount > 0 ? Math.min(32 + gdCount * 2, 48) : 32;
      el.style.cssText = 'width:56px;height:56px;display:flex;align-items:center;justify-content:center;cursor:pointer;pointer-events:auto;';
      const countLabel = gdCount > 0
        ? `<span style="position:absolute;top:-4px;right:-4px;min-width:16px;height:16px;background:#6366f1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:white;z-index:4;padding:0 3px;border:1.5px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);">${gdCount}</span>`
        : '';
      const iconMarkup = iconColor
        ? `<div role="img" aria-label="Oil facility" style="width:100%;height:100%;background-color:${iconColor};-webkit-mask:url(${oilStationIcon}) center/contain no-repeat;mask:url(${oilStationIcon}) center/contain no-repeat;pointer-events:none;filter:${iconShadow};"></div>`
        : `<img src="${oilStationIcon}" alt="Oil facility" style="width:100%;height:100%;object-fit:contain;pointer-events:none;filter:${iconShadow};" draggable="false" />`;
      el.innerHTML = `<div class="fac-inner" style="position:relative;display:flex;align-items:center;justify-content:center;transition:transform 0.15s ease;"><div style="width:${iconSize}px;height:${iconSize}px;position:relative;z-index:2;display:flex;align-items:center;justify-content:center;">${iconMarkup}${countLabel}</div><span style="position:absolute;top:100%;margin-top:4px;font-size:10px;font-weight:700;color:${labelColor};white-space:nowrap;pointer-events:none;text-shadow:${labelShadow};">${f.name}</span></div>`;
      el.addEventListener('click', (e) => { e.stopPropagation(); handleFacilityClick(facility); });
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat([f.longitude, f.latitude]).addTo(map.current!);
      facilityMarkersRef.current.push(marker);
    });

    // Scale facility DOM markers with zoom (floor at 0.5 so they never disappear)
    const m = map.current!;
    const scaleFacMarkers = () => {
      const z = m.getZoom();
      const s = Math.max(0.5, Math.min(1.6, 0.25 + z * 0.11));
      facilityMarkersRef.current.forEach((mk) => {
        const inner = mk.getElement().querySelector('.fac-inner') as HTMLElement | null;
        if (inner) inner.style.transform = `scale(${s})`;
      });
    };
    scaleFacMarkers();
    m.on('zoom', scaleFacMarkers);
    return () => { m.off('zoom', scaleFacMarkers); };
  }, [mapLoaded, filteredFacilities, darkMode, mapStyle, handleFacilityClick, groundDataVersion]);

  // Highlight plumes/measurements around selected source with connecting lines
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded) return;

    clearPlumeLayers(m);
    clearHoverConnectors(m);

    if (!selectedFacility) return;

    const sourceLng = selectedFacility.longitude;
    const sourceLat = selectedFacility.latitude;
    const isSat = selectedFacility.isSatellite;

    const lineFeatures: GeoJSON.Feature[] = [];
    const pointFeatures: GeoJSON.Feature[] = [];

    if (isSat && activePlumeSource) {
      const plumeCount = selectedFacility.plumeCount ?? 0;
      if (plumeCount <= 0) return;

      const srcIdx = filteredSatellite.findIndex((s: any) => (s.name ?? s.source_name) === activePlumeSource);
      const seed = srcIdx >= 0 ? srcIdx : 0;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const maxR = 0.02 + Math.min(plumeCount, 20) * 0.002;
      const baseRate = selectedFacility.emissionRate ?? 0;

      for (let i = 0; i < plumeCount; i++) {
        const angle = i * goldenAngle + seededRand(seed * 100) * Math.PI * 2;
        const r = maxR * Math.sqrt((i + 1) / plumeCount);
        const jitter = seededRand(seed * 1000 + i * 7) * 0.004;
        const pLng = sourceLng + (r + jitter) * Math.cos(angle);
        const pLat = sourceLat + (r + jitter) * Math.sin(angle);
        const rateVar = 0.4 + seededRand(seed * 500 + i * 13) * 1.2;

        pointFeatures.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [pLng, pLat] },
          properties: { idx: i + 1, total: plumeCount, rate: Math.round(baseRate * rateVar * 10) / 10 },
        });
        lineFeatures.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [[sourceLng, sourceLat], [pLng, pLat]] },
          properties: {},
        });
      }
    } else if (!isSat) {
      const measurements = groundDataMapRef.current.get(selectedFacility.id) ?? [];
      if (measurements.length === 0) return;

      // Use the same index as buildGroundScatterGeoJSON so dots stay in the same position
      const allFacs = filteredFacilities as any[];
      const fIdx = allFacs.findIndex((f: any) => f.id === selectedFacility.id);
      const seed = fIdx >= 0 ? fIdx : 0;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const maxR = 0.015 + Math.min(measurements.length, 15) * 0.002;

      measurements.forEach((gd: any, i: number) => {
        const hasRealCoords = typeof gd.latitude === 'number' && typeof gd.longitude === 'number';
        let pLng: number, pLat: number;
        if (hasRealCoords) {
          pLng = gd.longitude;
          pLat = gd.latitude;
        } else {
          const angle = i * goldenAngle + seededRand(seed * 100) * Math.PI * 2;
          const r = maxR * Math.sqrt((i + 1) / measurements.length);
          const jitter = seededRand(seed * 1000 + i * 7) * 0.003;
          pLng = sourceLng + (r + jitter) * Math.cos(angle);
          pLat = sourceLat + (r + jitter) * Math.sin(angle);
        }

        pointFeatures.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [pLng, pLat] },
          properties: { idx: i + 1, total: measurements.length, rate: gd.methaneReading ?? 0 },
        });
        lineFeatures.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [[sourceLng, sourceLat], [pLng, pLat]] },
          properties: {},
        });
      });
    } else {
      return;
    }

    if (pointFeatures.length === 0) return;

    const color = isSat ? '#fbbf24' : '#2dd4bf';
    const lineColor = isSat ? '#f59e0b' : '#14b8a6';
    const geojson: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [...lineFeatures, ...pointFeatures] };

    scatterPopupRef.current?.remove();
    groundPopupRef.current?.remove();
    [SCATTER_DOT, SCATTER_GLOW, SCATTER_HAZE, GROUND_SCATTER_DOT, GROUND_SCATTER_GLOW, GROUND_SCATTER_HAZE].forEach(id => {
      if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', 'none');
    });

    // Hide nearby sources (~200km) so plumes/measurements are unobstructed
    const R = 1.8;
    const lnMin = sourceLng - R, lnMax = sourceLng + R;
    const ltMin = sourceLat - R, ltMax = sourceLat + R;

    // "outside box" = NOT (lon>=lnMin AND lon<=lnMax AND lat>=ltMin AND lat<=ltMax)
    const outsideBox: mapboxgl.Expression = ['any',
      ['<', ['get', 'lon'], lnMin], ['>', ['get', 'lon'], lnMax],
      ['<', ['get', 'lat'], ltMin], ['>', ['get', 'lat'], ltMax],
    ];

    const satKeepFilter: mapboxgl.Expression = isSat
      ? ['any', ['==', ['get', 'source_name'], activePlumeSource], outsideBox]
      : outsideBox;

    [SAT_LAYER_POINT, SAT_LAYER_GLOW, SAT_COUNT_LABEL].forEach(id => {
      if (m.getLayer(id)) m.setFilter(id, satKeepFilter);
    });
    if (m.getLayer(SAT_LAYER_LABEL)) {
      m.setFilter(SAT_LAYER_LABEL, isSat
        ? ['==', ['get', 'source_name'], activePlumeSource]
        : satKeepFilter);
    }

    // Facility DOM markers: fade out those within radius (except the clicked one)
    facilityMarkersRef.current.forEach(mk => {
      const { lng, lat } = mk.getLngLat();
      const dist = Math.sqrt(Math.pow(lng - sourceLng, 2) + Math.pow(lat - sourceLat, 2));
      const el = mk.getElement();
      const isClickedFacility = !isSat && Math.abs(lng - sourceLng) < 0.0001 && Math.abs(lat - sourceLat) < 0.0001;
      if (dist < R && !isClickedFacility) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      }
    });

    m.addSource(PLUME_SOURCE, { type: 'geojson', data: geojson });

    m.addLayer({
      id: PLUME_LAYER_LINE, type: 'line', source: PLUME_SOURCE,
      filter: ['==', '$type', 'LineString'],
      paint: { 'line-color': lineColor, 'line-width': 1.5, 'line-opacity': 0.4, 'line-dasharray': [2, 4] },
    });

    m.addLayer({
      id: PLUME_LAYER_GLOW, type: 'circle', source: PLUME_SOURCE,
      filter: ['==', '$type', 'Point'],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 12, 10, 18, 14, 24],
        'circle-color': color, 'circle-opacity': 0.2, 'circle-blur': 0.9,
      },
    });

    m.addLayer({
      id: PLUME_LAYER_DOT, type: 'circle', source: PLUME_SOURCE,
      filter: ['==', '$type', 'Point'],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 4.5, 10, 7, 14, 10],
        'circle-color': color, 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff',
      },
    });

    const hlPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 10, className: isSat ? 'plume-popup' : 'plume-popup ground-popup' });
    m.on('mouseenter', PLUME_LAYER_DOT, (e) => {
      m.getCanvas().style.cursor = 'pointer';
      if (!e.features?.length) return;
      const p = e.features[0].properties!;
      const coords = (e.features[0].geometry as GeoJSON.Point).coordinates.slice() as [number, number];
      const label = isSat ? 'Plume' : 'Measurement';
      const rateStr = Number(p.rate) > 0 ? `${Number(p.rate).toFixed(1)} kg/hr` : 'N/A';
      hlPopup.setLngLat(coords)
        .setHTML(`<div style="font-size:11px;font-weight:600;line-height:1.6;padding:2px 0;"><div style="color:${color};">${label} ${p.idx} of ${p.total}</div><div style="color:#e2e8f0;">${rateStr}</div><div style="color:#94a3b8;font-size:10px;">${coords[1].toFixed(5)}° N, ${coords[0].toFixed(5)}° E</div></div>`)
        .addTo(m);
    });
    m.on('mouseleave', PLUME_LAYER_DOT, () => { m.getCanvas().style.cursor = ''; hlPopup.remove(); });

    if (pointFeatures.length > 1) {
      m.flyTo({ center: [sourceLng, sourceLat], zoom: Math.max(m.getZoom(), 10), duration: 800 });
    }
  }, [activePlumeSource, selectedFacility, mapLoaded, filteredSatellite, filteredFacilities]);

  // Clear plumes when deselecting a source
  useEffect(() => {
    if (!selectedFacility) {
      setActivePlumeSource('');
      if (map.current) clearPlumeLayers(map.current);
    }
  }, [selectedFacility]);

  function clearPlumeLayers(m: mapboxgl.Map) {
    try {
      [PLUME_LAYER_DOT, PLUME_LAYER_GLOW, PLUME_LAYER_LINE].forEach(id => {
        if (m.getLayer(id)) m.removeLayer(id);
      });
      if (m.getSource(PLUME_SOURCE)) m.removeSource(PLUME_SOURCE);
      [SCATTER_DOT, SCATTER_GLOW, SCATTER_HAZE, GROUND_SCATTER_DOT, GROUND_SCATTER_GLOW, GROUND_SCATTER_HAZE].forEach(id => {
        if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', 'visible');
      });
      [SAT_LAYER_POINT, SAT_LAYER_GLOW, SAT_COUNT_LABEL].forEach(id => {
        if (m.getLayer(id)) m.setFilter(id, null);
      });
      if (m.getLayer(SAT_COUNT_LABEL)) m.setFilter(SAT_COUNT_LABEL, ['>', ['get', 'plume_count'], 1]);
      if (m.getLayer(SAT_LAYER_LABEL)) m.setFilter(SAT_LAYER_LABEL, null);
    } catch { /* map destroyed */ }
    facilityMarkersRef.current.forEach(mk => {
      const el = mk.getElement();
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
    });
  }

  function cleanupAllSatLayers(m: mapboxgl.Map) {
    try {
      [GROUND_SCATTER_DOT, GROUND_SCATTER_GLOW, GROUND_SCATTER_HAZE, SCATTER_DOT, SCATTER_GLOW, SCATTER_HAZE, SAT_LAYER_LABEL, SAT_COUNT_LABEL, SAT_LAYER_POINT, SAT_LAYER_GLOW].forEach(id => {
        if (m.getLayer(id)) m.removeLayer(id);
      });
      if (m.getSource(GROUND_SCATTER_SRC)) m.removeSource(GROUND_SCATTER_SRC);
      if (m.getSource(SCATTER_SOURCE)) m.removeSource(SCATTER_SOURCE);
      if (m.getSource(SAT_SOURCE_ID)) m.removeSource(SAT_SOURCE_ID);
    } catch { /* map destroyed */ }
    groundLayerReady.current = false;
  }

  function updateGroundScatter(m: mapboxgl.Map, facs: any[], gdMap: Map<string, any[]>) {
    const src = m.getSource(GROUND_SCATTER_SRC) as mapboxgl.GeoJSONSource | undefined;
    if (src) {
      src.setData(buildGroundScatterGeoJSON(facs, gdMap));
    }
  }

  function initSatelliteLayers(m: mapboxgl.Map) {
    if (satLayerReady.current) return;
    if (m.getSource(SAT_SOURCE_ID)) return;

    m.addSource(SAT_SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    m.addSource(SCATTER_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    // Scatter haze: large soft cloud visible at low zoom, clusters tight
    // Plume scatter dots inherit their parent source's color so each plume halo
    // visually belongs to the satellite that detected it.
    const plumeColorExpr: mapboxgl.Expression = ['get', 'feed_color'];

    m.addLayer({
      id: SCATTER_HAZE, type: 'circle', source: SCATTER_SOURCE,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 4, 7, 8, 10, 14, 13, 22],
        'circle-color': plumeColorExpr,
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.25, 7, 0.18, 10, 0.12, 13, 0.08],
        'circle-blur': ['interpolate', ['linear'], ['zoom'], 4, 1.4, 7, 1, 10, 0.6, 13, 0.3],
      },
    });

    m.addLayer({
      id: SCATTER_GLOW, type: 'circle', source: SCATTER_SOURCE,
      minzoom: 7,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 5, 10, 10, 13, 16],
        'circle-color': plumeColorExpr,
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.06, 10, 0.12, 13, 0.18],
        'circle-blur': 0.7,
      },
    });

    m.addLayer({
      id: SCATTER_DOT, type: 'circle', source: SCATTER_SOURCE,
      minzoom: 7.5,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 7.5, 1.5, 10, 3.5, 13, 5.5],
        'circle-color': plumeColorExpr,
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7.5, 0.3, 9, 0.6, 12, 0.85],
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 7.5, 0, 10, 0.8, 13, 1.5],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-opacity': ['interpolate', ['linear'], ['zoom'], 7.5, 0, 10, 0.3, 13, 0.6],
      },
    });

    // Per-source fill color: provider canonical for CM/TROPOMI, instrument-hashed
    // palette for IMEO. The value is precomputed by `feedColor()` and embedded as
    // `feed_color` on each GeoJSON feature so the legend, the chart, and the map
    // markers all stay in sync.
    const sourceColorExpr: mapboxgl.Expression = ['get', 'feed_color'];

    // Glow halo intensity now encodes emission rate (so we keep that signal visible
    // alongside the source-colored fill).
    const emissionGlowOpacityExpr: mapboxgl.Expression = [
      'interpolate', ['linear'], ['get', 'emission_rate'],
      0,    0.05,
      50,   0.15,
      200,  0.25,
      500,  0.35,
      1000, 0.45,
    ];

    // Main source glow: ambient halo — sized by plume_count, lit by emission_rate
    m.addLayer({
      id: SAT_LAYER_GLOW, type: 'circle', source: SAT_SOURCE_ID,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'],
          3, ['interpolate', ['exponential', 1.5], ['get', 'plume_count'], 0, 7, 1, 10, 5, 17, 10, 22, 20, 29],
          6, ['interpolate', ['exponential', 1.5], ['get', 'plume_count'], 0, 10, 1, 15, 5, 25, 10, 33, 20, 44],
          9, ['interpolate', ['exponential', 1.5], ['get', 'plume_count'], 0, 14, 1, 20, 5, 34, 10, 44, 20, 58],
          12, ['interpolate', ['exponential', 1.5], ['get', 'plume_count'], 0, 18, 1, 26, 5, 44, 10, 57, 20, 75],
        ],
        'circle-color': sourceColorExpr,
        'circle-opacity': emissionGlowOpacityExpr,
        'circle-blur': 1,
      },
    });

    // Main source dot — fill = source color, stroke = white (or near-white in dark mode)
    m.addLayer({
      id: SAT_LAYER_POINT, type: 'circle', source: SAT_SOURCE_ID,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'],
          3, ['interpolate', ['exponential', 1.5], ['get', 'plume_count'], 0, 3, 1, 4, 5, 7, 10, 8, 20, 10],
          6, ['interpolate', ['exponential', 1.5], ['get', 'plume_count'], 0, 5, 1, 6, 5, 10, 10, 12, 20, 15],
          9, ['interpolate', ['exponential', 1.5], ['get', 'plume_count'], 0, 6, 1, 8, 5, 13, 10, 16, 20, 20],
          12, ['interpolate', ['exponential', 1.5], ['get', 'plume_count'], 0, 8, 1, 10, 5, 17, 10, 21, 20, 26],
        ],
        'circle-color': sourceColorExpr,
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 3, 0.8, 7, 1.5, 12, 2],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-opacity': 0.9,
      },
    });

    // Plume count number centered inside source dot (only if > 1) — zoom responsive
    m.addLayer({
      id: SAT_COUNT_LABEL, type: 'symbol', source: SAT_SOURCE_ID,
      filter: ['>', ['get', 'plume_count'], 1],
      layout: {
        'text-field': ['to-string', ['get', 'plume_count']],
        'text-size': ['interpolate', ['linear'], ['zoom'],
          3, ['interpolate', ['exponential', 1.5], ['get', 'plume_count'], 1, 5, 5, 6, 10, 7, 20, 8],
          6, ['interpolate', ['exponential', 1.5], ['get', 'plume_count'], 1, 7, 5, 9, 10, 10, 20, 11],
          9, ['interpolate', ['exponential', 1.5], ['get', 'plume_count'], 1, 9, 5, 11, 10, 12, 20, 14],
          12, ['interpolate', ['exponential', 1.5], ['get', 'plume_count'], 1, 11, 5, 14, 10, 15, 20, 17],
        ],
        'text-anchor': 'center',
        'text-allow-overlap': true,
        'text-ignore-placement': true,
        'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
      },
      paint: {
        'text-color': '#ffffff',
        'text-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.85, 6, 1],
      },
    });

    // Source name label (zoomed in)
    m.addLayer({
      id: SAT_LAYER_LABEL, type: 'symbol', source: SAT_SOURCE_ID, minzoom: 9,
      layout: { 'text-field': ['get', 'source_name'], 'text-size': 10, 'text-offset': [0, 2.2], 'text-anchor': 'top', 'text-max-width': 12 },
      paint: { 'text-color': '#fb923c', 'text-halo-color': 'rgba(0,0,0,0.7)', 'text-halo-width': 1 },
    });

    m.on('mouseenter', SAT_LAYER_POINT, () => { m.getCanvas().style.cursor = 'pointer'; });
    m.on('mouseleave', SAT_LAYER_POINT, () => { m.getCanvas().style.cursor = ''; });

    // Hover popup on scatter dots
    const scatterPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 8, className: 'plume-popup' });
    scatterPopupRef.current = scatterPopup;
    m.on('mouseenter', SCATTER_DOT, (e) => {
      m.getCanvas().style.cursor = 'pointer';
      if (!e.features?.length) return;
      const p = e.features[0].properties!;
      const coords = (e.features[0].geometry as GeoJSON.Point).coordinates.slice() as [number, number];
      const scatterRateStr = Number(p.rate) > 0 ? `${Number(p.rate).toFixed(1)} kg/hr` : 'N/A';
      scatterPopup.setLngLat(coords)
        .setHTML(`<div style="font-size:11px;font-weight:600;line-height:1.6;padding:2px 0;"><div style="color:#fb923c;">Plume ${p.plume_idx} of ${p.total}</div><div style="color:#e2e8f0;">${scatterRateStr}</div><div style="color:#94a3b8;font-size:10px;">${coords[1].toFixed(5)}° N, ${coords[0].toFixed(5)}° E</div><div style="color:#6b7280;font-size:10px;">${p.source_name}</div></div>`)
        .addTo(m);
    });
    m.on('mouseleave', SCATTER_DOT, () => { m.getCanvas().style.cursor = ''; scatterPopup.remove(); });

    // --- Ground measurement scatter layers ---
    m.addSource(GROUND_SCATTER_SRC, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

    m.addLayer({
      id: GROUND_SCATTER_HAZE, type: 'circle', source: GROUND_SCATTER_SRC,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 3, 7, 6, 10, 10, 13, 16],
        'circle-color': '#14b8a6',
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.2, 7, 0.14, 10, 0.08, 13, 0.05],
        'circle-blur': ['interpolate', ['linear'], ['zoom'], 4, 1.4, 7, 1, 10, 0.5, 13, 0.2],
      },
    });

    m.addLayer({
      id: GROUND_SCATTER_GLOW, type: 'circle', source: GROUND_SCATTER_SRC, minzoom: 7,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 4, 10, 8, 13, 12],
        'circle-color': '#2dd4bf',
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.05, 10, 0.1, 13, 0.15],
        'circle-blur': 0.6,
      },
    });

    m.addLayer({
      id: GROUND_SCATTER_DOT, type: 'circle', source: GROUND_SCATTER_SRC, minzoom: 7.5,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 7.5, 1.5, 10, 3, 13, 5],
        'circle-color': '#5eead4',
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 7.5, 0.3, 9, 0.6, 12, 0.85],
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 7.5, 0, 10, 0.8, 13, 1.5],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-opacity': ['interpolate', ['linear'], ['zoom'], 7.5, 0, 10, 0.3, 13, 0.6],
      },
    });

    const groundPopup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 8, className: 'plume-popup ground-popup' });
    groundPopupRef.current = groundPopup;
    m.on('mouseenter', GROUND_SCATTER_DOT, (e) => {
      m.getCanvas().style.cursor = 'pointer';
      if (!e.features?.length) return;
      const p = e.features[0].properties!;
      const coords = (e.features[0].geometry as GeoJSON.Point).coordinates.slice() as [number, number];
      const dateStr = p.date ? new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
      const groundRateStr = Number(p.reading) > 0 ? `${Number(p.reading).toFixed(1)} kg/hr` : 'N/A';
      groundPopup.setLngLat(coords)
        .setHTML(`<div style="font-size:11px;font-weight:600;line-height:1.6;padding:2px 0;"><div style="color:#14b8a6;">Measurement ${p.measurement_idx} of ${p.total}</div><div style="color:#5eead4;">${groundRateStr}</div><div style="color:#94a3b8;font-size:10px;">${coords[1].toFixed(5)}° N, ${coords[0].toFixed(5)}° E</div><div style="color:#6b7280;font-size:10px;">${dateStr} &bull; ${p.methodology || ''}</div><div style="color:#6b7280;font-size:10px;">${p.facility_name}</div></div>`)
        .addTo(m);
    });
    m.on('mouseleave', GROUND_SCATTER_DOT, () => { m.getCanvas().style.cursor = ''; groundPopup.remove(); });

    groundLayerReady.current = true;
    if (groundDataMapRef.current.size > 0) {
      updateGroundScatter(m, filteredFacilities, groundDataMapRef.current);
    }

    startBreathingAnimation(m);

    satLayerReady.current = true;
  }

  function startBreathingAnimation(m: mapboxgl.Map) {
    if (breatheAnimRef.current) cancelAnimationFrame(breatheAnimRef.current);

    let phase = 0;
    const animate = () => {
      if (!m.getLayer(SAT_LAYER_GLOW)) return;

      phase += 0.02;
      const pulse = 0.5 + 0.5 * Math.sin(phase);
      const baseOpacity = 0.08;
      const swing = 0.12;

      try {
        m.setPaintProperty(SAT_LAYER_GLOW, 'circle-opacity',
          ['interpolate', ['linear'], ['get', 'plume_count'],
            0, baseOpacity + swing * pulse * 0.3,
            1, baseOpacity + swing * pulse * 0.5,
            3, baseOpacity + swing * pulse * 0.7,
            10, baseOpacity + swing * pulse * 0.9,
            20, baseOpacity + swing * pulse,
          ]
        );

        if (m.getLayer(SCATTER_HAZE)) {
          m.setPaintProperty(SCATTER_HAZE, 'circle-opacity',
            ['interpolate', ['linear'], ['zoom'],
              4, 0.15 + 0.12 * pulse,
              7, 0.1 + 0.1 * pulse,
              10, 0.06 + 0.08 * pulse,
              13, 0.04 + 0.06 * pulse,
            ]
          );
        }
      } catch { /* layer removed during animation */ }

      breatheAnimRef.current = requestAnimationFrame(animate);
    };

    breatheAnimRef.current = requestAnimationFrame(animate);
  }

  function setupSatelliteClickHandler(m: mapboxgl.Map) {
    m.on('click', SAT_LAYER_POINT, (e) => {
      if (!e.features?.length) return;
      const props = e.features[0].properties!;
      const coords = (e.features[0].geometry as GeoJSON.Point).coordinates;
      const sourceName = props.source_name ?? '';
      const prov = (props.provider as string) ?? 'carbon_mapper';
      setSelectedFacility({
        id: (props.feature_id as string) || sourceName,
        name: sourceName,
        latitude: coords[1], longitude: coords[0],
        sector: props.sector ?? 'Unknown', region: null,
        isSatellite: true, emissionRate: props.emission_rate ?? 0,
        emissionUncertainty: props.emission_uncertainty ?? 0,
        plumeCount: props.plume_count ?? 0, persistence: props.persistence ?? 0,
        instrument: props.instrument ?? '', firstDetected: props.first_detected ?? '',
        lastDetected: props.last_detected ?? '',
        satelliteProvider: prov,
        plumeImageUrl: (props.plume_image_url as string) || undefined,
      });
      setActivePlumeSource(sourceName);
      setIsExpanded(false);
    });
  }

  function clearHoverConnectors(m: mapboxgl.Map) {
    try {
      if (m.getLayer(HOVER_CONNECTOR_DOT)) m.removeLayer(HOVER_CONNECTOR_DOT);
      if (m.getLayer(HOVER_CONNECTOR_LINE)) m.removeLayer(HOVER_CONNECTOR_LINE);
      if (m.getSource(HOVER_CONNECTOR_SRC)) m.removeSource(HOVER_CONNECTOR_SRC);
    } catch { /* map destroyed */ }
  }

  function setupHoverConnectors(m: mapboxgl.Map) {
    let hoverActive = false;

    m.on('mouseenter', SAT_LAYER_POINT, (e) => {
      if (!e.features?.length || activePlumeSource) return;
      const props = e.features[0].properties!;
      const coords = (e.features[0].geometry as GeoJSON.Point).coordinates;
      const plumeCount = props.plume_count ?? 0;
      if (plumeCount <= 0) return;

      const srcLng = coords[0];
      const srcLat = coords[1];
      const srcName = props.source_name ?? '';
      const srcIdx = filteredSatellite.findIndex((s: any) => (s.name ?? s.source_name) === srcName);
      const seed = srcIdx >= 0 ? srcIdx : 0;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const maxR = 0.02 + Math.min(plumeCount, 20) * 0.002;

      const lineFeats: GeoJSON.Feature[] = [];
      const dotFeats: GeoJSON.Feature[] = [];

      for (let i = 0; i < plumeCount; i++) {
        const angle = i * goldenAngle + seededRand(seed * 100) * Math.PI * 2;
        const r = maxR * Math.sqrt((i + 1) / plumeCount);
        const jitter = seededRand(seed * 1000 + i * 7) * 0.004;
        const pLng = srcLng + (r + jitter) * Math.cos(angle);
        const pLat = srcLat + (r + jitter) * Math.sin(angle);

        lineFeats.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [[srcLng, srcLat], [pLng, pLat]] },
          properties: {},
        });
        dotFeats.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [pLng, pLat] },
          properties: {},
        });
      }

      clearHoverConnectors(m);
      const geojson: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [...lineFeats, ...dotFeats] };
      m.addSource(HOVER_CONNECTOR_SRC, { type: 'geojson', data: geojson });
      m.addLayer({
        id: HOVER_CONNECTOR_LINE, type: 'line', source: HOVER_CONNECTOR_SRC,
        filter: ['==', '$type', 'LineString'],
        paint: { 'line-color': '#f59e0b', 'line-width': 1, 'line-opacity': 0.25, 'line-dasharray': [2, 4] },
      });
      m.addLayer({
        id: HOVER_CONNECTOR_DOT, type: 'circle', source: HOVER_CONNECTOR_SRC,
        filter: ['==', '$type', 'Point'],
        paint: { 'circle-radius': 3, 'circle-color': '#fbbf24', 'circle-opacity': 0.4, 'circle-stroke-width': 1, 'circle-stroke-color': '#ffffff', 'circle-stroke-opacity': 0.3 },
      });
      hoverActive = true;
    });

    m.on('mouseleave', SAT_LAYER_POINT, () => {
      if (hoverActive) {
        clearHoverConnectors(m);
        hoverActive = false;
      }
    });
  }

  function updateSatelliteSource(m: mapboxgl.Map, features: any[]) {
    const source = m.getSource(SAT_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(buildSatelliteGeoJSON(features));
    }
    const scatterSrc = m.getSource(SCATTER_SOURCE) as mapboxgl.GeoJSONSource | undefined;
    if (scatterSrc) {
      scatterSrc.setData(buildPlumeScatterGeoJSON(features));
    }
  }

  const isRefreshing = isFetchingSatellite;

  return (
    <div className={`relative h-full w-full overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-[#0b0e14]' : 'bg-gray-50'}`}>
      <div ref={mapContainer} className="absolute inset-0 z-0" style={{ background: mapLoaded ? 'transparent' : (darkMode ? '#0b0e14' : '#e5e7eb') }} />

      {(!mapLoaded || isLoadingFacilities) && !error && (
        <MapDataLoader darkMode={darkMode} mapLoaded={mapLoaded} isLoadingData={isLoadingFacilities} />
      )}

      {isRefreshing && mapLoaded && (
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-bold shadow-2xl backdrop-blur-md ${darkMode ? 'bg-[#12161f]/95 text-teal-400 border border-[#1e2430]' : 'bg-white/95 text-teal-700 border border-gray-200'}`}>
          <div className="w-3.5 h-3.5 rounded-full border-2 border-transparent border-t-current animate-spin" />
          Fetching satellite data{globalSatSources.length > 0 ? ` (${globalSatSources.length} sources cached)` : ''}...
        </div>
      )}

      {regionChanged && !isRefreshing && mapLoaded && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={handleRefreshRegion}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-extrabold shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 ${darkMode ? 'bg-[#009688] text-white hover:bg-[#00796b]' : 'bg-[#009688] text-white hover:bg-[#00796b]'}`}
          >
            <RefreshCw size={16} />
            Load this area
          </button>
        </div>
      )}

      {/* Satellite error banner */}
      {satelliteError && mapLoaded && (
        <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[90%] animate-in fade-in slide-in-from-top-2 duration-300`}>
          <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${darkMode ? 'bg-[#1a1215]/95 border-red-500/20 text-red-400' : 'bg-red-50/95 border-red-200 text-red-700'}`}>
            <Satellite className="flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Satellite Data Unavailable</p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-red-400/70' : 'text-red-600/70'}`}>
                Satellite data (Carbon Mapper, IMEO, TROPOMI) is not available at the moment. Facility data is still displayed. Please try refreshing later.
              </p>
            </div>
            <button onClick={() => setSatelliteError(null)} className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* "Filtered to nothing" banner — backend returned data but our filter pipeline
          (legend toggles, sliders, search) dropped everything. Distinct from the
          error banner because the cause is local UI state, not the backend. */}
      {isFilteredToNothing && !satelliteError && mapLoaded && (
        <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[90%] animate-in fade-in slide-in-from-top-2 duration-300`}>
          <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${darkMode ? 'bg-[#1a1f14]/95 border-amber-500/30 text-amber-200' : 'bg-amber-50/95 border-amber-200 text-amber-800'}`}>
            <Satellite className="flex-shrink-0 mt-0.5 text-amber-500" size={20} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">
                {globalSatSources.length} source{globalSatSources.length === 1 ? '' : 's'} loaded — filters are hiding them all
              </p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-amber-200/70' : 'text-amber-700/80'}`}>
                The backend returned data, but the current filter selection (legend providers / instruments, or filter panel sliders) excludes every source. Reset the legend or open Filters to widen the selection.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  onClick={() => setGridControls(DEFAULT_GRID_CONTROLS)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${darkMode ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-100' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
                >
                  Reset legend
                </button>
                {onOpenFilters && (
                  <button
                    onClick={onOpenFilters}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${darkMode ? 'bg-white/10 hover:bg-white/20 text-amber-100' : 'bg-white hover:bg-gray-50 text-amber-800 border border-amber-200'}`}
                  >
                    Open Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className={`absolute inset-0 flex items-center justify-center z-50 p-6 ${darkMode ? 'bg-[#0b0e14]/90' : 'bg-red-50/90'}`} onClick={() => setError(null)}>
          <div className={`p-8 rounded-2xl shadow-xl max-w-md text-center border relative ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setError(null)} className={`absolute top-3 right-3 p-1.5 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
              <X size={18} />
            </button>
            <AlertCircle className="mx-auto text-red-500" size={48} />
            <h3 className={`mt-4 text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Map Error</h3>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
            <button onClick={() => setError(null)} className={`mt-4 px-6 py-2 rounded-xl text-sm font-bold transition-all ${darkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className={`absolute inset-0 pointer-events-none z-10 ${darkMode ? 'opacity-[0.12]' : 'opacity-[0.25]'}`}>
        <div className="w-full h-full" style={{ backgroundImage: `linear-gradient(${darkMode ? 'rgba(148,163,184,1)' : 'rgba(30,41,59,1)'} 1px, transparent 1px), linear-gradient(90deg, ${darkMode ? 'rgba(148,163,184,1)' : 'rgba(30,41,59,1)'} 1px, transparent 1px)`, backgroundSize: '100px 100px' }} />
      </div>

      <MapSearchBar darkMode={darkMode} onOpenFilters={onOpenFilters} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="absolute top-20 md:top-28 left-3 md:left-6 z-40">
        <button onClick={() => { setShowAlerts(!showAlerts); if (!showAlerts) markAllRead.mutate(); }}
          className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl transition-all ${showAlerts ? 'bg-red-600 text-white' : darkMode ? 'bg-[#12161f] text-gray-400 hover:bg-[#1e2430]' : 'bg-[#003d33] text-teal-300 hover:bg-[#004d40]'}`}>
          <AlertCircle size={24} />
          {!isLoadingAlerts && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">{unreadCount}</span>
          )}
        </button>
      </div>

      <MapZoomControls onZoomIn={() => map.current?.zoomIn()} onZoomOut={() => map.current?.zoomOut()} />
      <EmissionSummaryCard darkMode={darkMode} totalSources={totalSources} totalPlumes={totalPlumes} facilityCount={filteredFacilities.length} satelliteCount={filteredSatellite.length} />

      {/* Top-right control stack: Layers + Grid Legend toggles */}
      <div className="absolute top-20 md:top-28 right-3 md:right-6 z-40 flex flex-col gap-2.5">
        <button
          onClick={() => setShowGridLegend(v => !v)}
          aria-label="Toggle methane grid legend"
          aria-pressed={showGridLegend}
          title="Methane grid legend"
          className={`relative w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl transition-all ${
            showGridLegend && mapLayers.emissionGrid
              ? 'bg-teal-600 text-white'
              : darkMode
                ? 'bg-[#12161f] text-gray-400 hover:bg-[#1e2430]'
                : 'bg-[#003d33] text-teal-300 hover:bg-[#004d40]'
          }`}
        >
          <Info size={22} />
          {!mapLayers.emissionGrid && (
            <span
              aria-hidden
              className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2"
              style={{ backgroundColor: '#94a3b8', borderColor: darkMode ? '#0b0e14' : '#003d33' }}
            />
          )}
        </button>
        <button
          onClick={() => setShowLayerPanel(v => !v)}
          aria-label="Toggle layer panel"
          title="Layers"
          className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl transition-all ${showLayerPanel ? 'bg-teal-600 text-white' : darkMode ? 'bg-[#12161f] text-gray-400 hover:bg-[#1e2430]' : 'bg-[#003d33] text-teal-300 hover:bg-[#004d40]'}`}
        >
          <Layers size={22} />
        </button>
      </div>

      <LayerTogglePanel
        darkMode={darkMode}
        layers={mapLayers}
        onToggle={(layer) => {
          if (layer === 'satelliteView' && map.current) {
            const m = map.current;
            const willEnable = !mapLayers.satelliteView;
            m.once('style.load', () => rebuildAllLayers(m));
            m.setStyle(willEnable
              ? 'mapbox://styles/mapbox/satellite-streets-v12'
              : getMapStyleUrl(mapStyle));
          }
          toggleMapLayer(layer);
        }}
        visible={showLayerPanel}
        onClose={() => setShowLayerPanel(false)}
      />

      <EmissionGridLegend
        darkMode={darkMode}
        visible={showGridLegend}
        state={{
          enabled: mapLayers.emissionGrid,
          providers: gridControls.providers ?? [],
          instrumentsByProvider: instrumentsByProvider,
          statistic: gridControls.statistic,
          showAlerts: gridControls.showAlerts,
        }}
        onChange={(s) => {
          if (s.enabled !== mapLayers.emissionGrid) toggleMapLayer('emissionGrid');
          setGridControls({
            providers: s.providers,
            instrumentsByProvider: s.instrumentsByProvider,
            statistic: s.statistic,
            showAlerts: s.showAlerts,
          });
        }}
        providerSources={providerSourceSummaries}
        currentlyShowing={mapLayers.emissionGrid ? {
          source: providerSummary(gridControls.providers),
          statistic:
            gridControls.statistic === 'max' ? 'Maximum reading' :
            gridControls.statistic === 'sum' ? 'Total emissions' :
            'Average reading',
          timeLabel: 'Last 7 days',
          instrumentBreakdown: instrumentBreakdown,
        } : undefined}
        onClose={() => setShowGridLegend(false)}
      />

      <SourceLegendHint darkMode={darkMode} providerSources={providerSourceSummaries} />

      {showAlerts && (
        <AlertsPanel
          darkMode={darkMode}
          alerts={(alerts as any[]).map((a: any) => ({
            id: a.id, title: a.title, description: a.description,
            emissionRate: a.emissionRate, severity: a.severity, createdAt: a.createdAt,
          }))}
          onClose={() => setShowAlerts(false)}
          onViewAll={() => { setShowAlerts(false); markAllRead.mutate(); onNavigateAlerts?.(); }}
        />
      )}

      {selectedFacility && !isExpanded && (
        <FacilityPopup darkMode={darkMode} facility={selectedFacility} onExpand={() => setIsExpanded(true)} onClose={() => setSelectedFacility(null)} />
      )}

      {selectedFacility && isExpanded && (
        <FacilityDetailModal
          darkMode={darkMode} facility={selectedFacility} chartData={chartData}
          isLoadingChart={isLoadingGround} onClose={() => setIsExpanded(false)}
          onShareReport={handleShareReport} onExportCSV={handleExportCSV}
        />
      )}
    </div>
  );
};

export default LiveMap;
