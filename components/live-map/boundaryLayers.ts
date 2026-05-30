import mapboxgl from 'mapbox-gl';

function isMapAlive(m: mapboxgl.Map): boolean {
  try { m.getStyle(); return true; } catch { return false; }
}

// --- Layer IDs ---
export const STATES_SOURCE = 'nigeria-states-source';
export const STATES_FILL = 'nigeria-states-fill';
export const STATES_BORDER = 'nigeria-states-border';
export const STATES_LABEL = 'nigeria-states-label';

export const LGAS_SOURCE = 'nigeria-lgas-source';
export const LGAS_FILL = 'nigeria-lgas-fill';
export const LGAS_BORDER = 'nigeria-lgas-border';
export const LGAS_LABEL = 'nigeria-lgas-label';

export const PIPELINES_SOURCE = 'nigeria-pipelines-source';
export const PIPELINES_HIGHLIGHT = 'nigeria-pipelines-highlight';
export const PIPELINES_LINE = 'nigeria-pipelines-line';
export const PIPELINES_LABEL = 'nigeria-pipelines-label';

export const OIL_BLOCKS_SOURCE = 'nigeria-oil-blocks-source';
export const OIL_BLOCKS_FILL = 'nigeria-oil-blocks-fill';
export const OIL_BLOCKS_BORDER = 'nigeria-oil-blocks-border';
export const OIL_BLOCKS_LABEL = 'nigeria-oil-blocks-label';


// --- State → geopolitical zone mapping ---
const STATE_ZONES: Record<string, string> = {
  'Abia': 'South East', 'Adamawa': 'North East', 'Akwa Ibom': 'South South',
  'Anambra': 'South East', 'Bauchi': 'North East', 'Bayelsa': 'South South',
  'Benue': 'North Central', 'Borno': 'North East', 'Cross River': 'South South',
  'Delta': 'South South', 'Ebonyi': 'South East', 'Edo': 'South South',
  'Ekiti': 'South West', 'Enugu': 'South East', 'Federal Capital Territory': 'North Central',
  'Gombe': 'North East', 'Imo': 'South East', 'Jigawa': 'North West',
  'Kaduna': 'North West', 'Kano': 'North West', 'Katsina': 'North West',
  'Kebbi': 'North West', 'Kogi': 'North Central', 'Kwara': 'North Central',
  'Lagos': 'South West', 'Nasarawa': 'North Central', 'Niger': 'North Central',
  'Ogun': 'South West', 'Ondo': 'South West', 'Osun': 'South West',
  'Oyo': 'South West', 'Plateau': 'North Central', 'Rivers': 'South South',
  'Sokoto': 'North West', 'Taraba': 'North East', 'Yobe': 'North East',
  'Zamfara': 'North West',
};

function getZone(stateName: string): string {
  for (const [key, zone] of Object.entries(STATE_ZONES)) {
    if (stateName.toLowerCase().includes(key.toLowerCase())) return zone;
  }
  return 'Nigeria';
}

// --- Data loading ---

let statesGeoJSON: any = null;
let lgasGeoJSON: any = null;
let oilBlocksGeoJSON: any = null;

async function loadStatesGeoJSON() {
  if (statesGeoJSON) return statesGeoJSON;
  const res = await fetch('/geojson/nigeria-states.geojson');
  statesGeoJSON = await res.json();
  return statesGeoJSON;
}

async function loadLGAsGeoJSON() {
  if (lgasGeoJSON) return lgasGeoJSON;
  const res = await fetch('/geojson/nigeria-lgas.geojson');
  lgasGeoJSON = await res.json();
  return lgasGeoJSON;
}

async function loadOilBlocksGeoJSON() {
  if (oilBlocksGeoJSON) return oilBlocksGeoJSON;
  const res = await fetch('/geojson/oil-blocks.geojson');
  if (!res.ok) return null;
  oilBlocksGeoJSON = await res.json();
  return oilBlocksGeoJSON;
}

// --- Theme tracking for popup colors ---

let currentThemeDark = true;

export function setBoundaryTheme(dark: boolean) {
  currentThemeDark = dark;
}

