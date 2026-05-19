import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import {
  VERDICT_META,
  type MatchedPair,
  type Verdict,
} from './comparisonAnalysis';
import { feedColor, shortInstrument } from '../methane-trends/feeds';

interface MatchTableProps {
  darkMode: boolean;
  pairs: MatchedPair[];
}

type SortKey = 'date' | 'verdict' | 'satRate' | 'groundRate' | 'deltaRate' | 'deltaDays';

const VERDICT_FILTERS: { value: Verdict | 'all'; label: string }[] = [
  { value: 'all', label: 'All verdicts' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'under_reported', label: 'Under-reported' },
  { value: 'over_reported', label: 'Over-reported' },
  { value: 'satellite_only', label: 'Satellite-only' },
  { value: 'ground_only', label: 'Ground-only' },
];

const MatchTable: React.FC<MatchTableProps> = ({ darkMode, pairs }) => {
  const dm = darkMode;
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'desc' });
  const [verdictFilter, setVerdictFilter] = useState<Verdict | 'all'>('all');

  const filtered = useMemo(() => {
    if (verdictFilter === 'all') return pairs;
    return pairs.filter((p) => p.verdict === verdictFilter);
  }, [pairs, verdictFilter]);

  const sorted = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sort.key) {
        case 'date': {
          const at = a.satellite?.date.getTime() ?? a.ground?.date.getTime() ?? 0;
          const bt = b.satellite?.date.getTime() ?? b.ground?.date.getTime() ?? 0;
          return (at - bt) * dir;
        }
        case 'verdict':
          return a.verdict.localeCompare(b.verdict) * dir;
        case 'satRate':
          return ((a.satellite?.rate ?? -Infinity) - (b.satellite?.rate ?? -Infinity)) * dir;
        case 'groundRate':
          return ((a.ground?.reading ?? -Infinity) - (b.ground?.reading ?? -Infinity)) * dir;
        case 'deltaRate':
          return ((a.deltaRate ?? -Infinity) - (b.deltaRate ?? -Infinity)) * dir;
        case 'deltaDays':
          return ((a.deltaDays ?? -Infinity) - (b.deltaDays ?? -Infinity)) * dir;
      }
      return 0;
    });
  }, [filtered, sort]);

  const card = dm ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100';
  const heading = dm ? 'text-white' : 'text-gray-900';
  const sub = dm ? 'text-gray-400' : 'text-gray-500';
  const border = dm ? 'border-[#1e2430]' : 'border-gray-100';
  const stripe = dm ? 'odd:bg-[#0b0e14]/40' : 'odd:bg-gray-50/70';
  const labelBold = dm ? 'text-gray-200' : 'text-gray-700';

  const toggleSort = (key: SortKey) => {
    setSort((prev) => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' });
  };

  const sortIndicator = (key: SortKey) => {
    if (sort.key !== key) return null;
    return sort.dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
  };

  return (
    <section className={`rounded-2xl border ${card} shadow-sm`}>
      <header className="flex items-start justify-between gap-3 flex-wrap p-5">
        <div>
          <h2 className={`text-base font-bold ${heading}`}>Match table</h2>
          <p className={`text-xs mt-1 ${sub}`}>
            Each satellite detection paired to its nearest-in-time ground reading. Verdicts
            are computed from the configured tolerance and agreement band.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className={sub} />
          <select
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value as Verdict | 'all')}
            className={`text-xs px-3 py-2 rounded-xl border outline-none ${
              dm ? 'bg-[#0b0e14] border-[#1e2430] text-gray-200' : 'bg-white border-gray-200 text-gray-800'
            }`}
            aria-label="Filter verdicts"
          >
            {VERDICT_FILTERS.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs md:text-sm">
          <thead className={`border-b ${border}`}>
            <tr>
              <SortHeader dm={dm} active={sort.key === 'date'} onClick={() => toggleSort('date')}>
                Date {sortIndicator('date')}
              </SortHeader>
              <th className={`px-4 py-3 font-bold uppercase tracking-wider text-[10px] md:text-[11px] ${sub}`}>
                Satellite source
              </th>
              <SortHeader dm={dm} active={sort.key === 'satRate'} onClick={() => toggleSort('satRate')}>
                Sat (kg/hr) {sortIndicator('satRate')}
              </SortHeader>
              <SortHeader dm={dm} active={sort.key === 'groundRate'} onClick={() => toggleSort('groundRate')}>
                Ground (kg/hr) {sortIndicator('groundRate')}
              </SortHeader>
              <SortHeader dm={dm} active={sort.key === 'deltaRate'} onClick={() => toggleSort('deltaRate')}>
                Δ rate {sortIndicator('deltaRate')}
              </SortHeader>
              <SortHeader dm={dm} active={sort.key === 'deltaDays'} onClick={() => toggleSort('deltaDays')}>
                Δ days {sortIndicator('deltaDays')}
              </SortHeader>
              <SortHeader dm={dm} active={sort.key === 'verdict'} onClick={() => toggleSort('verdict')}>
                Verdict {sortIndicator('verdict')}
              </SortHeader>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className={`px-5 py-10 text-center ${sub}`}>
                  No observations match the current filter.
                </td>
              </tr>
            ) : (
              sorted.map((pair) => {
                const sat = pair.satellite;
                const gnd = pair.ground;
                const dateRow = sat?.date ?? gnd?.date;
                const dateStr = dateRow ? dateRow.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

                const meta = VERDICT_META[pair.verdict];

                return (
                  <tr key={pair.id} className={`${stripe} border-b ${border} last:border-0`}>
                    <td className={`px-4 py-3 align-top ${labelBold}`}>{dateStr}</td>
                    <td className={`px-4 py-3 align-top ${labelBold}`}>
                      {sat ? (
                        <SourceCell sat={sat} dm={dm} />
                      ) : (
                        <span className={sub}>—</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 align-top tabular-nums ${labelBold}`}>
                      {sat ? sat.rate.toFixed(1) : <span className={sub}>—</span>}
                    </td>
                    <td className={`px-4 py-3 align-top tabular-nums ${labelBold}`}>
                      {gnd ? gnd.reading.toFixed(1) : <span className={sub}>—</span>}
                    </td>
                    <td className={`px-4 py-3 align-top tabular-nums ${labelBold}`}>
                      {pair.deltaRate == null ? <span className={sub}>—</span> : `${pair.deltaRate >= 0 ? '+' : ''}${pair.deltaRate.toFixed(1)}`}
                    </td>
                    <td className={`px-4 py-3 align-top tabular-nums ${sub}`}>
                      {pair.deltaDays == null ? '—' : `${pair.deltaDays.toFixed(1)} d`}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <VerdictChip dm={dm} tone={meta.tone} label={meta.label} emoji={meta.emoji} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

/* ───────────────────────────── Helpers ───────────────────────────── */

const SortHeader: React.FC<{
  dm: boolean;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ dm, onClick, children }) => (
  <th
    className={`px-4 py-3 font-bold uppercase tracking-wider text-[10px] md:text-[11px] cursor-pointer select-none ${dm ? 'text-gray-400' : 'text-gray-500'}`}
    onClick={onClick}
  >
    <span className="inline-flex items-center gap-1">{children}</span>
  </th>
);

const SourceCell: React.FC<{ sat: NonNullable<MatchedPair['satellite']>; dm: boolean }> = ({ sat, dm }) => {
  const color = feedColor(sat.provider, sat.instrument);
  const providerLabel = sat.provider === 'imeo'
    ? `IMEO · ${shortInstrument(sat.instrument)}`
    : sat.provider === 'tropomi'
      ? 'TROPOMI'
      : `Carbon Mapper${sat.instrument ? ` · ${shortInstrument(sat.instrument)}` : ''}`;
  return (
    <div className="flex items-start gap-2">
      <span aria-hidden className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="min-w-0">
        <p className={`text-xs font-bold truncate ${dm ? 'text-gray-200' : 'text-gray-800'}`}>{sat.sourceName}</p>
        <p className={`text-[10px] ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
          <span style={{ color }}>{providerLabel}</span>
          {sat.distanceKm > 0 && ` · ${sat.distanceKm} km`}
        </p>
      </div>
    </div>
  );
};

const VerdictChip: React.FC<{
  dm: boolean;
  tone: 'confirmed' | 'warn' | 'caution' | 'sat' | 'gnd';
  label: string;
  emoji: string;
}> = ({ dm, tone, label, emoji }) => {
  const cls = {
    confirmed: dm
      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
      : 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warn: dm
      ? 'bg-red-500/10 text-red-300 border border-red-500/30'
      : 'bg-red-50 text-red-700 border border-red-200',
    caution: dm
      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
      : 'bg-amber-50 text-amber-700 border border-amber-200',
    sat: dm
      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
      : 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    gnd: dm
      ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
      : 'bg-teal-50 text-teal-700 border border-teal-200',
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${cls}`}>
      <span aria-hidden>{emoji}</span>
      {label}
    </span>
  );
};

export default MatchTable;
