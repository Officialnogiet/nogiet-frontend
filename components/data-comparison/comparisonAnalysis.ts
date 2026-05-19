/**
 * Pure analytical helpers for the Data Comparison screen.
 *
 * The job: given a stream of ground methane readings and a stream of satellite
 * detections (from any provider), produce a structured "do they agree?" view.
 *
 * The product question is: *Does what the satellite saw match what the operator
 * reports?* Everything here flows from that — pairing, verdicts, summaries.
 */

import type { ProviderId } from '../methane-trends/types';

/* ───────────────────────────── Domain types ───────────────────────────── */

/** Wire shape returned by the backend `/comparison/:facilityId` endpoint. */
export interface ComparisonSatelliteRow {
  source_name: string;
  lat?: number;
  lon?: number;
  emission_rate?: number;
  emission_uncertainty?: number;
  plume_count?: number;
  instrument?: string;
  first_detected?: string;
  last_detected?: string;
  distanceKm?: number;
  /** Provider added by the upgraded backend (`carbon_mapper` | `imeo` | `tropomi`). */
  provider?: ProviderId;
}

export interface ComparisonGroundRow {
  measurementDate: string;
  methaneReading: number;
  methodology?: string;
  latitude?: number;
  longitude?: number;
}

/* Normalised observations used everywhere downstream. */

export interface SatelliteObservation {
  id: string;
  sourceName: string;
  provider: ProviderId;
  instrument: string;
  /** Best-effort detection timestamp. */
  date: Date;
  /** kg/hr. */
  rate: number;
  uncertainty: number;
  distanceKm: number;
  latitude: number;
  longitude: number;
  raw: ComparisonSatelliteRow;
}

export interface GroundObservation {
  id: string;
  date: Date;
  /** kg/hr. */
  reading: number;
  methodology: string;
  raw: ComparisonGroundRow;
}

/* Verdict + matching */

export type Verdict =
  | 'confirmed'        // ground & satellite agree within ±tolerance
  | 'under_reported'   // satellite higher than ground by > tolerance
  | 'over_reported'    // ground higher than satellite by > tolerance
  | 'satellite_only'   // no ground reading within time tolerance
  | 'ground_only';     // no satellite detection within time tolerance

export interface MatchedPair {
  /** A stable id useful for React keys. */
  id: string;
  verdict: Verdict;
  satellite: SatelliteObservation | null;
  ground: GroundObservation | null;
  /** Days between the satellite + ground timestamps (null when unmatched). */
  deltaDays: number | null;
  /** `satellite.rate - ground.reading` (null when unmatched). */
  deltaRate: number | null;
  /** `satellite.rate / ground.reading` (null when unmatched / divide-by-zero). */
  ratio: number | null;
}

export interface ComparisonSummary {
  totalSatellite: number;
  totalGround: number;
  confirmed: number;
  underReported: number;
  overReported: number;
  satelliteOnly: number;
  groundOnly: number;
  /** Mean ground reading (kg/hr) over the window. */
  meanGround: number;
  /** Mean satellite emission rate (kg/hr) over the window. */
  meanSatellite: number;
  /** `meanSatellite / meanGround` (when divisor positive). */
  meanRatio: number | null;
  /** Coverage window in days. */
  windowDays: number;
}

export interface MatchOptions {
  /** Maximum |Δt| between a satellite detection and a ground reading to consider it a match. */
  toleranceDays: number;
  /** Discrepancy band: |Δrate / max(rate)| ≤ this is "confirmed". Default 0.25 → ±25%. */
  agreementBand: number;
}

export const DEFAULT_MATCH_OPTIONS: MatchOptions = {
  toleranceDays: 7,
  agreementBand: 0.25,
};

/* ───────────────────────────── Normalization ───────────────────────────── */

const PROVIDER_FALLBACK: ProviderId = 'carbon_mapper';