function themeColors() {
  return currentThemeDark
    ? { bg: '#1a1f2b', text: '#e2e8f0', muted: '#94a3b8', label: '#cbd5e1', border: 'rgba(100,116,139,0.3)' }
    : { bg: '#ffffff', text: '#1e293b', muted: '#64748b', label: '#334155', border: 'rgba(203,213,225,0.6)' };
}

// --- Popup HTML builders ---

function statePopupHTML(name: string, lng: number, lat: number): string {
  const zone = getZone(name);
  const t = themeColors();
  // Brand-aligned: state = the most important admin context, so it gets the app's teal.
  // Dark: a mid teal that reads on navy without glowing.
  // Light: a deep desaturated teal that feels sophisticated, not loud.
  const accent = currentThemeDark ? '#5eead4' : '#115e59';
  return `<div style="font-family:system-ui,sans-serif;font-size:12px;line-height:1.7;padding:4px 2px;">
    <div style="font-weight:800;font-size:14px;color:${accent};margin-bottom:2px;">${name} State</div>
    <div style="color:${t.muted};"><span style="font-weight:600;color:${t.label};">Region:</span> ${zone}</div>
    <div style="color:${t.muted};"><span style="font-weight:600;color:${t.label};">Lat:</span> ${lat.toFixed(4)}°N &nbsp; <span style="font-weight:600;color:${t.label};">Lng:</span> ${lng.toFixed(4)}°E</div>
  </div>`;
}

function lgaPopupHTML(name: string, lng: number, lat: number): string {
  const t = themeColors();
  // Tertiary admin tier — quiet slate on both themes. Always one luminance step lighter
  // than the oil-block layer so the hierarchy reads at a glance.
  const accent = currentThemeDark ? '#94a3b8' : '#64748b';
  return `<div style="font-family:system-ui,sans-serif;font-size:12px;line-height:1.7;padding:4px 2px;">
    <div style="font-weight:800;font-size:13px;color:${accent};margin-bottom:2px;">${name}</div>
    <div style="color:${t.muted};"><span style="font-weight:600;color:${t.label};">Type:</span> Local Government Area</div>
    <div style="color:${t.muted};"><span style="font-weight:600;color:${t.label};">Lat:</span> ${lat.toFixed(4)}°N &nbsp; <span style="font-weight:600;color:${t.label};">Lng:</span> ${lng.toFixed(4)}°E</div>
  </div>`;
}

function pipelinePopupHTML(name: string, lng: number, lat: number): string {
  const t = themeColors();
  const accent = currentThemeDark ? '#f87171' : '#dc2626';
  return `<div style="font-family:system-ui,sans-serif;font-size:12px;line-height:1.7;padding:4px 2px;">
    <div style="font-weight:800;font-size:13px;color:${accent};margin-bottom:2px;">${name}</div>
    <div style="color:${t.muted};"><span style="font-weight:600;color:${t.label};">Type:</span> Oil &amp; Gas Pipeline</div>
    <div style="color:${t.muted};"><span style="font-weight:600;color:${t.label};">Lat:</span> ${lat.toFixed(4)}°N &nbsp; <span style="font-weight:600;color:${t.label};">Lng:</span> ${lng.toFixed(4)}°E</div>
  </div>`;
}

function oilBlockPopupHTML(props: Record<string, any>, _lng: number, _lat: number): string {
  const name = props.name ?? 'Unknown';
  const t = themeColors();
  // Match the slate oil-block strokes — popup accent stays in the secondary tier.
  const accent = currentThemeDark ? '#cbd5e1' : '#334155';
  const operator = props.operator || '';
  const area = props.area_sqkm ? `${Number(props.area_sqkm).toLocaleString()} km²` : '';
  const basin = props.basin || '';
  const terrain = props.terrain || '';
  const status = props.status || '';
  const awardDate = props.award_date || '';
  const contract = props.contract || '';
  const rights = props.rights || '';
  const blockType = props.type || '';

  const row = (label: string, value: string) =>
    value ? `<div style="color:${t.muted};"><span style="font-weight:600;color:${t.label};">${label}:</span> ${value}</div>` : '';

  let html = `<div style="font-family:system-ui,sans-serif;font-size:12px;line-height:1.7;padding:4px 2px;">`;
  html += `<div style="font-weight:800;font-size:14px;color:${accent};margin-bottom:4px;">${name}</div>`;
  html += row('Area', area + (basin ? `, basin: <b>${basin}</b>` : ''));
  html += row('Terrain', terrain);
  html += row('Status', status);
  html += row('Operator', operator);
  html += row('Type', blockType);
  html += row('Awarded on', awardDate);
  html += row('Contract', contract);
  html += row('Rights', rights);
  html += `<div style="color:${t.muted};opacity:0.6;font-size:10px;margin-top:4px;font-style:italic;">Data from 2011</div>`;
  html += `</div>`;
  return html;
}

