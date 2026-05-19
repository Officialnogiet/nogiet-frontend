/**
 * Square emissions grid for the Live Map.
 *
 * Aggregates point sources (Carbon Mapper + IMEO + ground facilities + measurements)
 * into a square geographic grid, coloring each cell by an emissions intensity proxy
 * scaled to ppb-equivalent thresholds (matches the legend in the client's reference
 * design — "0–1970 ppb", "1970–2000 ppb", … "2080+ ppb"). Cells whose centroid emission
 * intensity exceeds the upper threshold get the darkest fill so they stand out.
 *
 * The grid degrades gracefully: zero points → empty FeatureCollection (no draw artifacts).
 * Cell size is fixed in degrees to match the screenshots (≈0.25° ~ 25 km at the equator),
 * but {@link buildEmissionGrid} accepts a custom cell size so the same engine can drive
 * both a coarse "country" view and a finer drill-in.
 */

import type { FeatureCollection, Polygon } from "geojson";

export const PPB_BACKGROUND = 1880; // global mean CH4 column ~1880 ppb (approx UNEP 2024)
export const PPB_MAX_ENHANCEMENT = 220; // top-of-scale enhancement before "2080+ ppb"

export interface PpbBreak {
  /** Inclusive lower bound. */
  min: number;
  /** Exclusive upper bound; `Infinity` for the open-ended top bin. */
  max: number;
  /** Hex fill (light scheme). */
  color: string;
  /** Human label (matches the client's reference design). */
  label: string;
}

export const PPB_BREAKS: PpbBreak[] = [
  { min: 0, max: 1970, color: "#f1e7d7", label: "0–1970 ppb" },
  { min: 1970, max: 2000, color: "#f0d4a8", label: "1970–2000 ppb" },
  { min: 2000, max: 2030, color: "#e9a674", label: "2000–2030 ppb" },
  { min: 2030, max: 2060, color: "#d97a4d", label: "2030–2060 ppb" },
  { min: 2060, max: 2080, color: "#c64d2f", label: "2060–2080 ppb" },
  { min: 2080, max: Infinity, color: "#7a1d12", label: "2080+ ppb" },
];

/** Color used for the "Cells with notifications" highlight (legend last entry). */
export const NOTIFICATION_STROKE = "#0f172a";

export type EmissionStatistic = "max" | "average" | "sum";

export interface EmissionPoint {
  longitude: number;
  latitude: number;
  /** Methane emission rate in kg/hr — typically `emissionRate` on a normalized source. */
  emissionRate: number;
  /** Provider for tooltip / drill-in. */
  provider?: "carbon_mapper" | "imeo" | "tropomi" | "ground";
  /** Original source id (for drilling in to raw record). */
  sourceId?: string;
}

export interface GridCellProps extends Record<string, unknown> {
  cell_id: string;
  ppb: number;
  bin_min: number;
  bin_max: number;
  fill: string;
  count: number;
  total_rate: number;
  max_rate: number;
  has_alert: boolean;
  west: number;
  east: number;
  south: number;
  north: number;
}

export interface BuildGridOptions {
  /** Side length of each square cell in degrees. Default 0.25 (~25 km at equator). */
  cellDeg?: number;
  /** Statistic to drive cell color. Default `max`. */
  statistic?: EmissionStatistic;
  /** Optional alert threshold (kg/hr). Cells with any point exceeding this get `has_alert=true`. */
  alertThresholdKgHr?: number;
  /** Cells with no points are dropped; set true to keep them as transparent placeholders. */
  keepEmpty?: boolean;
}

interface CellAggregate {
  west: number;
  east: number;
  south: number;
  north: number;
  count: number;
  totalRate: number;
  maxRate: number;
  alert: boolean;
}

function snap(val: number, cellDeg: number): number {
  return Math.floor(val / cellDeg) * cellDeg;
}

function ppbBin(ppb: number): PpbBreak {
  for (const b of PPB_BREAKS) {
    if (ppb >= b.min && ppb < b.max) return b;
  }
  return PPB_BREAKS[PPB_BREAKS.length - 1];
}