function safeDate(input: unknown): Date | null {
  if (!input) return null;
  const d = new Date(input as string);
  return Number.isFinite(d.getTime()) ? d : null;
}

export function normaliseSatellite(rows: ComparisonSatelliteRow[]): SatelliteObservation[] {
  const out: SatelliteObservation[] = [];
  for (const r of rows ?? []) {
    const date = safeDate(r.last_detected) ?? safeDate(r.first_detected);
    if (!date) continue;
    out.push({
      id: `sat:${r.source_name}:${date.getTime()}`,
      sourceName: r.source_name ?? 'Unknown source',
      provider: (r.provider ?? PROVIDER_FALLBACK) as ProviderId,
      instrument: r.instrument ?? '',
      date,
      rate: Number(r.emission_rate ?? 0),
      uncertainty: Number(r.emission_uncertainty ?? 0),
      distanceKm: Number(r.distanceKm ?? 0),
      latitude: Number(r.lat ?? 0),
      longitude: Number(r.lon ?? 0),
      raw: r,
    });
  }
  return out;
}

export function normaliseGround(rows: ComparisonGroundRow[]): GroundObservation[] {
  const out: GroundObservation[] = [];
  for (const r of rows ?? []) {
    const date = safeDate(r.measurementDate);
    if (!date) continue;
    out.push({
      id: `gnd:${date.getTime()}:${r.methaneReading}`,
      date,
      reading: Number(r.methaneReading ?? 0),
      methodology: r.methodology ?? 'N/A',
      raw: r,
    });
  }
  return out;
}

/* ───────────────────────────── Matching engine ───────────────────────────── */

/**
 * Greedy nearest-time matcher.
 *
 * For every satellite observation, find the closest (in time) ground reading
 * within `toleranceDays`. Ground readings are consumed at most once. Whatever
 * is left over becomes "satellite_only" / "ground_only".
 *
 * The tolerance is the regulator-tunable knob: short tolerance → strict matches
 * (only same-day or close); long tolerance → looser pairings.
 */
export function matchObservations(
  satellite: SatelliteObservation[],
  ground: GroundObservation[],
  opts: MatchOptions = DEFAULT_MATCH_OPTIONS,
): MatchedPair[] {
  const sortedSat = [...satellite].sort((a, b) => a.date.getTime() - b.date.getTime());
  const sortedGround = [...ground].sort((a, b) => a.date.getTime() - b.date.getTime());

  const usedGround = new Set<string>();
  const pairs: MatchedPair[] = [];
  const toleranceMs = opts.toleranceDays * 86400000;

  for (const sat of sortedSat) {
    let best: GroundObservation | null = null;
    let bestDelta = Infinity;
    for (const g of sortedGround) {
      if (usedGround.has(g.id)) continue;
      const dt = Math.abs(sat.date.getTime() - g.date.getTime());
      if (dt > toleranceMs) continue;
      if (dt < bestDelta) {
        best = g;
        bestDelta = dt;
      }
    }

    if (best) {
      usedGround.add(best.id);
      const ratio = best.reading > 0 ? sat.rate / best.reading : null;
      pairs.push({
        id: `pair:${sat.id}::${best.id}`,
        verdict: classifyAgreement(sat.rate, best.reading, opts.agreementBand),
        satellite: sat,
        ground: best,
        deltaDays: bestDelta / 86400000,
        deltaRate: sat.rate - best.reading,
        ratio,
      });
    } else {
      pairs.push({
        id: `pair:${sat.id}::null`,
        verdict: 'satellite_only',
        satellite: sat,
        ground: null,
        deltaDays: null,
        deltaRate: null,
        ratio: null,
      });
    }
  }

  for (const g of sortedGround) {
    if (usedGround.has(g.id)) continue;
    pairs.push({
      id: `pair:null::${g.id}`,
      verdict: 'ground_only',
      satellite: null,
      ground: g,
      deltaDays: null,
      deltaRate: null,
      ratio: null,
    });
  }

  // Stable chronological order so the table reads naturally
  pairs.sort((a, b) => pairTime(b) - pairTime(a)); // newest first
  return pairs;
}