// --- Unified boundary hover: queries ALL visible fill layers at cursor and builds combined popup ---

interface HoveredEntry { source: string; id: string | number }

const BOUNDARY_QUERY_LAYERS = [
  { layer: PIPELINES_LINE, source: PIPELINES_SOURCE, kind: 'pipeline' as const },
  { layer: OIL_BLOCKS_FILL, source: OIL_BLOCKS_SOURCE, kind: 'oilBlock' as const },
  { layer: LGAS_FILL, source: LGAS_SOURCE, kind: 'lga' as const },
  { layer: STATES_FILL, source: STATES_SOURCE, kind: 'state' as const },
];

let boundaryHandlerInstalled = false;
let hoveredEntries: HoveredEntry[] = [];

function clearAllHoverStates(m: mapboxgl.Map) {
  for (const entry of hoveredEntries) {
    try { m.setFeatureState({ source: entry.source, id: entry.id }, { hover: false }); } catch { /* */ }
  }
  hoveredEntries = [];
}

function buildCombinedPopupHTML(
  hits: { kind: string; feature: mapboxgl.MapboxGeoJSONFeature }[],
  lng: number,
  lat: number,
): string {
  const sections: string[] = [];

  for (const { kind, feature } of hits) {
    const p = feature.properties ?? {};
    if (kind === 'pipeline') {
      sections.push(pipelinePopupHTML(p.name ?? 'Unknown', lng, lat));
    } else if (kind === 'oilBlock') {
      sections.push(oilBlockPopupHTML(p, lng, lat));
    } else if (kind === 'state') {
      sections.push(statePopupHTML(p.shapeName ?? 'Unknown', lng, lat));
    } else if (kind === 'lga') {
      sections.push(lgaPopupHTML(p.shapeName ?? 'Unknown', lng, lat));
    }
  }

  const t = themeColors();
  const divider = `<hr style="border:none;border-top:1px solid ${t.border};margin:8px 0;">`;
  const inner = sections.length <= 1 ? (sections[0] ?? '') : sections.join(divider);
  return `<div style="background:${t.bg};color:${t.text};border-radius:14px;padding:14px 16px;margin:-10px -10px;min-width:200px;box-shadow:0 4px 24px rgba(0,0,0,0.15);">${inner}</div>`;
}

let boundaryPopup: mapboxgl.Popup | null = null;

function getBoundaryPopup(): mapboxgl.Popup {
  if (!boundaryPopup) {
    boundaryPopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      className: 'boundary-popup',
      maxWidth: '360px',
    });
  }
  return boundaryPopup;
}

function queryBoundaryHits(m: mapboxgl.Map, point: mapboxgl.Point) {
  const hits: { kind: string; feature: mapboxgl.MapboxGeoJSONFeature }[] = [];
  for (const { layer, source, kind } of BOUNDARY_QUERY_LAYERS) {
    if (!m.getLayer(layer)) continue;
    try {
      const features = m.queryRenderedFeatures(point, { layers: [layer] });
      if (features.length > 0) {
        hits.push({ kind, feature: features[0] });
      }
    } catch { /* layer may have been removed */ }
  }
  return hits;
}

function applyHoverStates(m: mapboxgl.Map, hits: { kind: string; feature: mapboxgl.MapboxGeoJSONFeature }[]) {
  for (const { kind, feature } of hits) {
    const cfg = BOUNDARY_QUERY_LAYERS.find(b => b.kind === kind);
    if (cfg && feature.id != null) {
      try { m.setFeatureState({ source: cfg.source, id: feature.id }, { hover: true }); } catch { /* */ }
      hoveredEntries.push({ source: cfg.source, id: feature.id });
    }
  }
}

