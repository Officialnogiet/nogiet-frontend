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

// --- Shared popup singleton — only one boundary popup visible at a time ---
let sharedPopup: mapboxgl.Popup | null = null;

function getSharedPopup(): mapboxgl.Popup {
  if (!sharedPopup) {
    sharedPopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
      className: 'plume-popup',
    });
  }
  return sharedPopup;
}

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

// --- Popup HTML builders ---

function statePopupHTML(name: string, lng: number, lat: number): string {
  const zone = getZone(name);
  return `<div style="font-family:system-ui,sans-serif;font-size:12px;line-height:1.7;padding:4px 2px;">
    <div style="font-weight:800;font-size:14px;color:#2563eb;margin-bottom:2px;">${name} State</div>
    <div style="color:#64748b;"><span style="font-weight:600;color:#475569;">Region:</span> ${zone}</div>
    <div style="color:#64748b;"><span style="font-weight:600;color:#475569;">Lat:</span> ${lat.toFixed(4)}°N &nbsp; <span style="font-weight:600;color:#475569;">Lng:</span> ${lng.toFixed(4)}°E</div>
  </div>`;
}

function lgaPopupHTML(name: string, lng: number, lat: number): string {
  return `<div style="font-family:system-ui,sans-serif;font-size:12px;line-height:1.7;padding:4px 2px;">
    <div style="font-weight:800;font-size:13px;color:#7c3aed;margin-bottom:2px;">${name}</div>
    <div style="color:#64748b;"><span style="font-weight:600;color:#475569;">Type:</span> Local Government Area</div>
    <div style="color:#64748b;"><span style="font-weight:600;color:#475569;">Lat:</span> ${lat.toFixed(4)}°N &nbsp; <span style="font-weight:600;color:#475569;">Lng:</span> ${lng.toFixed(4)}°E</div>
  </div>`;
}

function pipelinePopupHTML(name: string, lng: number, lat: number): string {
  return `<div style="font-family:system-ui,sans-serif;font-size:12px;line-height:1.7;padding:4px 2px;">
    <div style="font-weight:800;font-size:13px;color:#dc2626;margin-bottom:2px;">${name}</div>
    <div style="color:#64748b;"><span style="font-weight:600;color:#475569;">Type:</span> Oil &amp; Gas Pipeline</div>
    <div style="color:#64748b;"><span style="font-weight:600;color:#475569;">Lat:</span> ${lat.toFixed(4)}°N &nbsp; <span style="font-weight:600;color:#475569;">Lng:</span> ${lng.toFixed(4)}°E</div>
  </div>`;
}

// --- Shared hover + popup helper (uses the singleton popup) ---

type PopupBuilder = (name: string, lng: number, lat: number) => string;

function setupHoverWithPopup(
  m: mapboxgl.Map,
  layerId: string,
  sourceId: string,
  buildHTML: PopupBuilder,
  nameKey = 'shapeName',
) {
  let hoveredId: string | number | null = null;
  const popup = getSharedPopup();

  const onMove = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
    if (!e.features?.length) return;
    const feat = e.features[0];
    if (hoveredId !== null) {
      try { m.setFeatureState({ source: sourceId, id: hoveredId }, { hover: false }); } catch { /* */ }
    }
    hoveredId = feat.id ?? null;
    if (hoveredId !== null) {
      try { m.setFeatureState({ source: sourceId, id: hoveredId }, { hover: true }); } catch { /* */ }
    }
    m.getCanvas().style.cursor = 'pointer';
    const name = feat.properties?.[nameKey] ?? 'Unknown';
    popup.setLngLat(e.lngLat).setHTML(buildHTML(name, e.lngLat.lng, e.lngLat.lat)).addTo(m);
  };

  const onLeave = () => {
    if (hoveredId !== null) {
      try { m.setFeatureState({ source: sourceId, id: hoveredId }, { hover: false }); } catch { /* */ }
    }
    hoveredId = null;
    m.getCanvas().style.cursor = '';
    popup.remove();
  };

  m.on('mousemove', layerId, onMove);
  m.on('mouseleave', layerId, onLeave);

  return { onMove, onLeave, popup };
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

  const borderColor = isDark ? '#60a5fa' : '#2563eb';
  const fillColor = isDark ? '#60a5fa' : '#3b82f6';
  const labelColor = isDark ? '#93bbfd' : '#1e40af';
  const haloColor = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)';

  m.addSource(STATES_SOURCE, { type: 'geojson', data, generateId: true });

  m.addLayer({
    id: STATES_FILL, type: 'fill', source: STATES_SOURCE,
    paint: {
      'fill-color': fillColor,
      'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.2, 0.04],
    },
  }, beforeLayer);

  m.addLayer({
    id: STATES_BORDER, type: 'line', source: STATES_SOURCE,
    paint: {
      'line-color': borderColor,
      'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 3, 1.2],
      'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, isDark ? 0.6 : 0.7],
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

  setupHoverWithPopup(m, STATES_FILL, STATES_SOURCE, statePopupHTML, 'shapeName');
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

  const borderColor = isDark ? '#a78bfa' : '#7c3aed';
  const fillColor = isDark ? '#a78bfa' : '#8b5cf6';
  const labelColor = isDark ? '#c4b5fd' : '#5b21b6';
  const haloColor = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)';

  m.addSource(LGAS_SOURCE, { type: 'geojson', data, generateId: true });

  m.addLayer({
    id: LGAS_FILL, type: 'fill', source: LGAS_SOURCE,
    paint: {
      'fill-color': fillColor,
      'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.2, 0.03],
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

  setupHoverWithPopup(m, LGAS_FILL, LGAS_SOURCE, lgaPopupHTML, 'shapeName');
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

  setupHoverWithPopup(m, PIPELINES_LINE, PIPELINES_SOURCE, pipelinePopupHTML, 'name');
}
