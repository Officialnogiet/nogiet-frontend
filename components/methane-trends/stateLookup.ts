/**
 * Lat/Lon → Nigeria state lookup using the same `nigeria-states.geojson` the boundary
 * layers already load. Cached for the session; first call awaits the GeoJSON.
 */

interface StateFeatureRing {
  state: string;
  /** A "fingerprint" bbox so we can cheap-skip features before doing point-in-polygon. */
  bbox: [number, number, number, number]; // minLon,minLat,maxLon,maxLat
  rings: number[][][];
}

let cache: StateFeatureRing[] | null = null;
let inflight: Promise<StateFeatureRing[]> | null = null;

async function loadStates(): Promise<StateFeatureRing[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("/geojson/nigeria-states.geojson");
      if (!res.ok) throw new Error(`states geojson ${res.status}`);
      const data: any = await res.json();
      const features: any[] = Array.isArray(data?.features) ? data.features : [];
      const out: StateFeatureRing[] = [];
      for (const f of features) {
        const props = f.properties ?? {};
        const name: string = props.shapeName ?? props.NAME_1 ?? props.state ?? props.name ?? "";
        if (!name) continue;
        const geom = f.geometry;
        if (!geom) continue;
        const polys: number[][][] = [];
        if (geom.type === "Polygon") polys.push(...(geom.coordinates ?? []));
        else if (geom.type === "MultiPolygon") {
          for (const p of geom.coordinates ?? []) polys.push(...p);
        }
        if (polys.length === 0) continue;

        let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
        for (const ring of polys) {
          for (const [lon, lat] of ring) {
            if (lon < minLon) minLon = lon;
            if (lat < minLat) minLat = lat;
            if (lon > maxLon) maxLon = lon;
            if (lat > maxLat) maxLat = lat;
          }
        }
        out.push({ state: name, bbox: [minLon, minLat, maxLon, maxLat], rings: polys });
      }
      cache = out;
      return out;
    } catch {
      cache = [];
      return cache;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

function pointInRing(lon: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = (yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / ((yj - yi) || 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export async function lookupNigeriaState(lon: number, lat: number): Promise<string | null> {
  const states = await loadStates();
  if (!states.length) return null;
  for (const s of states) {
    const [minLon, minLat, maxLon, maxLat] = s.bbox;
    if (lon < minLon || lon > maxLon || lat < minLat || lat > maxLat) continue;
    for (const ring of s.rings) {
      if (pointInRing(lon, lat, ring)) return s.state;
    }
  }
  return null;
}

/** Bulk attribution helper — runs the lookup in parallel using already-loaded data. */
export async function attachStateNames<T extends { latitude: number; longitude: number }>(
  rows: T[],
): Promise<(T & { state: string | null })[]> {
  const states = await loadStates();
  if (!states.length) return rows.map((r) => ({ ...r, state: null }));
  return rows.map((r) => {
    let match: string | null = null;
    for (const s of states) {
      const [minLon, minLat, maxLon, maxLat] = s.bbox;
      if (r.longitude < minLon || r.longitude > maxLon || r.latitude < minLat || r.latitude > maxLat) continue;
      for (const ring of s.rings) {
        if (pointInRing(r.longitude, r.latitude, ring)) { match = s.state; break; }
      }
      if (match) break;
    }
    return { ...r, state: match };
  });
}