export function installBoundaryHover(m: mapboxgl.Map) {
  if (boundaryHandlerInstalled) return;
  boundaryHandlerInstalled = true;

  const popup = getBoundaryPopup();
  let isShowingBoundary = false;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isTouch) {
    m.on('click', (e: mapboxgl.MapMouseEvent) => {
      const hits = queryBoundaryHits(m, e.point);
      clearAllHoverStates(m);

      if (hits.length === 0) {
        if (isShowingBoundary) { popup.remove(); isShowingBoundary = false; }
        return;
      }

      applyHoverStates(m, hits);
      const t = themeColors();
      const closeBtn = `<div style="text-align:right;margin:-8px -8px 4px 0;"><button onclick="this.closest('.mapboxgl-popup').remove()" style="background:none;border:none;cursor:pointer;color:${t.muted};font-size:18px;line-height:1;padding:2px 6px;">×</button></div>`;
      const html = buildCombinedPopupHTML(hits, e.lngLat.lng, e.lngLat.lat);
      const wrappedHtml = html.replace(/^<div /, `<div data-touch="1" `) .replace(/>/, `>${closeBtn}`);
      popup.setLngLat(e.lngLat).setHTML(wrappedHtml).addTo(m);
      isShowingBoundary = true;
    });
  } else {
    m.on('mousemove', (e: mapboxgl.MapMouseEvent) => {
      const hits = queryBoundaryHits(m, e.point);
      clearAllHoverStates(m);

      if (hits.length === 0) {
        if (isShowingBoundary) { popup.remove(); isShowingBoundary = false; }
        return;
      }

      applyHoverStates(m, hits);
      const html = buildCombinedPopupHTML(hits, e.lngLat.lng, e.lngLat.lat);
      popup.setLngLat(e.lngLat).setHTML(html).addTo(m);
      isShowingBoundary = true;
    });
  }
}

export function uninstallBoundaryHover() {
  boundaryHandlerInstalled = false;
}

// --- Oil-block click → detail modal ---
// A separate click handler (in addition to the hover/touch popup above) that
// fires only when the user clicks an oil-block fill. The React layer registers
// a callback via `setOilBlockClickHandler` and renders a rich detail modal
// (block info + plumes + facilities + state + LGA + Methane Trends drill-in).

export interface OilBlockClickPayload {
  properties: Record<string, any>;
  /** Click coordinates on the map (use for zooming or "back to point" links). */
  lngLat: { lng: number; lat: number };
  /** Polygon geometry — lets the React side compute bbox / "inside this block" queries. */
  geometry: GeoJSON.Geometry | null;
}

let oilBlockClickHandler: ((payload: OilBlockClickPayload) => void) | null = null;
// We track WHICH map instance has the click listener bound. The previous
// implementation tracked install state with a boolean which never reset on
// LiveMap unmount → the next mount got a fresh map with no listener, so
// clicking blocks did nothing after navigating away and coming back. Storing
// the map reference makes "is this map already wired?" a real identity check.
let oilBlockClickInstalledOn: mapboxgl.Map | null = null;

export function setOilBlockClickHandler(fn: ((payload: OilBlockClickPayload) => void) | null) {
  oilBlockClickHandler = fn;
}

export function installOilBlockClick(m: mapboxgl.Map) {
  // Already wired to THIS map instance — skip. Different map (or first install
  // after a remount) — fall through and bind.
  if (oilBlockClickInstalledOn === m) return;
  oilBlockClickInstalledOn = m;
  m.on('click', OIL_BLOCKS_FILL, (e: mapboxgl.MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature || !oilBlockClickHandler) return;
    // Dismiss any open hover popup so the modal isn't competing for attention.
    boundaryPopup?.remove();
    oilBlockClickHandler({
      properties: feature.properties ?? {},
      lngLat: { lng: e.lngLat.lng, lat: e.lngLat.lat },
      geometry: (feature.geometry as GeoJSON.Geometry) ?? null,
    });
  });
  m.on('mouseenter', OIL_BLOCKS_FILL, () => { m.getCanvas().style.cursor = 'pointer'; });
  m.on('mouseleave', OIL_BLOCKS_FILL, () => { m.getCanvas().style.cursor = ''; });
}

