import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceArea,
} from 'recharts';
import type { FeedSeries, ProviderId } from './types';

interface TrendsChartProps {
  darkMode: boolean;
  /**
   * Per-feed series. IMEO is split into one entry per instrument
   * (EnMAP, Sentinel-2, GHGSat, …); Carbon Mapper / TROPOMI typically resolve
   * to a single feed each.
   */
  series: FeedSeries[];
  /** Optional title shown above the chart (e.g. "Long term trends for Katsina State"). */
  title: string;
  /** Subtitle / description, multi-line allowed. */
  description?: string[];
  /** Time-window controls. */
  range: { start: string; end: string };
  onRangeChange?: (range: { start: string; end: string }) => void;
}

const PROVIDER_GROUP_LABEL: Record<ProviderId, string> = {
  carbon_mapper: 'Carbon Mapper',
  imeo: 'IMEO (UNEP)',
  tropomi: 'TROPOMI',
  emit: 'NASA EMIT',
};

/** Recharts dataKey safe — feedKey contains "::" which is fine in JS object keys. */
const valueKey = (feedKey: string) => `${feedKey}::value`;
const rollingKey = (feedKey: string) => `${feedKey}::rolling`;
const countKey = (feedKey: string) => `${feedKey}::count`;

const TrendsChart: React.FC<TrendsChartProps> = ({ darkMode, series, title, description, range, onRangeChange }) => {
  const months = useMemo(() => series[0]?.points.map(p => p.month) ?? [], [series]);
  const [hidden, setHidden] = useState<Set<string>>(new Set()); // hides by feedKey

  const chartData = useMemo(() => {
    const rows: Record<string, any>[] = [];
    months.forEach((month, i) => {
      const row: Record<string, any> = { month };
      for (const s of series) {
        row[valueKey(s.feedKey)] = s.points[i]?.value ?? null;
        row[rollingKey(s.feedKey)] = s.rolling[i] ?? null;
        row[countKey(s.feedKey)] = s.points[i]?.count ?? 0;
      }
      rows.push(row);
    });
    return rows;
  }, [months, series]);

  const axisColor = darkMode ? '#475569' : '#cbd5e1';
  const labelColor = darkMode ? '#94a3b8' : '#475569';
  const headingColor = darkMode ? '#f1f5f9' : '#0f172a';
  const subColor = darkMode ? '#94a3b8' : '#64748b';
  const card = darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-200';

  const toggleFeed = (feedKey: string) => {
    setHidden(prev => {
      const n = new Set(prev);
      if (n.has(feedKey)) n.delete(feedKey); else n.add(feedKey);
      return n;
    });
  };

  // Group series by provider for the custom (multi-row) legend.
  const grouped = useMemo(() => {
    const map = new Map<ProviderId, FeedSeries[]>();
    for (const s of series) {
      const arr = map.get(s.provider) ?? [];
      arr.push(s);
      map.set(s.provider, arr);
    }
    const order: ProviderId[] = ['carbon_mapper', 'imeo', 'tropomi'];
    return order
      .filter((p) => map.has(p))
      .map((p) => ({ provider: p, label: PROVIDER_GROUP_LABEL[p], items: map.get(p)! }));
  }, [series]);

  const visibleSeries = series.filter((s) => !hidden.has(s.feedKey));

  return (
    <section className={`rounded-2xl border ${card} shadow-sm p-6 md:p-8`}>
      <header className="mb-6 max-w-3xl">
        <h2 className="text-lg md:text-xl font-bold" style={{ color: headingColor }}>{title}</h2>
        {description?.map((p, i) => (
          <p key={i} className="text-xs md:text-sm mt-2 leading-relaxed" style={{ color: subColor }}>{p}</p>
        ))}
      </header>

      {/* Custom grouped legend — Recharts default can't represent provider hierarchy well */}
      <FeedLegend
        darkMode={darkMode}
        grouped={grouped}
        hidden={hidden}
        onToggle={toggleFeed}
        onResetHidden={() => setHidden(new Set())}
      />

      {/* Methane reading panel */}
      <div className="mt-4 mb-3 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: subColor }}>Methane (kg/hr)</p>
        <RangePicker darkMode={darkMode} range={range} months={months} onChange={onRangeChange} />
      </div>
      <div className="h-72 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 6, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke={axisColor} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: labelColor }} stroke={axisColor} interval="preserveStartEnd" minTickGap={40} />
            <YAxis tick={{ fontSize: 10, fill: labelColor }} stroke={axisColor} width={48} />
            <Tooltip content={<TrendsTooltip darkMode={darkMode} series={visibleSeries} />} cursor={{ stroke: axisColor, strokeDasharray: '2 2' }} />
            <Legend content={() => null} />

            {series.map((s) => [
              <Line
                key={`${s.feedKey}-value`}
                hide={hidden.has(s.feedKey)}
                name={`${s.label} — methane`}
                type="monotone"
                dataKey={valueKey(s.feedKey)}
                stroke={s.color}
                strokeWidth={1.4}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />,
              <Line
                key={`${s.feedKey}-rolling`}
                hide={hidden.has(s.feedKey)}
                name={`${s.label} — rolling avg`}
                type="monotone"
                dataKey={rollingKey(s.feedKey)}
                stroke={s.color}
                strokeWidth={2.2}
                strokeDasharray="3 3"
                dot={false}
                connectNulls
                isAnimationActive={false}
              />,
            ])}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Reading coverage panel */}
      <div className="mt-4 mb-2">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: subColor }}>Reading coverage (%)</p>
      </div>
      <div className="h-32 md:h-36">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke={axisColor} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: labelColor }} stroke={axisColor} interval="preserveStartEnd" minTickGap={40} />
            <YAxis tick={{ fontSize: 10, fill: labelColor }} stroke={axisColor} width={48} domain={[0, 100]} />
            <Tooltip content={<CoverageTooltip darkMode={darkMode} series={visibleSeries} />} cursor={{ fill: axisColor, fillOpacity: 0.08 }} />
            <ReferenceArea y1={0} y2={100} fillOpacity={0} />
            {series.map((s) => (
              <Bar
                key={s.feedKey}
                hide={hidden.has(s.feedKey)}
                dataKey={(row: any) => coveragePct(row[countKey(s.feedKey)])}
                name={`${s.label} — coverage`}
                fill={s.color}
                opacity={0.9}
                isAnimationActive={false}
                stackId={s.feedKey}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] mt-4 italic" style={{ color: subColor }}>
        IMEO points are split by their underlying instrument (EnMAP, Sentinel-2, GHGSat, …) so you can compare each
        sensor independently. Click a feed in the legend above to mute or solo it. Missing months are typically caused
        by cloud cover or instrument maintenance.
      </p>
    </section>
  );
};

