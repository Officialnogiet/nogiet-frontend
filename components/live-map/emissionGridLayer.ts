/**
 * Mapbox layer wiring for the square emissions grid.
 *
 * Public API matches `boundaryLayers.ts`:
 *   - `addEmissionGridLayer(map, data, theme)`
 *   - `updateEmissionGridLayer(map, data)`
 *   - `removeEmissionGridLayer(map)`
 *
 * The grid sits **below** the satellite plume points so plume markers stay legible.
 */

import type mapboxgl from "mapbox-gl";
import type { Expression } from "mapbox-gl";
import type { FeatureCollection, Polygon } from "geojson";
import { PPB_BREAKS, type GridCellProps, NOTIFICATION_STROKE } from "./emissionGrid";

export const EMISSION_GRID_SOURCE = "emission-grid-source";
export const EMISSION_GRID_FILL = "emission-grid-fill";
export const EMISSION_GRID_BORDER = "emission-grid-border";
export const EMISSION_GRID_ALERT = "emission-grid-alert-border";

/** Step expression mapping `ppb` → fill color, derived from `PPB_BREAKS`. */
function ppbColorExpression(): Expression {
  // ['step', input, output_default, stop1, output1, stop2, output2, ...]
  const expr: any[] = ["step", ["get", "ppb"], PPB_BREAKS[0].color];
  for (let i = 1; i < PPB_BREAKS.length; i++) {
    expr.push(PPB_BREAKS[i].min, PPB_BREAKS[i].color);
  }
  return expr as Expression;
}

export interface EmissionGridOptions {
  darkMode: boolean;
  /** Insert grid layers BEFORE this layer id (so plume points / labels render on top). */
  beforeLayerId?: string;
}

export function addEmissionGridLayer(
  map: mapboxgl.Map,
  data: FeatureCollection<Polygon, GridCellProps>,
  opts: EmissionGridOptions,
): void {
  if (!map.getSource(EMISSION_GRID_SOURCE)) {
    map.addSource(EMISSION_GRID_SOURCE, { type: "geojson", data });
  } else {
    (map.getSource(EMISSION_GRID_SOURCE) as mapboxgl.GeoJSONSource).setData(data);
  }

  const before = opts.beforeLayerId && map.getLayer(opts.beforeLayerId)
    ? opts.beforeLayerId
    : undefined;

  if (!map.getLayer(EMISSION_GRID_FILL)) {
    map.addLayer(
      {
        id: EMISSION_GRID_FILL,
        type: "fill",
        source: EMISSION_GRID_SOURCE,
        paint: {
          "fill-color": ppbColorExpression(),
          "fill-opacity": [
            "interpolate", ["linear"], ["zoom"],
            3, opts.darkMode ? 0.35 : 0.55,
            7, opts.darkMode ? 0.5 : 0.65,
            10, opts.darkMode ? 0.6 : 0.7,
          ] as Expression,
          "fill-antialias": true,
        },
      },
      before,
    );
  }

  if (!map.getLayer(EMISSION_GRID_BORDER)) {
    map.addLayer(
      {
        id: EMISSION_GRID_BORDER,
        type: "line",
        source: EMISSION_GRID_SOURCE,
        paint: {
          "line-color": opts.darkMode ? "#475569" : "#94a3b8",
          "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.4, 8, 0.7, 12, 1] as Expression,
          "line-opacity": opts.darkMode ? 0.5 : 0.4,
        },
      },
      before,
    );
  }

  if (!map.getLayer(EMISSION_GRID_ALERT)) {
    map.addLayer(
      {
        id: EMISSION_GRID_ALERT,
        type: "line",
        source: EMISSION_GRID_SOURCE,
        filter: ["==", ["get", "has_alert"], true],
        paint: {
          "line-color": NOTIFICATION_STROKE,
          "line-width": ["interpolate", ["linear"], ["zoom"], 4, 1.4, 8, 2.2, 12, 3] as Expression,
          "line-opacity": 0.9,
        },
      },
      before,
    );
  }
}

export function updateEmissionGridLayer(
  map: mapboxgl.Map,
  data: FeatureCollection<Polygon, GridCellProps>,
): void {
  const src = map.getSource(EMISSION_GRID_SOURCE) as mapboxgl.GeoJSONSource | undefined;
  if (src) src.setData(data);
}

export function removeEmissionGridLayer(map: mapboxgl.Map): void {
  for (const id of [EMISSION_GRID_ALERT, EMISSION_GRID_BORDER, EMISSION_GRID_FILL]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(EMISSION_GRID_SOURCE)) map.removeSource(EMISSION_GRID_SOURCE);
}

export function setEmissionGridTheme(map: mapboxgl.Map, darkMode: boolean): void {
  if (map.getLayer(EMISSION_GRID_BORDER)) {
    map.setPaintProperty(EMISSION_GRID_BORDER, "line-color", darkMode ? "#475569" : "#94a3b8");
    map.setPaintProperty(EMISSION_GRID_BORDER, "line-opacity", darkMode ? 0.5 : 0.4);
  }
  if (map.getLayer(EMISSION_GRID_FILL)) {
    map.setPaintProperty(
      EMISSION_GRID_FILL,
      "fill-opacity",
      [
        "interpolate", ["linear"], ["zoom"],
        3, darkMode ? 0.35 : 0.55,
        7, darkMode ? 0.5 : 0.65,
        10, darkMode ? 0.6 : 0.7,
      ] as Expression,
    );
  }
}