/**
 * Call this from the React cleanup when the map is destroyed (LiveMap
 * unmount). Without it the next mount sees the stale install flag and never
 * rebinds the click listener — the symptom being: oil-block modal opens on
 * the very first visit but stops responding after the user navigates away
 * (e.g. to Methane Trends) and comes back.
 */
export function uninstallOilBlockClick() {
  oilBlockClickInstalledOn = null;
}

// --- Point-in-polygon helpers (state, LGA, oil-block lookup by lat/lon) ---
// Used by the oil-block detail modal to look up "which state/LGA contains
// this block centroid" without a network round-trip. The same `statesGeoJSON`,
// `lgasGeoJSON`, and `oilBlocksGeoJSON` loaded by the layer renderers are
// reused here — no extra fetch, no extra dependency on turf.

function pointInRing(lon: number, lat: number, ring: number[][]): boolean {
  // Ray-casting algorithm. Returns true when `(lon, lat)` lies inside the
  // outer ring of a simple polygon. Holes are intentionally ignored — for
  // our use cases (Nigerian state / LGA / oil-block polygons) the rare
  // hole-in-polygon case isn't worth the complexity.
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = ((yi > lat) !== (yj > lat))
      && (lon < ((xj - xi) * (lat - yi)) / (yj - yi || Number.EPSILON) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInGeometry(lon: number, lat: number, geometry: any): boolean {
  if (!geometry) return false;
  if (geometry.type === 'Polygon') {
    const outer = geometry.coordinates?.[0];
    return Array.isArray(outer) && pointInRing(lon, lat, outer);
  }
  if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates ?? []) {
      const outer = polygon?.[0];
      if (Array.isArray(outer) && pointInRing(lon, lat, outer)) return true;
    }
  }
  return false;
}

/**
 * Finds the first state polygon whose interior contains `(lon, lat)`.
 * Returns the state name (`shapeName`) or `null` when nothing matches or
 * the states GeoJSON hasn't been loaded yet (layer toggle was never on).
 */
export function findStateAtPoint(lon: number, lat: number): string | null {
  const fc = statesGeoJSON as { features?: any[] } | null;
  if (!fc?.features) return null;
  for (const f of fc.features) {
    if (pointInGeometry(lon, lat, f.geometry)) {
      return typeof f.properties?.shapeName === 'string' ? f.properties.shapeName : null;
    }
  }
  return null;
}

/** Same as `findStateAtPoint` but against the LGA layer. */
export function findLGAAtPoint(lon: number, lat: number): string | null {
  const fc = lgasGeoJSON as { features?: any[] } | null;
  if (!fc?.features) return null;
  for (const f of fc.features) {
    if (pointInGeometry(lon, lat, f.geometry)) {
      return typeof f.properties?.shapeName === 'string' ? f.properties.shapeName : null;
    }
  }
  return null;
}

/**
 * Finds the oil-block polygon containing `(lon, lat)` and returns its full
 * properties object — useful for "which block is this satellite plume in"
 * lookups, where the caller already has lat/lon and wants the block name.
 */
export function findOilBlockAtPoint(lon: number, lat: number): Record<string, any> | null {
  const fc = oilBlocksGeoJSON as { features?: any[] } | null;
  if (!fc?.features) return null;
  for (const f of fc.features) {
    if (pointInGeometry(lon, lat, f.geometry)) {
      return (f.properties ?? {}) as Record<string, any>;
    }
  }
  return null;
}

/**
 * Returns true when ANY vertex of `geometry` falls inside the supplied
 * polygon. A cheap approximation of polygon-intersection that's good enough
 * for "which facilities/plumes lie inside this oil block" lookups when the
 * caller already has the block geometry. Reuses `pointInGeometry` so it
 * supports both Polygon and MultiPolygon block geometries.
 */
export function isPointInsidePolygon(lon: number, lat: number, blockGeometry: GeoJSON.Geometry | null | undefined): boolean {
  return pointInGeometry(lon, lat, blockGeometry);
}