/** Coverage as a percentage: 30+ obs → 100%, log-scaled below that. */
function coveragePct(count: number): number {
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.min(100, Math.round((Math.log10(1 + count) / Math.log10(31)) * 100));
}

const FeedLegend: React.FC<{
  darkMode: boolean;
  grouped: { provider: ProviderId; label: string; items: FeedSeries[] }[];
  hidden: Set<string>;
  onToggle: (feedKey: string) => void;
  onResetHidden: () => void;
}> = ({ darkMode, grouped, hidden, onToggle, onResetHidden }) => {
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const labelColor = darkMode ? 'text-gray-200' : 'text-gray-700';
  const reset = darkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-700 hover:text-teal-800';

  if (grouped.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${sub}`}>Sources</p>
        {hidden.size > 0 && (
          <button onClick={onResetHidden} className={`text-[10px] font-bold uppercase tracking-widest ${reset}`}>
            Reset
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {grouped.map((g) => (
          <div key={g.provider}>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${sub}`}>{g.label}</p>
            <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
              {g.items.map((s) => {
                const dim = hidden.has(s.feedKey);
                return (
                  <li key={s.feedKey}>
                    <button
                      onClick={() => onToggle(s.feedKey)}
                      className={`flex items-center gap-1.5 text-[11px] font-medium transition ${labelColor}`}
                      style={{ opacity: dim ? 0.4 : 1 }}
                      aria-pressed={!dim}
                      title={dim ? `Show ${s.label}` : `Hide ${s.label}`}
                    >
                      <span aria-hidden className="w-3 h-[3px] rounded-sm" style={{ backgroundColor: s.color }} />
                      <span>{s.provider === 'carbon_mapper' || s.provider === 'tropomi' ? s.label : s.label.replace(/^IMEO ·\s*/, '')}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

const TrendsTooltip: React.FC<{ darkMode: boolean; series: FeedSeries[]; active?: boolean; payload?: any[]; label?: string }> = ({
  darkMode, series, active, payload, label,
}) => {
  if (!active || !payload?.length) return null;
  const bg = darkMode ? '#0b0e14' : '#ffffff';
  const fg = darkMode ? '#e2e8f0' : '#0f172a';
  const border = darkMode ? '#1e2430' : '#e5e7eb';
  return (
    <div style={{ background: bg, color: fg, border: `1px solid ${border}`, borderRadius: 8, padding: '8px 10px', fontSize: 11, maxWidth: 280 }}>
      <p style={{ fontWeight: 700, marginBottom: 6 }}>{label}</p>
      {series.map((s) => {
        const val = payload.find((p) => p.dataKey === valueKey(s.feedKey))?.value;
        const rolling = payload.find((p) => p.dataKey === rollingKey(s.feedKey))?.value;
        const count = payload.find((p) => p.payload?.[countKey(s.feedKey)] != null)?.payload?.[countKey(s.feedKey)] ?? 0;
        if (val == null && rolling == null) return null;
        return (
          <div key={s.feedKey} style={{ marginBottom: 3 }}>
            <span style={{ color: s.color, fontWeight: 700 }}>{s.label}</span>
            {val != null && <div>· {val.toFixed(1)} kg/hr ({count} obs)</div>}
            {rolling != null && <div style={{ opacity: 0.75 }}>· rolling: {rolling.toFixed(1)}</div>}
          </div>
        );
      })}
    </div>
  );
};

const CoverageTooltip: React.FC<{ darkMode: boolean; series: FeedSeries[]; active?: boolean; payload?: any[]; label?: string }> = ({
  darkMode, active, payload, label, series,
}) => {
  if (!active || !payload?.length) return null;
  const bg = darkMode ? '#0b0e14' : '#ffffff';
  const fg = darkMode ? '#e2e8f0' : '#0f172a';
  const border = darkMode ? '#1e2430' : '#e5e7eb';
  return (
    <div style={{ background: bg, color: fg, border: `1px solid ${border}`, borderRadius: 8, padding: '8px 10px', fontSize: 11, maxWidth: 280 }}>
      <p style={{ fontWeight: 700, marginBottom: 6 }}>{label}</p>
      {series.map((s) => {
        const count = payload[0]?.payload?.[countKey(s.feedKey)] ?? 0;
        if (!count) return null;
        return (
          <div key={s.feedKey}>
            <span style={{ color: s.color, fontWeight: 700 }}>{s.label}</span>
            <div>· {count} observations · {coveragePct(count)}%</div>
          </div>
        );
      })}
    </div>
  );
};

const RangePicker: React.FC<{ darkMode: boolean; range: { start: string; end: string }; months: string[]; onChange?: (r: { start: string; end: string }) => void }> = ({
  darkMode, range, months, onChange,
}) => {
  if (!onChange || months.length === 0) return null;
  const inputCls = darkMode
    ? 'bg-[#0b0e14] border-[#1e2430] text-gray-200'
    : 'bg-white border-gray-200 text-gray-700';
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <select value={range.start} onChange={(e) => onChange({ ...range, start: e.target.value })} className={`px-2 py-1 rounded-md border ${inputCls}`}>
        {months.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <span style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>→</span>
      <select value={range.end} onChange={(e) => onChange({ ...range, end: e.target.value })} className={`px-2 py-1 rounded-md border ${inputCls}`}>
        {months.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  );
};

export default TrendsChart;
