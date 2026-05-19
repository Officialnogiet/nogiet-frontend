import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Satellite, MapPin } from 'lucide-react';
import type { ComparisonSummary } from './comparisonAnalysis';

interface ComparisonKPIsProps {
  darkMode: boolean;
  summary: ComparisonSummary;
}

const ComparisonKPIs: React.FC<ComparisonKPIsProps> = ({ darkMode, summary }) => {
  const dm = darkMode;

  const tiles: TileSpec[] = [
    {
      key: 'confirmed',
      label: 'Confirmed',
      value: summary.confirmed,
      hint: 'Satellite & ground agree (±25%)',
      icon: <CheckCircle2 size={18} />,
      tone: 'positive',
    },
    {
      key: 'under',
      label: 'Likely under-reported',
      value: summary.underReported,
      hint: 'Satellite higher than ground reading',
      icon: <AlertTriangle size={18} />,
      tone: 'danger',
    },
    {
      key: 'over',
      label: 'Possibly over-reported',
      value: summary.overReported,
      hint: 'Ground higher than satellite',
      icon: <AlertCircle size={18} />,
      tone: 'caution',
    },
    {
      key: 'sat-only',
      label: 'Satellite-only',
      value: summary.satelliteOnly,
      hint: 'No ground reading within tolerance',
      icon: <Satellite size={18} />,
      tone: 'info',
    },
    {
      key: 'ground-only',
      label: 'Ground-only',
      value: summary.groundOnly,
      hint: 'No satellite within tolerance',
      icon: <MapPin size={18} />,
      tone: 'neutral',
    },
  ];

  const cardBase = dm
    ? 'rounded-2xl border border-[#1e2430] bg-[#12161f]'
    : 'rounded-2xl border border-gray-100 bg-white shadow-sm';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {tiles.map(({ key, ...rest }) => (
          <KPITile key={key} darkMode={dm} {...rest} />
        ))}
      </div>

      <div className={`${cardBase} px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs`}>
        <SummaryCell label="Mean ground" value={`${summary.meanGround.toFixed(1)} kg/hr`} dm={dm} />
        <SummaryCell label="Mean satellite" value={`${summary.meanSatellite.toFixed(1)} kg/hr`} dm={dm} />
        <SummaryCell
          label="Sat / Ground ratio"
          value={summary.meanRatio == null ? '—' : `${summary.meanRatio.toFixed(2)}×`}
          tone={summary.meanRatio == null ? 'neutral' : summary.meanRatio >= 1.25 ? 'danger' : summary.meanRatio <= 0.75 ? 'caution' : 'positive'}
          dm={dm}
        />
        <SummaryCell
          label="Coverage"
          value={summary.windowDays > 0 ? `${summary.windowDays} days · ${summary.totalGround} ground · ${summary.totalSatellite} sat` : 'No data in window'}
          dm={dm}
        />
      </div>
    </div>
  );
};

/* ───────────────────────────── Building blocks ───────────────────────────── */

type Tone = 'positive' | 'danger' | 'caution' | 'info' | 'neutral';

interface TileSpec {
  key: string;
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
  tone: Tone;
}

type KPITileProps = Omit<TileSpec, 'key'> & { darkMode: boolean };

const KPITile: React.FC<KPITileProps> = ({
  darkMode, label, value, hint, icon, tone,
}) => {
  const dm = darkMode;
  const tones = TONE_STYLES(dm)[tone];

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${tones.card}`}
      title={hint}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${tones.label}`}>{label}</p>
          <p className={`mt-1 text-2xl font-extrabold tabular-nums ${tones.value}`}>{value}</p>
          <p className={`mt-1 text-[10px] truncate ${tones.hint}`}>{hint}</p>
        </div>
        <div className={`flex-shrink-0 rounded-xl p-2 ${tones.iconBg} ${tones.iconFg}`}>{icon}</div>
      </div>
    </div>
  );
};

const SummaryCell: React.FC<{ label: string; value: string; dm: boolean; tone?: Tone }> = ({
  label, value, dm, tone = 'neutral',
}) => {
  const tones = TONE_STYLES(dm)[tone];
  return (
    <div>
      <p className={`text-[10px] font-bold uppercase tracking-wider ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
      <p className={`mt-1 font-bold tabular-nums ${tones.value}`}>{value}</p>
    </div>
  );
};

function TONE_STYLES(dm: boolean): Record<Tone, {
  card: string; label: string; value: string; hint: string; iconBg: string; iconFg: string;
}> {
  return {
    positive: {
      card: dm ? 'bg-emerald-500/5 border-emerald-500/25' : 'bg-emerald-50 border-emerald-200',
      label: dm ? 'text-emerald-300/80' : 'text-emerald-700/80',
      value: dm ? 'text-emerald-300' : 'text-emerald-700',
      hint: dm ? 'text-emerald-400/60' : 'text-emerald-700/60',
      iconBg: dm ? 'bg-emerald-500/15' : 'bg-emerald-100',
      iconFg: dm ? 'text-emerald-300' : 'text-emerald-700',
    },
    danger: {
      card: dm ? 'bg-red-500/5 border-red-500/25' : 'bg-red-50 border-red-200',
      label: dm ? 'text-red-300/80' : 'text-red-700/80',
      value: dm ? 'text-red-300' : 'text-red-700',
      hint: dm ? 'text-red-400/60' : 'text-red-700/60',
      iconBg: dm ? 'bg-red-500/15' : 'bg-red-100',
      iconFg: dm ? 'text-red-300' : 'text-red-700',
    },
    caution: {
      card: dm ? 'bg-amber-500/5 border-amber-500/25' : 'bg-amber-50 border-amber-200',
      label: dm ? 'text-amber-300/80' : 'text-amber-700/80',
      value: dm ? 'text-amber-300' : 'text-amber-700',
      hint: dm ? 'text-amber-400/60' : 'text-amber-700/60',
      iconBg: dm ? 'bg-amber-500/15' : 'bg-amber-100',
      iconFg: dm ? 'text-amber-300' : 'text-amber-700',
    },
    info: {
      card: dm ? 'bg-cyan-500/5 border-cyan-500/25' : 'bg-cyan-50 border-cyan-200',
      label: dm ? 'text-cyan-300/80' : 'text-cyan-700/80',
      value: dm ? 'text-cyan-300' : 'text-cyan-700',
      hint: dm ? 'text-cyan-400/60' : 'text-cyan-700/60',
      iconBg: dm ? 'bg-cyan-500/15' : 'bg-cyan-100',
      iconFg: dm ? 'text-cyan-300' : 'text-cyan-700',
    },
    neutral: {
      card: dm ? 'bg-[#0b0e14] border-[#1e2430]' : 'bg-gray-50 border-gray-200',
      label: dm ? 'text-gray-500' : 'text-gray-500',
      value: dm ? 'text-gray-200' : 'text-gray-800',
      hint: dm ? 'text-gray-600' : 'text-gray-400',
      iconBg: dm ? 'bg-white/5' : 'bg-gray-100',
      iconFg: dm ? 'text-gray-300' : 'text-gray-600',
    },
  };
}

export default ComparisonKPIs;