/**
 * Async helper that pre-loads the states + LGAs GeoJSONs so the lookup
 * functions above work even when the user hasn't toggled the layers on.
 * The oil-block GeoJSON is loaded automatically by the layer renderer
 * (it's on by default in v9+), so it's not included here.
 */
export async function preloadAdminGeoJSONs(): Promise<void> {
  await Promise.all([
    statesGeoJSON ? Promise.resolve() : loadStatesGeoJSON(),
    lgasGeoJSON ? Promise.resolve() : loadLGAsGeoJSON(),
    oilBlocksGeoJSON ? Promise.resolve() : loadOilBlocksGeoJSON(),
  ]);
}


// --- States Layer ---

export function removeStatesLayer(m: mapboxgl.Map) {
  if (!isMapAlive(m)) return;
  [STATES_LABEL, STATES_BORDER, STATES_FILL].forEach(id => {
    if (m.getLayer(id)) m.removeLayer(id);
  });
  if (m.getSource(STATES_SOURCE)) m.removeSource(STATES_SOURCE);
}

export async function addStatesLayer(m: mapboxgl.Map, beforeLayer?: string, isDark = true) {
  removeStatesLayer(m);
  const data = await loadStatesGeoJSON();
  if (!data || !isMapAlive(m)) return;

  // Brand-aligned primary admin tier. Uses the app's teal in theme-appropriate weights:
  //   Dark  → mid teal that reads on navy without glowing or competing with sidebar accents.
  //   Light → deep, almost-petrol teal that feels editorial, not a neon highlight.
  //   Satellite handled by either branch + strong text halo so labels survive imagery.
  const borderColor = isDark ? '#2dd4bf' : '#115e59';
  const fillColor = isDark ? '#14b8a6' : '#0d9488';
  const labelColor = isDark ? '#5eead4' : '#134e4a';
  const haloColor = isDark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.95)';

  m.addSource(STATES_SOURCE, { type: 'geojson', data, generateId: true });

  m.addLayer({
    id: STATES_FILL, type: 'fill', source: STATES_SOURCE,
    paint: {
      'fill-color': fillColor,
      // Resting fill is barely-there on both themes — the brand-teal border carries the
      // boundary, the fill only confirms shape on hover.
      'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], isDark ? 0.18 : 0.1, isDark ? 0.06 : 0.03],
    },
  }, beforeLayer);

  m.addLayer({
    id: STATES_BORDER, type: 'line', source: STATES_SOURCE,
    paint: {
      'line-color': borderColor,
      'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 3.5, 1.8],
      'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, isDark ? 0.75 : 0.85],
    },
  }, beforeLayer);

  m.addLayer({
    id: STATES_LABEL, type: 'symbol', source: STATES_SOURCE,
    layout: {
      'text-field': ['get', 'shapeName'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 4, 8, 7, 11, 10, 14],
      'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
      'text-allow-overlap': false,
      'text-max-width': 8,
    },
    paint: {
      'text-color': labelColor,
      'text-halo-color': haloColor,
      'text-halo-width': isDark ? 1.2 : 1.8,
      'text-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 7, 1],
    },
  });

  installBoundaryHover(m);
}

// --- LGAs Layer ---

export function removeLGAsLayer(m: mapboxgl.Map) {
  if (!isMapAlive(m)) return;
  [LGAS_LABEL, LGAS_BORDER, LGAS_FILL].forEach(id => {
    if (m.getLayer(id)) m.removeLayer(id);
  });
  if (m.getSource(LGAS_SOURCE)) m.removeSource(LGAS_SOURCE);
}