function pairTime(p: MatchedPair): number {
  return (p.satellite?.date.getTime() ?? p.ground?.date.getTime() ?? 0);
}

/**
 * Decide whether two rates "agree" within the configured discrepancy band.
 * The band compares the absolute difference to the **larger** of the two
 * readings, so a 5 vs 10 kg/hr split (50%) is treated as an "under-reported"
 * even though both numbers are small.
 */
export function classifyAgreement(
  satRate: number,
  groundRate: number,
  agreementBand: number,
): Extract<Verdict, 'confirmed' | 'under_reported' | 'over_reported'> {
  if (satRate <= 0 && groundRate <= 0) return 'confirmed';
  const max = Math.max(satRate, groundRate);
  const diff = Math.abs(satRate - groundRate) / Math.max(max, 1e-9);
  if (diff <= agreementBand) return 'confirmed';
  return satRate > groundRate ? 'under_reported' : 'over_reported';
}

/* ───────────────────────────── Summaries ───────────────────────────── */

export function summarise(
  satellite: SatelliteObservation[],
  ground: GroundObservation[],
  pairs: MatchedPair[],
): ComparisonSummary {
  const totalSatellite = satellite.length;
  const totalGround = ground.length;

  let confirmed = 0;
  let underReported = 0;
  let overReported = 0;
  let satelliteOnly = 0;
  let groundOnly = 0;

  for (const p of pairs) {
    switch (p.verdict) {
      case 'confirmed': confirmed += 1; break;
      case 'under_reported': underReported += 1; break;
      case 'over_reported': overReported += 1; break;
      case 'satellite_only': satelliteOnly += 1; break;
      case 'ground_only': groundOnly += 1; break;
    }
  }

  const meanSatellite = totalSatellite > 0
    ? satellite.reduce((acc, s) => acc + s.rate, 0) / totalSatellite
    : 0;
  const meanGround = totalGround > 0
    ? ground.reduce((acc, g) => acc + g.reading, 0) / totalGround
    : 0;

  const allDates = [
    ...satellite.map((s) => s.date.getTime()),
    ...ground.map((g) => g.date.getTime()),
  ];
  const windowDays = allDates.length > 0
    ? Math.round((Math.max(...allDates) - Math.min(...allDates)) / 86400000)
    : 0;

  return {
    totalSatellite,
    totalGround,
    confirmed,
    underReported,
    overReported,
    satelliteOnly,
    groundOnly,
    meanSatellite,
    meanGround,
    meanRatio: meanGround > 0 ? meanSatellite / meanGround : null,
    windowDays,
  };
}

/* ───────────────────────────── Date-window filter ───────────────────────────── */

/** Filter observations to a given date window. `null` window = no filter. */
export function withinWindow<T extends { date: Date }>(rows: T[], windowDays: number | null): T[] {
  if (windowDays == null) return rows;
  const cutoff = Date.now() - windowDays * 86400000;
  return rows.filter((r) => r.date.getTime() >= cutoff);
}

/* ───────────────────────────── UI helpers ───────────────────────────── */

export const VERDICT_META: Record<
  Verdict,
  { label: string; emoji: string; tone: 'confirmed' | 'warn' | 'caution' | 'sat' | 'gnd' }
> = {
  confirmed: { label: 'Confirmed', emoji: '✓', tone: 'confirmed' },
  under_reported: { label: 'Likely under-reported', emoji: '⚠', tone: 'warn' },
  over_reported: { label: 'Possibly over-reported', emoji: '⚠', tone: 'caution' },
  satellite_only: { label: 'Satellite-only detection', emoji: '🛰', tone: 'sat' },
  ground_only: { label: 'Ground-only reading', emoji: '◉', tone: 'gnd' },
};
