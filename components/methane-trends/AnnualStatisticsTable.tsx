import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Download, ChevronRight, MapPin } from 'lucide-react';
import type { AnnualRow, GroupByMode } from './types';

type SortKey = 'key' | 'region' | number;

interface AnnualStatisticsTableProps {
  darkMode: boolean;
  rows: AnnualRow[];
  years: number[];
  groupBy: GroupByMode;
  /** Optional: drill into a row's trend chart. */
  onOpenDetails?: (rowKey: string) => void;
  onDownloadCsv?: () => void;
}

const formatVal = (v: number | null | undefined) => v == null ? '—' : v.toFixed(1);
const formatPct = (v: number | null | undefined) => {
  if (v == null) return '';
  const sign = v >= 0 ? '+' : '';
  return `(${sign}${v.toFixed(1)}%)`;
};
const formatGeo = (g: AnnualRow['geo']) =>
  g ? `${g.latitude.toFixed(3)}°, ${g.longitude.toFixed(3)}°` : '—';

const GROUP_LABELS: Record<GroupByMode, { col: string; helper: string; pseudoRow: string }> = {
  state: {
    col: 'State',
    helper: 'State attribution uses the same Nigeria boundary file the live map renders.',
    pseudoRow: 'Nigeria',
  },
  region: {
    col: 'Region',
    helper: 'Geopolitical zones (South South, North Central, etc.) aggregate every state in the region.',
    pseudoRow: 'Nigeria',
  },
  facility: {
    col: 'Facility',
    helper: 'Facility rows aggregate every observation linked to that facility name.',
    pseudoRow: 'All facilities',
  },
};