export async function addLGAsLayer(m: mapboxgl.Map, beforeLayer?: string, isDark = true) {
  removeLGAsLayer(m);
  const data = await loadLGAsGeoJSON();
  if (!data || !isMapAlive(m)) return;

  // Tertiary admin tier. Quiet cool slate on both themes — by far the lightest weight
  // in the boundary hierarchy so it only appears when you zoom in, never dominates.
  const borderColor = isDark ? '#64748b' : '#cbd5e1';
  const fillColor = isDark ? '#64748b' : '#cbd5e1';
  const labelColor = isDark ? '#94a3b8' : '#64748b';
  const haloColor = isDark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.95)';

  m.addSource(LGAS_SOURCE, { type: 'geojson', data, generateId: true });

  m.addLayer({
    id: LGAS_FILL, type: 'fill', source: LGAS_SOURCE,
    paint: {
      'fill-color': fillColor,
      'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], isDark ? 0.2 : 0.14, isDark ? 0.03 : 0.03],
    },
  }, beforeLayer);

  m.addLayer({
    id: LGAS_BORDER, type: 'line', source: LGAS_SOURCE,
    paint: {
      'line-color': borderColor,
      'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2.5, 0.5],
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.2, 7, 0.35, 10, 0.6],
    },
  }, beforeLayer);

  m.addLayer({
    id: LGAS_LABEL, type: 'symbol', source: LGAS_SOURCE,
    minzoom: 8,
    layout: {
      'text-field': ['get', 'shapeName'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 8, 8, 12, 11],
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
      'text-allow-overlap': false,
      'text-max-width': 7,
    },
    paint: {
      'text-color': labelColor,
      'text-halo-color': haloColor,
      'text-halo-width': isDark ? 1 : 1.6,
      'text-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 12, 0.9],
    },
  });

  installBoundaryHover(m);
}

// --- Pipelines Layer ---

const PIPELINE_ROUTES: { name: string; coords: [number, number][] }[] = [
  {
    name: 'Trans-Niger Pipeline',
    coords: [[7.16, 4.42], [7.01, 4.78], [7.08, 5.02], [6.77, 5.02]],
  },
  {
    name: 'Nembe Creek Trunk Line',
    coords: [[6.41, 4.52], [6.33, 4.88], [6.38, 5.10], [5.75, 5.57]],
  },
  {
    name: 'Escravos-Lagos Pipeline',
    coords: [[5.16, 5.59], [4.55, 5.83], [3.98, 6.10], [3.40, 6.45]],
  },
  {
    name: 'Forcados-Warri Pipeline',
    coords: [[5.43, 5.37], [5.52, 5.41], [5.75, 5.57]],
  },
  {
    name: 'Bonny-Port Harcourt Pipeline',
    coords: [[7.16, 4.42], [7.29, 4.65], [7.01, 4.78]],
  },
  {
    name: 'Gbaran-Ubie Trunk Line',
    coords: [[6.33, 4.88], [6.41, 4.52], [6.36, 4.48]],
  },
  {
    name: 'Qua Iboe Export Pipeline',
    coords: [[7.92, 4.65], [7.96, 4.54], [8.00, 4.40]],
  },
  {
    name: 'Obagi-Gbaran Pipeline',
    coords: [[6.77, 5.02], [6.33, 4.88]],
  },
];

function buildPipelineGeoJSON(): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: PIPELINE_ROUTES.map((route, i) => ({
      type: 'Feature' as const,
      id: i,
      geometry: { type: 'LineString' as const, coordinates: route.coords },
      properties: { name: route.name },
    })),
  };
}

export function removePipelinesLayer(m: mapboxgl.Map) {
  if (!isMapAlive(m)) return;
  [PIPELINES_LABEL, PIPELINES_LINE, PIPELINES_HIGHLIGHT].forEach(id => {
    if (m.getLayer(id)) m.removeLayer(id);
  });
  if (m.getSource(PIPELINES_SOURCE)) m.removeSource(PIPELINES_SOURCE);
}

