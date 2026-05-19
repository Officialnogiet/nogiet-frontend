import React, { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from 'recharts';
import { Maximize2, Minimize2, X } from 'lucide-react';
import type { GroundObservation, MatchedPair, SatelliteObservation } from './comparisonAnalysis';
import { feedColor, feedLabel, shortInstrument } from '../methane-trends/feeds';
import type { ProviderId } from '../methane-trends/types';

interface ComparisonTimelineProps {
  darkMode: boolean;
  satellite: SatelliteObservation[];
  ground: GroundObservation[];
  pairs: MatchedPair[];
}

const GROUND_COLOR = '#0d9488';

const ComparisonTimeline: React.FC<ComparisonTimelineProps> = ({ darkMode, satellite, ground }) => {
  const dm = darkMode;
  const [expanded, setExpanded] = useState(false);

  // Lock body scroll while the fullscreen overlay is open (prevents background jitter on mobile).
  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [expanded]);

  /** One Recharts series per (provider, instrument) — same hues as the live map. */
  const satelliteSeries = useMemo(() => {
    const byFeed = new Map<string, { provider: ProviderId; instrument: string; rows: ScatterPoint[] }>();
    for (const s of satellite) {
      const key = `${s.provider}::${s.instrument}`;
      let bucket = byFeed.get(key);
      if (!bucket) {
        bucket = { provider: s.provider, instrument: s.instrument, rows: [] };
        byFeed.set(key, bucket);
      }
      bucket.rows.push({
        ts: s.date.getTime(),
        rate: s.rate,
        sourceName: s.sourceName,
        kind: 'satellite',
        provider: s.provider,
        instrument: s.instrument,
        distanceKm: s.distanceKm,
      });
    }
    return [...byFeed.values()].map((b) => ({
      key: `${b.provider}::${b.instrument}`,
      label: feedLabel(b.provider, b.instrument),
      color: feedColor(b.provider, b.instrument),
      data: b.rows,
    }));
  }, [satellite]);

  const groundSeries = useMemo<ScatterPoint[]>(
    () => ground.map((g) => ({
      ts: g.date.getTime(),
      rate: g.reading,
      kind: 'ground',
      methodology: g.methodology,
    })),
    [ground],
  );

  const axisColor = dm ? '#475569' : '#cbd5e1';
  const labelColor = dm ? '#94a3b8' : '#64748b';
  const card = dm ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100';

  const empty = satellite.length === 0 && ground.length === 0;

  // Domain: padded by a half-day either side so points near the edges aren't clipped.
  const allTs = useMemo(
    () => [...satellite.map((s) => s.date.getTime()), ...ground.map((g) => g.date.getTime())],
    [satellite, ground],
  );
  const xDomain = useMemo<[number, number] | undefined>(() => {
    if (allTs.length === 0) return undefined;
    const min = Math.min(...allTs);
    const max = Math.max(...allTs);
    if (min === max) {
      const pad = 6 * 3600_000;
      return [min - pad, max + pad];
    }
    const pad = (max - min) * 0.05;
    return [min - pad, max + pad];
  }, [allTs]);

  const chart = (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 6, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke={axisColor} />
        <XAxis
          type="number"
          dataKey="ts"
          domain={xDomain}
          tick={{ fontSize: 10, fill: labelColor }}
          stroke={axisColor}
          tickFormatter={(ts) => new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          minTickGap={32}
        />
        <YAxis
          type="number"
          dataKey="rate"
          tick={{ fontSize: 10, fill: labelColor }}
          stroke={axisColor}
          width={48}
          unit=" kg/hr"
        />
        <ZAxis range={[60, 60]} />
        <Tooltip
          cursor={{ stroke: axisColor, strokeDasharray: '3 3' }}
          content={<TimelineTooltip dm={dm} />}
        />
        <Scatter
          name="Ground"
          data={groundSeries}
          fill={GROUND_COLOR}
          stroke="#ffffff"
          strokeWidth={1.2}
          shape="circle"
          isAnimationActive={false}
        />
        {satelliteSeries.map((s) => (
          <Scatter
            key={s.key}
            name={s.label}
            data={s.data}
            fill={s.color}
            stroke="#ffffff"
            strokeWidth={1.2}
            shape="square"
            isAnimationActive={false}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );

  return (
    <>
      <section className={`rounded-2xl border ${card} shadow-sm p-5`}>
        <header className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div>
            <h2 className={`text-base font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>
              Time-aligned observations
            </h2>
            <p className={`text-xs mt-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
              Each dot is one observation, plotted by date and methane reading. Ground submissions are teal;
              satellite detections use the same color as the live map.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Legend dm={dm} satelliteSeries={satelliteSeries} />
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label="Expand chart to fullscreen"
              title="Expand to fullscreen"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                dm ? 'bg-[#0b0e14] border border-[#1e2430] text-gray-300 hover:bg-white/5' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Maximize2 size={12} />
              Expand
            </button>
          </div>
        </header>

        <div className="h-72">
          {empty ? <EmptyTimeline dm={dm} /> : chart}
        </div>
      </section>

      {expanded && (
        <ExpandedOverlay
          dm={dm}
          onClose={() => setExpanded(false)}
          satelliteSeries={satelliteSeries}
        >
          {empty ? <EmptyTimeline dm={dm} /> : chart}
        </ExpandedOverlay>
      )}
    </>
  );
};

/* ───────────────────────────── Sub-components ───────────────────────────── */

interface ScatterPoint {
  ts: number;
  rate: number;
  kind: 'ground' | 'satellite';
  sourceName?: string;
  provider?: ProviderId;
  instrument?: string;
  distanceKm?: number;
  methodology?: string;
}

const Legend: React.FC<{
  dm: boolean;
  satelliteSeries: { key: string; label: string; color: string }[];
}> = ({ dm, satelliteSeries }) => {
  const muted = dm ? 'text-gray-400' : 'text-gray-500';
  return (
    <ul className="flex items-center gap-2 flex-wrap">
      <li className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: dm ? '#cbd5e1' : '#475569' }}>
        <span aria-hidden className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GROUND_COLOR }} />
        Ground
      </li>
      {satelliteSeries.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: dm ? '#cbd5e1' : '#475569' }}>
          <span aria-hidden className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
          {s.label}
        </li>
      ))}
      {satelliteSeries.length === 0 && <li className={`text-[11px] ${muted}`}>No satellite series in window</li>}
    </ul>
  );
};