/**
 * Map a kg/hr cell statistic to an approximate column-density enhancement in ppb.
 * This is a presentation transform, not science: it normalizes [0..1500] kg/hr to
 * [PPB_BACKGROUND..PPB_BACKGROUND+PPB_MAX_ENHANCEMENT] using a sqrt curve so small
 * leaks still register on the legend without saturating the scale.
 */
export function rateToPpb(rateKgHr: number): number {
  if (!Number.isFinite(rateKgHr) || rateKgHr <= 0) return PPB_BACKGROUND;
  const norm = Math.min(1, Math.sqrt(rateKgHr / 1500));
  return Math.round(PPB_BACKGROUND + norm * PPB_MAX_ENHANCEMENT);
}

/**
 * Build a square emissions grid (GeoJSON FeatureCollection) from arbitrary point sources.
 *
 * @example
 * const grid = buildEmissionGrid([{ longitude: 6.2, latitude: 5.2, emissionRate: 480 }]);
 * map.getSource('emission-grid').setData(grid);
 */
export function buildEmissionGrid(
  points: EmissionPoint[],
  options: BuildGridOptions = {},
): FeatureCollection<Polygon, GridCellProps> {
  const cellDeg = options.cellDeg ?? 0.25;
  const stat: EmissionStatistic = options.statistic ?? "max";
  const alertThreshold = options.alertThresholdKgHr ?? Infinity;

  if (cellDeg <= 0) {
    return { type: "FeatureCollection", features: [] };
  }

  const cells = new Map<string, CellAggregate>();

  for (const p of points) {
    if (
      !Number.isFinite(p.longitude) ||
      !Number.isFinite(p.latitude) ||
      Math.abs(p.longitude) < 1e-9 && Math.abs(p.latitude) < 1e-9
    ) continue;

    const west = snap(p.longitude, cellDeg);
    const south = snap(p.latitude, cellDeg);
    const key = `${west.toFixed(4)}_${south.toFixed(4)}`;
    let agg = cells.get(key);
    if (!agg) {
      agg = {
        west,
        east: west + cellDeg,
        south,
        north: south + cellDeg,
        count: 0,
        totalRate: 0,
        maxRate: 0,
        alert: false,
      };
      cells.set(key, agg);
    }
    const rate = Math.max(0, Number(p.emissionRate) || 0);
    agg.count += 1;
    agg.totalRate += rate;
    if (rate > agg.maxRate) agg.maxRate = rate;
    if (rate >= alertThreshold) agg.alert = true;
  }

  const features: FeatureCollection<Polygon, GridCellProps>["features"] = [];
  for (const [cell_id, agg] of cells) {
    const driver =
      stat === "average" ? agg.totalRate / Math.max(1, agg.count) :
        stat === "sum" ? agg.totalRate :
          agg.maxRate;

    if (!options.keepEmpty && driver <= 0 && !agg.alert) continue;

    const ppb = rateToPpb(driver);
    const bin = ppbBin(ppb);

    features.push({
      type: "Feature",
      properties: {
        cell_id,
        ppb,
        bin_min: bin.min,
        bin_max: bin.max === Infinity ? 9999 : bin.max,
        fill: bin.color,
        count: agg.count,
        total_rate: Math.round(agg.totalRate * 10) / 10,
        max_rate: Math.round(agg.maxRate * 10) / 10,
        has_alert: agg.alert,
        west: agg.west,
        east: agg.east,
        south: agg.south,
        north: agg.north,
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [agg.west, agg.south],
          [agg.east, agg.south],
          [agg.east, agg.north],
          [agg.west, agg.north],
          [agg.west, agg.south],
        ]],
      },
    });
  }

  return { type: "FeatureCollection", features };
}

/** Resolves a sensible cell size from the current map zoom. */
export function cellDegForZoom(zoom: number): number {
  if (zoom >= 11) return 0.04;   // ~4 km — drill-in
  if (zoom >= 9) return 0.08;
  if (zoom >= 7.5) return 0.15;
  if (zoom >= 6) return 0.25;
  return 0.5;                    // country / continental view
}