const AnnualStatisticsTable: React.FC<AnnualStatisticsTableProps> = ({
  darkMode, rows, years, groupBy, onOpenDetails, onDownloadCsv,
}) => {
  const [sortBy, setSortBy] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: years.length > 0 ? years[years.length - 1] : 'key',
    dir: 'desc',
  });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const card = darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-200';
  const heading = darkMode ? 'text-white' : 'text-gray-900';
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const labelBold = darkMode ? 'text-gray-200' : 'text-gray-700';
  const stripe = darkMode ? 'odd:bg-[#0b0e14]/40' : 'odd:bg-gray-50/70';
  const border = darkMode ? 'border-[#1e2430]' : 'border-gray-100';
  const positive = '#dc2626';
  const negative = '#16a34a';

  const groupCfg = GROUP_LABELS[groupBy];

  const sortedRows = [...rows].sort((a, b) => {
    if (a.key === groupCfg.pseudoRow) return -1;
    if (b.key === groupCfg.pseudoRow) return 1;
    const dir = sortBy.dir === 'asc' ? 1 : -1;
    if (sortBy.key === 'key') return a.key.localeCompare(b.key) * dir;
    if (sortBy.key === 'region') return ((a.region ?? '').localeCompare(b.region ?? '')) * dir;
    const av = a.averages[sortBy.key] ?? -Infinity;
    const bv = b.averages[sortBy.key] ?? -Infinity;
    return (av - bv) * dir;
  });

  const toggleSort = (key: SortKey) => {
    setSortBy((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: typeof key === 'number' ? 'desc' : 'asc' },
    );
  };

  const sortIndicator = (key: SortKey) => {
    if (sortBy.key !== key) return null;
    return sortBy.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const toggleExpanded = (rowKey: string) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(rowKey)) n.delete(rowKey); else n.add(rowKey);
      return n;
    });
  };

  // Columns: expander, key, region (only if state/facility), geo, [year cols], details
  const showRegionCol = groupBy !== 'region';
  const showGeoCol = true;
  const baseCols = 1 /* expander */ + 1 /* key */ + (showRegionCol ? 1 : 0) + (showGeoCol ? 1 : 0);
  const totalCols = baseCols + years.length + (onOpenDetails ? 1 : 0);

  return (
    <section className={`rounded-2xl border ${card} shadow-sm`}>
      <header className="flex items-start justify-between gap-4 p-6 md:p-7">
        <div>
          <h2 className={`text-lg md:text-xl font-bold ${heading}`}>Annual Statistics</h2>
          <p className={`text-xs md:text-sm mt-1 ${sub}`}>
            Annual average methane readings across wide regions, with year-over-year change.
            Click a row to expand the per-source breakdown — Carbon Mapper, TROPOMI, and each individual IMEO instrument
            (EnMAP, Sentinel-2, GHGSat, …) appear on their own line.
          </p>
        </div>
        {onDownloadCsv && (
          <button
            onClick={onDownloadCsv}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              darkMode ? 'bg-[#1e2430] text-teal-300 hover:bg-[#262f3d]' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
            }`}
          >
            <Download size={14} />
            Download CSV
          </button>
        )}
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs md:text-sm">
          <thead className={`border-b ${border}`}>
            <tr>
              <th className="px-3 py-3 w-8" aria-label="Expand" />
              <th
                className={`px-4 py-3 font-bold uppercase tracking-wider text-[10px] md:text-[11px] cursor-pointer select-none ${sub}`}
                onClick={() => toggleSort('key')}
              >
                <span className="inline-flex items-center gap-1">{groupCfg.col} {sortIndicator('key')}</span>
              </th>
              {showRegionCol && (
                <th
                  className={`px-4 py-3 font-bold uppercase tracking-wider text-[10px] md:text-[11px] cursor-pointer select-none ${sub}`}
                  onClick={() => toggleSort('region')}
                >
                  <span className="inline-flex items-center gap-1">Region {sortIndicator('region')}</span>
                </th>
              )}
              {showGeoCol && (
                <th className={`px-4 py-3 font-bold uppercase tracking-wider text-[10px] md:text-[11px] ${sub}`}>
                  Geo Location
                </th>
              )}
              {years.map((y) => (
                <th
                  key={y}
                  className={`px-4 py-3 font-bold uppercase tracking-wider text-[10px] md:text-[11px] cursor-pointer select-none ${sub}`}
                  onClick={() => toggleSort(y)}
                >
                  <span className="inline-flex items-center gap-1">{y} Avg {sortIndicator(y)}</span>
                </th>
              ))}
              {onOpenDetails && <th className="px-4 py-3" aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const isOpen = expanded.has(row.key);
              return (
                <React.Fragment key={row.key}>
                  <tr className={`${stripe} border-b ${border} last:border-0`}>
                    <td className="px-3 py-3 align-top">
                      <button
                        onClick={() => toggleExpanded(row.key)}
                        aria-label={isOpen ? 'Collapse providers' : 'Expand providers'}
                        className={`p-1 rounded-md transition ${darkMode ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                      >
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </td>
                    <td className={`px-4 py-3 font-semibold align-top ${labelBold}`}>{row.key}</td>
                    {showRegionCol && (
                      <td className={`px-4 py-3 align-top ${labelBold}`}>
                        {row.region ?? <span className={sub}>—</span>}
                      </td>
                    )}
                    {showGeoCol && (
                      <td className="px-4 py-3 align-top">
                        {row.geo ? (
                          <a
                            href={`https://www.google.com/maps?q=${row.geo.latitude.toFixed(5)},${row.geo.longitude.toFixed(5)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-teal-500 hover:underline"
                            title={`${row.geo.count} observations · click to open in Google Maps`}
                          >
                            <MapPin size={11} />
                            {formatGeo(row.geo)}
                          </a>
                        ) : (
                          <span className={`text-[11px] ${sub}`}>—</span>
                        )}
                      </td>
                    )}
                    {years.map((y, idx) => {
                      const avg = row.averages[y];
                      const change = idx === 0 ? null : row.changes[y];
                      return (
                        <td key={y} className="px-4 py-3 whitespace-nowrap align-top">
                          <span className={labelBold}>{formatVal(avg)}</span>
                          {change != null && (
                            <span className="ml-2 text-[11px] font-bold" style={{ color: change >= 0 ? positive : negative }}>
                              {formatPct(change)}
                              {change >= 0 ? ' ▲' : ' ▼'}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    {onOpenDetails && (
                      <td className="px-4 py-3 text-right align-top">
                        <button
                          onClick={() => onOpenDetails(row.key)}
                          className="px-4 py-1.5 bg-[#0f766e] hover:bg-[#0b5f58] text-white text-xs font-bold rounded-md transition"
                        >
                          Details
                        </button>
                      </td>
                    )}
                  </tr>

                  {isOpen && <ExpandedFeedRow darkMode={darkMode} row={row} years={years} totalCols={totalCols} />}
                </React.Fragment>
              );
            })}
            {sortedRows.length === 0 && (
              <tr>
                <td colSpan={totalCols} className={`px-6 py-12 text-center ${sub}`}>
                  No annual statistics available for the current data sources.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className={`text-[11px] italic px-6 py-3 ${sub}`}>{groupCfg.helper}</p>
    </section>
  );
};

/* ----------------------------- Per-feed expansion ----------------------------- */

const PROVIDER_GROUP_LABEL = {
  carbon_mapper: 'Carbon Mapper',
  imeo: 'IMEO instruments',
  tropomi: 'TROPOMI',
  emit: 'NASA EMIT',
} as const;

const ExpandedFeedRow: React.FC<{
  darkMode: boolean;
  row: AnnualRow;
  years: number[];
  totalCols: number;
}> = ({ darkMode, row, years, totalCols }) => {
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const labelBold = darkMode ? 'text-gray-200' : 'text-gray-700';
  const cellBorder = darkMode ? '#1e2430' : '#e5e7eb';

  // Group feeds by provider, then sort by total observations within the group (busiest first).
  const feeds = Object.values(row.byFeed).filter((f) => {
    return years.some((y) => (f.countsByYear[y] ?? 0) > 0);
  });

  const grouped = (['carbon_mapper', 'imeo', 'tropomi'] as const)
    .map((p) => ({
      provider: p,
      label: PROVIDER_GROUP_LABEL[p],
      items: feeds
        .filter((f) => f.provider === p)
        .sort((a, b) => {
          const ca = years.reduce((acc, y) => acc + (a.countsByYear[y] ?? 0), 0);
          const cb = years.reduce((acc, y) => acc + (b.countsByYear[y] ?? 0), 0);
          return cb - ca;
        }),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <tr className={`${darkMode ? 'bg-[#0b0e14]/60' : 'bg-gray-50/80'} border-b`} style={{ borderColor: cellBorder }}>
      <td />
      <td colSpan={totalCols - 1} className="px-4 pb-4">
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: cellBorder }}>
          <table className="w-full text-[11px]">
            <thead className={`${darkMode ? 'bg-[#12161f]' : 'bg-white'} border-b`} style={{ borderColor: cellBorder }}>
              <tr>
                <th className={`px-4 py-2 text-left font-bold uppercase tracking-wider ${sub}`}>Source · Instrument</th>
                {years.map((y) => (
                  <th key={y} className={`px-3 py-2 text-left font-bold uppercase tracking-wider ${sub}`}>{y} Avg</th>
                ))}
                <th className={`px-3 py-2 text-left font-bold uppercase tracking-wider ${sub}`}>Total Obs</th>
              </tr>
            </thead>
            <tbody>
              {grouped.length === 0 ? (
                <tr>
                  <td colSpan={years.length + 2} className={`px-4 py-3 text-center ${sub}`}>
                    No per-source data — observations were aggregated without provider attribution.
                  </td>
                </tr>
              ) : (
                grouped.map((g, gi) => (
                  <React.Fragment key={g.provider}>
                    <tr className={`${darkMode ? 'bg-[#12161f]/70' : 'bg-gray-100/70'} border-t`} style={{ borderColor: cellBorder }}>
                      <td colSpan={years.length + 2} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider ${sub}`}>
                        {g.label}
                      </td>
                    </tr>
                    {g.items.map((f) => {
                      const totalObs = years.reduce((acc, y) => acc + (f.countsByYear[y] ?? 0), 0);
                      return (
                        <tr key={f.feedKey} className="border-b last:border-0" style={{ borderColor: cellBorder }}>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center gap-2">
                              <span aria-hidden className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                              <span className={`font-semibold ${labelBold}`}>
                                {f.provider === 'imeo' ? f.label : `${PROVIDER_GROUP_LABEL[f.provider]}${f.label.includes('·') ? ` · ${f.instrument}` : ''}`}
                              </span>
                            </span>
                          </td>
                          {years.map((y) => (
                            <td key={y} className={`px-3 py-2 ${labelBold}`}>{formatVal(f.averages[y])}</td>
                          ))}
                          <td className={`px-3 py-2 ${sub}`}>{totalObs}</td>
                        </tr>
                      );
                    })}
                    {gi < grouped.length - 1 && null}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );
};

export default AnnualStatisticsTable;