const EmptyTimeline: React.FC<{ dm: boolean }> = ({ dm }) => (
  <div className={`h-full flex items-center justify-center text-xs text-center ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
    No ground readings or satellite detections fall inside the selected time window.
  </div>
);

/** Fullscreen overlay so the timeline can be inspected at viewport size. */
const ExpandedOverlay: React.FC<{
  dm: boolean;
  onClose: () => void;
  satelliteSeries: { key: string; label: string; color: string }[];
  children: React.ReactNode;
}> = ({ dm, onClose, satelliteSeries, children }) => (
  <div
    role="dialog"
    aria-modal="true"
    aria-label="Time-aligned observations (fullscreen)"
    className="fixed inset-0 z-[120] flex items-stretch justify-stretch p-4 md:p-8 bg-black/70 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className={`flex-1 flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
        dm ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-200'
      }`}
    >
      <header className={`px-5 py-4 border-b flex items-start justify-between gap-3 flex-wrap ${dm ? 'border-[#1e2430]' : 'border-gray-100'}`}>
        <div>
          <h2 className={`text-base font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>
            Time-aligned observations
          </h2>
          <p className={`text-xs mt-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
            Drag-zoom on a region (where supported) or use the date controls to narrow the window.
            Press <kbd className={`px-1.5 py-0.5 rounded ${dm ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>Esc</kbd> to close.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Legend dm={dm} satelliteSeries={satelliteSeries} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Collapse chart"
            title="Collapse"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
              dm ? 'bg-[#0b0e14] border border-[#1e2430] text-gray-300 hover:bg-white/5' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Minimize2 size={12} />
            Collapse
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`p-1.5 rounded-lg transition ${dm ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <X size={14} />
          </button>
        </div>
      </header>
      <div className="flex-1 min-h-0 p-5">
        {children}
      </div>
    </div>
  </div>
);

const TimelineTooltip: React.FC<{ dm: boolean; active?: boolean; payload?: any[] }> = ({ dm, active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload as ScatterPoint | undefined;
  if (!p) return null;
  const bg = dm ? '#0b0e14' : '#ffffff';
  const fg = dm ? '#e2e8f0' : '#0f172a';
  const border = dm ? '#1e2430' : '#e5e7eb';
  const date = new Date(p.ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ background: bg, color: fg, border: `1px solid ${border}`, borderRadius: 8, padding: '8px 10px', fontSize: 11, maxWidth: 240 }}>
      <p style={{ fontWeight: 700, marginBottom: 4 }}>{date}</p>
      <p>{p.rate.toFixed(2)} kg/hr</p>
      {p.kind === 'satellite' && p.provider && (
        <p style={{ opacity: 0.75, marginTop: 4 }}>
          {p.provider === 'imeo' ? `IMEO · ${shortInstrument(p.instrument ?? '')}` :
           p.provider === 'tropomi' ? 'TROPOMI' :
           `Carbon Mapper${p.instrument ? ` · ${shortInstrument(p.instrument)}` : ''}`}
          {p.sourceName && <span> · {p.sourceName}</span>}
          {typeof p.distanceKm === 'number' && p.distanceKm > 0 && <span> · {p.distanceKm} km</span>}
        </p>
      )}
      {p.kind === 'ground' && p.methodology && (
        <p style={{ opacity: 0.75, marginTop: 4 }}>Ground · {p.methodology}</p>
      )}
    </div>
  );
};

export default ComparisonTimeline;
