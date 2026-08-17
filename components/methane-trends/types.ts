/** Domain types for the Methane Trends screens. */

export type ProviderId = 'carbon_mapper' | 'imeo' | 'tropomi' | 'emit';

/** Group-by options for the Annual Statistics table. */
export type GroupByMode = 'state' | 'region' | 'facility';

export interface MonthlyPoint {
  /** ISO yyyy-MM, e.g. "2024-04". */
  month: string;
  /** Mean emission rate (kg/hr) for the month, or null if no observations. */
  value: number | null;
  /** Number of observations included in the bucket (used for confidence shading). */
  count: number;
}

export interface ProviderSeries {
  provider: ProviderId;
  label: string;
  color: string;
  points: MonthlyPoint[];
  /** Rolling mean (12-period) aligned 1:1 with `points`. */
  rolling: (number | null)[];
}

/**
 * A "feed" is (provider, instrument). IMEO returns plumes from many independent
 * satellites (EnMAP, Sentinel-2, GHGSat, …) — each is its own feed and gets its own
 * series in the Trends chart. Carbon Mapper / TROPOMI typically resolve to one feed each.
 */
export interface FeedSeries {
  /** Stable id — `${provider}::${instrument}` (see `feeds.ts → feedKey`). */
  feedKey: string;
  provider: ProviderId;
  instrument: string;
  label: string;
  color: string;
  points: MonthlyPoint[];
  /** Rolling mean (12-period) aligned 1:1 with `points`. */
  rolling: (number | null)[];
}

/**
 * Geographic centroid of the underlying observations for an annual row.
 * Useful for drilling in to the live map at the same location.
 */
export interface GeoLocation {
  /** Decimal degrees, signed. */
  latitude: number;
  longitude: number;
  /** Number of observations contributing to the centroid. */
  count: number;
}

/** Aggregated row in the Annual Statistics table — works for any group-by mode. */
export interface AnnualRow {
  /** Display label (state name, region name, facility name, or "Nigeria"/"Global"). */
  key: string;
  /** Geopolitical zone for state rows (e.g. "South South"). Same as key for region rows. */
  region: string | null;
  /** Centroid of the rows feeding this row, or `null` for the global row. */
  geo: GeoLocation | null;
  /** Yearly average across all providers. */
  averages: Record<number, number | null>;
  /** Year-over-year change in percent across all providers. */
  changes: Record<number, number | null>;
  /** Per-provider per-year averages (kept for callers that don't care about instruments). */
  byProvider: Record<ProviderId, Record<number, number | null>>;
  /** Per-feed (provider+instrument) per-year averages — IMEO splits into multiple entries. */
  byFeed: Record<string, {
    feedKey: string;
    provider: ProviderId;
    instrument: string;
    label: string;
    color: string;
    averages: Record<number, number | null>;
    countsByYear: Record<number, number>;
  }>;
  /** Total observations contributing to this row, per year. */
  countsByYear: Record<number, number>;
}

/** @deprecated kept for legacy imports — use AnnualRow. */
export type AnnualStateRow = AnnualRow;
