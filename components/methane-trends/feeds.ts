/**
 * "Feed" = (provider, instrument) — the unit of comparison on the Methane Trends chart.
 *
 * IMEO is an aggregator that returns plumes from many independent satellites/sensors
 * (EnMAP, Sentinel-2, Sentinel-5P, GHGSat, PRISMA, MethaneSAT, …). Treating them as
 * one homogeneous "IMEO" line collapses real signal: each instrument has its own
 * revisit cadence, detection limit, and false-positive profile. Carbon Mapper and
 * TROPOMI also expose an instrument label, but in our pipeline they typically resolve
 * to a single feed each, so the legend stays compact.
 */

import type { ProviderId } from "./types";

export const FEED_KEY_DELIMITER = "::";
const UNKNOWN_INSTRUMENT = "Unknown instrument";

/** Stable lookup key — `${provider}::${instrument}`. */
export type FeedKey = string;

export interface Feed {
  key: FeedKey;
  provider: ProviderId;
  instrument: string;
  label: string;
  color: string;
}

/** Build a stable key from (provider, instrument). */
export function feedKey(provider: ProviderId, instrument: string | null | undefined): FeedKey {
  return `${provider}${FEED_KEY_DELIMITER}${normalizeInstrument(instrument)}`;
}

/** Inverse of {@link feedKey}. */
export function parseFeedKey(key: FeedKey): { provider: ProviderId; instrument: string } {
  const [providerRaw, ...rest] = key.split(FEED_KEY_DELIMITER);
  return {
    provider: (providerRaw as ProviderId) ?? "carbon_mapper",
    instrument: normalizeInstrument(rest.join(FEED_KEY_DELIMITER)),
  };
}

/** Friendly instrument label — strips long supplier suffixes ("EnMAP - DLR" → "EnMAP"). */
export function shortInstrument(name: string | null | undefined): string {
  const n = normalizeInstrument(name);
  if (n === UNKNOWN_INSTRUMENT) return n;
  // Drop trailing " - <vendor>" tags so the legend stays compact.
  const dashIdx = n.indexOf(" - ");
  if (dashIdx > 0) return n.slice(0, dashIdx).trim();
  return n.trim();
}

export function normalizeInstrument(name: string | null | undefined): string {
  if (!name) return UNKNOWN_INSTRUMENT;
  const trimmed = String(name).trim();
  if (!trimmed || trimmed.toLowerCase() === "imeo") return UNKNOWN_INSTRUMENT;
  return trimmed;
}

const PROVIDER_LABEL: Record<ProviderId, string> = {
  carbon_mapper: "Carbon Mapper",
  imeo: "IMEO",
  tropomi: "TROPOMI",
  emit: "NASA EMIT",
};

/** Human label for a feed: "Carbon Mapper", "IMEO · EnMAP", "TROPOMI". */
export function feedLabel(provider: ProviderId, instrument: string): string {
  const inst = shortInstrument(instrument);
  // Carbon Mapper / TROPOMI / EMIT: provider name alone is plenty unless the instrument disagrees.
  if (provider === "carbon_mapper" || provider === "tropomi" || provider === "emit") {
    if (
      !inst ||
      inst === UNKNOWN_INSTRUMENT ||
      inst.toLowerCase() === PROVIDER_LABEL[provider].toLowerCase()
    ) {
      return PROVIDER_LABEL[provider];
    }
    return `${PROVIDER_LABEL[provider]} · ${inst}`;
  }
  // IMEO: always show the instrument so the user knows whose plume it really is.
  return `IMEO · ${inst}`;
}

/* ------------------------ deterministic color palette ------------------------ */

/** Carbon Mapper, TROPOMI, and EMIT have stable canonical colors so the rest of the app stays in sync. */
const PROVIDER_BASE: Record<ProviderId, string> = {
  carbon_mapper: "#0d9488", // teal
  imeo: "#22d3ee",          // cyan (used as fallback only)
  tropomi: "#a78bfa",       // violet
  emit: "#f59e0b",          // amber
};

/** IMEO instrument palette — distinct hues so multiple feeds are visually separable. */
const IMEO_INSTRUMENT_PALETTE = [
  "#0ea5e9", // sky-500    — Sentinel-5P / TROPOMI-style
  "#14b8a6", // teal-500
  "#f59e0b", // amber-500  — EnMAP-style yellow-orange
  "#ec4899", // pink-500   — GHGSat-style hot pink
  "#8b5cf6", // violet-500
  "#10b981", // emerald-500
  "#f97316", // orange-500
  "#06b6d4", // cyan-500
  "#3b82f6", // blue-500
  "#84cc16", // lime-500
  "#a855f7", // purple-500
  "#ef4444", // red-500
];

function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return Math.abs(h);
}

/** Color for a feed — provider canonical for CM/TROPOMI, instrument-hashed palette for IMEO. */
export function feedColor(provider: ProviderId, instrument: string): string {
  if (provider !== "imeo") return PROVIDER_BASE[provider];
  const inst = shortInstrument(instrument);
  if (!inst || inst === UNKNOWN_INSTRUMENT) return PROVIDER_BASE.imeo;
  return IMEO_INSTRUMENT_PALETTE[hashString(inst) % IMEO_INSTRUMENT_PALETTE.length];
}

/** Compose a Feed descriptor from raw (provider, instrument). */
export function buildFeed(provider: ProviderId, instrument: string | null | undefined): Feed {
  const inst = normalizeInstrument(instrument);
  return {
    key: feedKey(provider, inst),
    provider,
    instrument: inst,
    label: feedLabel(provider, inst),
    color: feedColor(provider, inst),
  };
}
