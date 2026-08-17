import type {
  AnnualRow,
  FeedSeries,
  GeoLocation,
  GroupByMode,
  MonthlyPoint,
  ProviderId,
  ProviderSeries,
} from "./types";
import { getRegionForState } from "./regions";
import { buildFeed, feedKey, parseFeedKey, normalizeInstrument, type FeedKey } from "./feeds";

/** Convert any string to a yyyy-MM key, or `null` if unparseable. */
export function isoMonth(input: unknown): string | null {
  if (!input) return null;
  if (typeof input === "number") {
    const d = new Date(input);
    return Number.isFinite(d.getTime()) ? toMonth(d) : null;
  }
  if (typeof input !== "string") return null;
  const d = new Date(input);
  if (!Number.isFinite(d.getTime())) return null;
  return toMonth(d);
}

function toMonth(d: Date): string {
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${d.getUTCFullYear()}-${m}`;
}

/** Generate consecutive yyyy-MM tags from `start` to `end` inclusive. */
export function monthRange(start: string, end: string): string[] {
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  if (![sy, sm, ey, em].every((n) => Number.isFinite(n))) return [];
  const out: string[] = [];
  let y = sy;
  let m = sm;
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

const PROVIDER_LABELS: Record<ProviderId, string> = {
  carbon_mapper: "Carbon Mapper",
  imeo: "IMEO (UNEP)",
  tropomi: "TROPOMI",
  emit: "NASA EMIT",
};

const PROVIDER_COLORS: Record<ProviderId, string> = {
  carbon_mapper: "#0d9488",
  imeo: "#22d3ee",
  tropomi: "#a78bfa",
  emit: "#f59e0b",
};

interface RawObservation {
  provider: ProviderId;
  date: string;
  emissionRate: number;
  /** Optional — the satellite instrument (e.g. "EnMAP - DLR"). When present, enables feed splits. */
  instrument?: string | null;
}

/** Collapse a stream of point observations into per-provider monthly series + rolling avg. */
export function buildProviderSeries(
  rows: RawObservation[],
  rangeStart: string,
  rangeEnd: string,
  rollingWindow = 12,
): ProviderSeries[] {
  const months = monthRange(rangeStart, rangeEnd);
  if (months.length === 0) return [];

  const buckets = new Map<ProviderId, Map<string, { sum: number; count: number }>>();
  for (const row of rows) {
    const m = isoMonth(row.date);
    if (!m || !months.includes(m)) continue;
    let providerBucket = buckets.get(row.provider);
    if (!providerBucket) {
      providerBucket = new Map();
      buckets.set(row.provider, providerBucket);
    }
    const cell = providerBucket.get(m) ?? { sum: 0, count: 0 };
    cell.sum += Number.isFinite(row.emissionRate) ? row.emissionRate : 0;
    cell.count += 1;
    providerBucket.set(m, cell);
  }

  const series: ProviderSeries[] = [];
  for (const [provider, providerBucket] of buckets) {
    const points: MonthlyPoint[] = months.map((month) => {
      const cell = providerBucket.get(month);
      return cell && cell.count > 0
        ? { month, value: cell.sum / cell.count, count: cell.count }
        : { month, value: null, count: 0 };
    });
    series.push({
      provider,
      label: PROVIDER_LABELS[provider],
      color: PROVIDER_COLORS[provider],
      points,
      rolling: rollingMean(points.map((p) => p.value), rollingWindow),
    });
  }

  // Stable sort: carbon_mapper > imeo > tropomi for legend order
  const order: ProviderId[] = ["carbon_mapper", "imeo", "tropomi"];
  series.sort((a, b) => order.indexOf(a.provider) - order.indexOf(b.provider));
  return series;
}

/* ---------------------- Feed series (per-instrument splits) ---------------------- */

/**
 * Same shape as {@link buildProviderSeries}, but groups by **feed** (provider + instrument).
 * IMEO becomes one series per instrument (EnMAP, Sentinel-2, GHGSat, …); Carbon Mapper /
 * TROPOMI typically resolve to a single feed each. Returns the series sorted by:
 *   1. provider order (Carbon Mapper → IMEO → TROPOMI)
 *   2. observation count (descending) so the busiest IMEO instrument anchors the legend.
 */
export function buildFeedSeries(
  rows: RawObservation[],
  rangeStart: string,
  rangeEnd: string,
  rollingWindow = 12,
  options: { splitImeoByInstrument?: boolean } = {},
): FeedSeries[] {
  const months = monthRange(rangeStart, rangeEnd);
  if (months.length === 0) return [];
  const splitImeo = options.splitImeoByInstrument ?? true;

  const buckets = new Map<FeedKey, Map<string, { sum: number; count: number }>>();
  const totals = new Map<FeedKey, number>();

  for (const row of rows) {
    const m = isoMonth(row.date);
    if (!m || !months.includes(m)) continue;
    // Provider-only key when feed splitting is disabled OR provider is not IMEO.
    const useFeed = splitImeo || row.provider === "imeo";
    const key = useFeed
      ? feedKey(row.provider, row.instrument ?? null)
      : feedKey(row.provider, row.provider);
    let bucket = buckets.get(key);
    if (!bucket) { bucket = new Map(); buckets.set(key, bucket); }
    const cell = bucket.get(m) ?? { sum: 0, count: 0 };
    cell.sum += Number.isFinite(row.emissionRate) ? row.emissionRate : 0;
    cell.count += 1;
    bucket.set(m, cell);
    totals.set(key, (totals.get(key) ?? 0) + 1);
  }

  const series: FeedSeries[] = [];
  for (const [key, monthBucket] of buckets) {
    const { provider, instrument } = parseFeedKey(key);
    const feed = buildFeed(provider, instrument);
    const points: MonthlyPoint[] = months.map((month) => {
      const cell = monthBucket.get(month);
      return cell && cell.count > 0
        ? { month, value: cell.sum / cell.count, count: cell.count }
        : { month, value: null, count: 0 };
    });
    series.push({
      feedKey: key,
      provider,
      instrument: feed.instrument,
      label: feed.label,
      color: feed.color,
      points,
      rolling: rollingMean(points.map((p) => p.value), rollingWindow),
    });
  }

  const order: ProviderId[] = ["carbon_mapper", "imeo", "tropomi"];
  series.sort((a, b) => {
    const dp = order.indexOf(a.provider) - order.indexOf(b.provider);
    if (dp !== 0) return dp;
    return (totals.get(b.feedKey) ?? 0) - (totals.get(a.feedKey) ?? 0);
  });
  return series;
}

/** Centered rolling mean, returns `null` for windows with no data. */
export function rollingMean(values: (number | null)[], window: number): (number | null)[] {
  const out: (number | null)[] = [];
  const half = Math.floor(window / 2);
  for (let i = 0; i < values.length; i++) {
    const lo = Math.max(0, i - half);
    const hi = Math.min(values.length, i + half + 1);
    let sum = 0;
    let count = 0;
    for (let j = lo; j < hi; j++) {
      const v = values[j];
      if (v != null) {
        sum += v;
        count += 1;
      }
    }
    out.push(count > 0 ? sum / count : null);
  }
  return out;
}

/** Canonical observation shape consumed by the annual aggregation. */
export interface AnnualObservation {
  provider: ProviderId;
  /** Underlying instrument when known (e.g. "EnMAP - DLR" via IMEO). */
  instrument?: string | null;
  date: string;
  emissionRate: number;
  /** Resolved Nigerian state name (or null when point is outside Nigeria). */
  state: string | null;
  /** Optional facility name (used when groupBy === 'facility'). */
  facility?: string | null;
  latitude: number;
  longitude: number;
}

const PROVIDER_ORDER: ProviderId[] = ["carbon_mapper", "imeo", "tropomi"];

interface AggCell {
  sum: number;
  count: number;
  byProvider: Record<ProviderId, { sum: number; count: number }>;
  /** Per-feed (provider+instrument) sums — keyed by `feedKey`. */
  byFeed: Map<FeedKey, { sum: number; count: number; provider: ProviderId; instrument: string }>;
}

interface GroupAggregate {
  key: string;
  region: string | null;
  geoSumLat: number;
  geoSumLon: number;
  geoCount: number;
  perYear: Map<number, AggCell>;
  /** Union of feeds seen in this group (for the row's per-feed table headers). */
  feeds: Set<FeedKey>;
}

function emptyCell(): AggCell {
  return {
    sum: 0,
    count: 0,
    byProvider: {
      carbon_mapper: { sum: 0, count: 0 },
      imeo: { sum: 0, count: 0 },
      tropomi: { sum: 0, count: 0 },
      emit: { sum: 0, count: 0 },
    },
    byFeed: new Map(),
  };
}

function emptyByProvider(): Record<ProviderId, Record<number, number | null>> {
  return { carbon_mapper: {}, imeo: {}, tropomi: {}, emit: {} };
}

function rollupFeed(
  cell: AggCell,
  provider: ProviderId,
  instrument: string | null | undefined,
  rate: number,
): FeedKey {
  const key = feedKey(provider, instrument);
  let f = cell.byFeed.get(key);
  if (!f) {
    f = { sum: 0, count: 0, provider, instrument: normalizeInstrument(instrument) };
    cell.byFeed.set(key, f);
  }
  f.sum += rate;
  f.count += 1;
  return key;
}

function classifyKey(row: AnnualObservation, mode: GroupByMode): { key: string; region: string | null } | null {
  if (mode === "state") {
    if (!row.state) return null;
    return { key: row.state, region: getRegionForState(row.state) };
  }
  if (mode === "region") {
    const region = getRegionForState(row.state);
    if (!region) return null;
    return { key: region, region };
  }
  // facility
  const fac = (row.facility ?? "").trim();
  if (!fac) return null;
  return { key: fac, region: getRegionForState(row.state) };
}

/**
 * Year-by-year average per group (state / region / facility), with year-over-year % change,
 * per-provider breakdown, and centroid coordinates.
 *
 * @param rows         Stream of normalized observations (each carries provider + state + lat/lon)
 * @param years        Years to compute (column order in the table)
 * @param mode         Grouping dimension
 * @param globalLabel  Label for the synthetic top row aggregating every observation
 */
export function buildAnnualTable(
  rows: AnnualObservation[],
  years: number[],
  mode: GroupByMode,
  globalLabel = "Nigeria",
): AnnualRow[] {
  if (years.length === 0) return [];

  const groups = new Map<string, GroupAggregate>();

  for (const row of rows) {
    if (!Number.isFinite(row.emissionRate)) continue;
    const d = new Date(row.date);
    if (!Number.isFinite(d.getTime())) continue;
    const yr = d.getUTCFullYear();
    if (!years.includes(yr)) continue;

    const cls = classifyKey(row, mode);
    if (!cls) continue;

    let g = groups.get(cls.key);
    if (!g) {
      g = {
        key: cls.key,
        region: cls.region,
        geoSumLat: 0,
        geoSumLon: 0,
        geoCount: 0,
        perYear: new Map(),
        feeds: new Set(),
      };
      groups.set(cls.key, g);
    }
    if (Number.isFinite(row.latitude) && Number.isFinite(row.longitude)) {
      g.geoSumLat += row.latitude;
      g.geoSumLon += row.longitude;
      g.geoCount += 1;
    }
    let cell = g.perYear.get(yr);
    if (!cell) { cell = emptyCell(); g.perYear.set(yr, cell); }
    cell.sum += row.emissionRate;
    cell.count += 1;
    const provBucket = cell.byProvider[row.provider];
    if (provBucket) {
      provBucket.sum += row.emissionRate;
      provBucket.count += 1;
    }
    g.feeds.add(rollupFeed(cell, row.provider, row.instrument, row.emissionRate));
  }

  const rowsOut: AnnualRow[] = [];
  for (const g of groups.values()) {
    const averages: Record<number, number | null> = {};
    const countsByYear: Record<number, number> = {};
    const byProvider = emptyByProvider();
    const byFeed: AnnualRow["byFeed"] = {};

    // Initialise byFeed envelope so even feeds with zero this-year obs still appear if seen historically.
    for (const fkey of g.feeds) {
      const { provider, instrument } = parseFeedKey(fkey);
      const feed = buildFeed(provider, instrument);
      byFeed[fkey] = {
        feedKey: fkey,
        provider,
        instrument: feed.instrument,
        label: feed.label,
        color: feed.color,
        averages: {},
        countsByYear: {},
      };
    }

    for (const y of years) {
      const cell = g.perYear.get(y);
      averages[y] = cell && cell.count > 0 ? cell.sum / cell.count : null;
      countsByYear[y] = cell ? cell.count : 0;
      for (const p of PROVIDER_ORDER) {
        const pb = cell?.byProvider[p];
        byProvider[p][y] = pb && pb.count > 0 ? pb.sum / pb.count : null;
      }
      // Feed roll-up for this year
      for (const fkey of g.feeds) {
        const f = byFeed[fkey];
        const fb = cell?.byFeed.get(fkey);
        f.averages[y] = fb && fb.count > 0 ? fb.sum / fb.count : null;
        f.countsByYear[y] = fb ? fb.count : 0;
      }
    }

    const changes: Record<number, number | null> = {};
    for (let i = 0; i < years.length; i++) {
      const cur = averages[years[i]];
      const prev = i === 0 ? null : averages[years[i - 1]];
      changes[years[i]] = cur != null && prev != null && prev !== 0 ? ((cur - prev) / prev) * 100 : null;
    }

    const geo: GeoLocation | null = g.geoCount > 0
      ? { latitude: g.geoSumLat / g.geoCount, longitude: g.geoSumLon / g.geoCount, count: g.geoCount }
      : null;

    rowsOut.push({
      key: g.key,
      region: g.region,
      geo,
      averages,
      changes,
      byProvider,
      byFeed,
      countsByYear,
    });
  }

  // ---- Synthetic global row over ALL observations ----
  const globalAverages: Record<number, number | null> = {};
  const globalCounts: Record<number, number> = {};
  const globalByProvider = emptyByProvider();
  const globalByFeedSums = new Map<FeedKey, Map<number, { sum: number; count: number; provider: ProviderId; instrument: string }>>();
  let globalLat = 0, globalLon = 0, globalGeoCount = 0;

  for (const y of years) {
    let sum = 0; let count = 0;
    const perProv: Record<ProviderId, { sum: number; count: number }> = {
      carbon_mapper: { sum: 0, count: 0 },
      imeo: { sum: 0, count: 0 },
      tropomi: { sum: 0, count: 0 },
      emit: { sum: 0, count: 0 },
    };
    for (const row of rows) {
      if (!Number.isFinite(row.emissionRate)) continue;
      const d = new Date(row.date);
      if (!Number.isFinite(d.getTime())) continue;
      if (d.getUTCFullYear() !== y) continue;
      sum += row.emissionRate;
      count += 1;
      const pb = perProv[row.provider];
      if (pb) { pb.sum += row.emissionRate; pb.count += 1; }
      if (Number.isFinite(row.latitude) && Number.isFinite(row.longitude)) {
        globalLat += row.latitude; globalLon += row.longitude; globalGeoCount += 1;
      }
      const fk = feedKey(row.provider, row.instrument ?? null);
      let perYear = globalByFeedSums.get(fk);
      if (!perYear) { perYear = new Map(); globalByFeedSums.set(fk, perYear); }
      const cell = perYear.get(y) ?? {
        sum: 0, count: 0,
        provider: row.provider,
        instrument: normalizeInstrument(row.instrument),
      };
      cell.sum += row.emissionRate;
      cell.count += 1;
      perYear.set(y, cell);
    }
    globalAverages[y] = count > 0 ? sum / count : null;
    globalCounts[y] = count;
    for (const p of PROVIDER_ORDER) {
      globalByProvider[p][y] = perProv[p].count > 0 ? perProv[p].sum / perProv[p].count : null;
    }
  }

  const globalChanges: Record<number, number | null> = {};
  for (let i = 0; i < years.length; i++) {
    const cur = globalAverages[years[i]];
    const prev = i === 0 ? null : globalAverages[years[i - 1]];
    globalChanges[years[i]] = cur != null && prev != null && prev !== 0 ? ((cur - prev) / prev) * 100 : null;
  }

  // Materialise the global row's byFeed envelope.
  const globalByFeed: AnnualRow["byFeed"] = {};
  for (const [fk, perYear] of globalByFeedSums) {
    const sample = [...perYear.values()][0];
    if (!sample) continue;
    const feed = buildFeed(sample.provider, sample.instrument);
    const averages: Record<number, number | null> = {};
    const countsByYear: Record<number, number> = {};
    for (const y of years) {
      const cell = perYear.get(y);
      averages[y] = cell && cell.count > 0 ? cell.sum / cell.count : null;
      countsByYear[y] = cell ? cell.count : 0;
    }
    globalByFeed[fk] = {
      feedKey: fk,
      provider: sample.provider,
      instrument: feed.instrument,
      label: feed.label,
      color: feed.color,
      averages,
      countsByYear,
    };
  }

  const globalRow: AnnualRow = {
    key: globalLabel,
    region: null,
    geo: globalGeoCount > 0
      ? { latitude: globalLat / globalGeoCount, longitude: globalLon / globalGeoCount, count: globalGeoCount }
      : null,
    averages: globalAverages,
    changes: globalChanges,
    byProvider: globalByProvider,
    byFeed: globalByFeed,
    countsByYear: globalCounts,
  };

  rowsOut.sort((a, b) => a.key.localeCompare(b.key));
  return [globalRow, ...rowsOut];
}

/** @deprecated Use {@link buildAnnualTable}. Kept for any legacy callers. */
export function buildAnnualStateTable(
  rows: { state: string; date: string; emissionRate: number }[],
  years: number[],
  globalRowName = "Global",
): AnnualRow[] {
  return buildAnnualTable(
    rows.map((r) => ({
      provider: "carbon_mapper" as ProviderId,
      date: r.date,
      emissionRate: r.emissionRate,
      state: r.state,
      latitude: 0,
      longitude: 0,
    })),
    years,
    "state",
    globalRowName,
  );
}