export function addPipelinesLayer(m: mapboxgl.Map, _beforeLayer?: string, isDark = true) {
  removePipelinesLayer(m);
  if (!isMapAlive(m)) return;

  const lineColor = isDark ? '#ef4444' : '#dc2626';
  const glowColor = isDark ? '#fca5a5' : '#f87171';
  const labelColor = isDark ? '#fca5a5' : '#991b1b';
  const haloColor = isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';

  m.addSource(PIPELINES_SOURCE, { type: 'geojson', data: buildPipelineGeoJSON() });

  m.addLayer({
    id: PIPELINES_HIGHLIGHT, type: 'line', source: PIPELINES_SOURCE,
    paint: {
      'line-color': glowColor,
      'line-width': 10,
      'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.35, 0],
      'line-blur': 4,
    },
  });

  m.addLayer({
    id: PIPELINES_LINE, type: 'line', source: PIPELINES_SOURCE,
    paint: {
      'line-color': lineColor,
      'line-width': ['interpolate', ['linear'], ['zoom'], 5, 2, 8, 3, 12, 4],
      'line-opacity': isDark ? 0.85 : 0.9,
      'line-dasharray': [4, 2],
    },
  });

  m.addLayer({
    id: PIPELINES_LABEL, type: 'symbol', source: PIPELINES_SOURCE,
    minzoom: 8,
    layout: {
      'symbol-placement': 'line-center',
      'text-field': ['get', 'name'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 8, 9, 12, 12],
      'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
      'text-allow-overlap': false,
      'text-max-angle': 30,
    },
    paint: {
      'text-color': labelColor,
      'text-halo-color': haloColor,
      'text-halo-width': isDark ? 1.5 : 2,
    },
  });

  installBoundaryHover(m);
}

// --- Oil Blocks Layer ---

export function removeOilBlocksLayer(m: mapboxgl.Map) {
  if (!isMapAlive(m)) return;
  [OIL_BLOCKS_LABEL, OIL_BLOCKS_BORDER, OIL_BLOCKS_FILL].forEach(id => {
    if (m.getLayer(id)) m.removeLayer(id);
  });
  if (m.getSource(OIL_BLOCKS_SOURCE)) m.removeSource(OIL_BLOCKS_SOURCE);
}

export async function addOilBlocksLayer(m: mapboxgl.Map, beforeLayer?: string, isDark = true) {
  removeOilBlocksLayer(m);
  const data = await loadOilBlocksGeoJSON();
  if (!data || !isMapAlive(m)) return;

  // Secondary operational tier — quiet cool slate. Sits between the brand-teal state
  // border and the lightest-grey LGA border, so the three layers form a clear hierarchy:
  //   State (teal, primary) > Oil Blocks (mid-slate, secondary) > LGA (light slate, tertiary).
  const labelColor = isDark ? '#cbd5e1' : '#334155';
  const haloColor = isDark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.95)';

  // Terrain variants kept but flattened to pure luminance steps — no hue change, just
  // darker-for-deeper. Keeps the overall map calm.
  const fillColorExpr: mapboxgl.Expression = [
    'case',
    ['==', ['get', 'terrain'], 'Deep Water'], isDark ? '#1e293b' : '#64748b',
    ['==', ['get', 'terrain'], 'Shelf'], isDark ? '#334155' : '#94a3b8',
    isDark ? '#475569' : '#94a3b8',
  ];
  const borderColorExpr: mapboxgl.Expression = [
    'case',
    ['==', ['get', 'terrain'], 'Deep Water'], isDark ? '#94a3b8' : '#334155',
    ['==', ['get', 'terrain'], 'Shelf'], isDark ? '#64748b' : '#475569',
    isDark ? '#64748b' : '#475569',
  ];

  m.addSource(OIL_BLOCKS_SOURCE, { type: 'geojson', data, generateId: true });

  m.addLayer({
    id: OIL_BLOCKS_FILL, type: 'fill', source: OIL_BLOCKS_SOURCE,
    paint: {
      'fill-color': fillColorExpr,
      'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.35, 0.15],
    },
  }, beforeLayer);

  m.addLayer({
    id: OIL_BLOCKS_BORDER, type: 'line', source: OIL_BLOCKS_SOURCE,
    paint: {
      'line-color': borderColorExpr,
      'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 3, 1.5],
      'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, isDark ? 0.75 : 0.85],
    },
  }, beforeLayer);

  m.addLayer({
    id: OIL_BLOCKS_LABEL, type: 'symbol', source: OIL_BLOCKS_SOURCE,
    minzoom: 7,
    layout: {
      'text-field': ['get', 'name'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 7, 8, 10, 11, 13, 14],
      'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
      'text-allow-overlap': false,
      'text-max-width': 8,
    },
    paint: {
      'text-color': labelColor,
      'text-halo-color': haloColor,
      'text-halo-width': isDark ? 1.2 : 1.8,
      'text-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.5, 10, 0.9],
    },
  });

  installBoundaryHover(m);
}
