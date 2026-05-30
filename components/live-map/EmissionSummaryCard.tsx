import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface EmissionSummaryCardProps {
  darkMode: boolean;
  totalSources: number;
  totalPlumes: number;
  facilityCount?: number;
  satelliteCount?: number;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/**
 * Bottom-left overlay summarising what's currently visible on the map.
 *
 * Two design constraints driving the responsive treatment:
 *   1. On small viewports the mobile bottom-nav (`h-16`) sits at `bottom-0`;
 *      this card needs to clear it (`bottom-24`) so the user can read both
 *      "Plumes Detected" AND tap the bottom nav.
 *   2. The 5xl/p-8/w-80 sizing chewed half the map on small laptops. We now
 *      ship a compact pill that expands on tap, and only inflate to the
 *      original "glassy stat card" treatment from `lg:` upward.
 */
const EmissionSummaryCard: React.FC<EmissionSummaryCardProps> = ({
  darkMode, totalSources, totalPlumes, facilityCount = 0, satelliteCount = 0,
}) => {
  // Mobile: collapsed by default so the card is essentially out of the way
  // until the user wants the numbers. Desktop: card is always "open" (we hide
  // the toggle), matching the prior always-on behaviour.
  const [open, setOpen] = useState(false);
  const dm = darkMode;
  const shell = dm ? 'bg-[#12161f]/90 border-[#1e2430] text-white' : 'bg-white/95 border-gray-100/80 text-gray-900';
  const labelMuted = 'text-gray-500';
  const accent = dm ? 'text-[#009688]' : 'text-gray-900';

  return (
    <div
      className={`
        absolute left-4 lg:left-6
        bottom-24 lg:bottom-8
        z-40 backdrop-blur-lg shadow-2xl rounded-2xl lg:rounded-3xl border ${shell}
        w-[calc(100%-2rem)] max-w-[18rem] lg:w-80 lg:max-w-none
        p-3 lg:p-8
        transition-all
      `}
    >
      {/* Compact summary line — always visible. Switches to a stacked title
          treatment from lg: upward to match the original card design. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full lg:cursor-default lg:pointer-events-none flex items-center justify-between gap-3"
        aria-expanded={open}
        aria-label="Emission summary"
      >
        <div className="text-left min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Sources · Plumes</p>
          <p className={`text-base lg:text-lg font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>
            <span className={accent}>{formatCount(totalSources)}</span>
            <span className="mx-1.5 text-gray-500">·</span>
            <span className={accent}>{formatCount(totalPlumes)}</span>
          </p>
        </div>
        <span className="lg:hidden text-gray-500">
          {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </span>
      </button>

      {/* Expanded detail — collapses on mobile, always rendered on desktop
          (`lg:block`) so the long-form view matches the previous default. */}
      <div className={`${open ? 'block' : 'hidden'} lg:block mt-4 lg:mt-8 space-y-4 lg:space-y-8`}>
        <div>
          <h3 className={`font-bold text-sm lg:text-lg ${dm ? 'text-white' : 'text-gray-900'}`}>Emission Sources</h3>
          <p className={`text-[10px] lg:text-xs ${labelMuted} mt-0.5`}>CH&#x2084; &bull; Loaded Region</p>
          <p className={`text-3xl lg:text-5xl font-black mt-1.5 lg:mt-3 tracking-tight ${accent}`}>{formatCount(totalSources)}</p>
          <p className={`text-[10px] ${labelMuted} mt-0.5`}>{facilityCount} facilities · {formatCount(satelliteCount)} satellite</p>
        </div>
        <div>
          <h3 className={`font-bold text-sm lg:text-lg ${dm ? 'text-white' : 'text-gray-900'}`}>Plumes Detected</h3>
          <p className={`text-[10px] lg:text-xs ${labelMuted} mt-0.5`}>CH&#x2084; &bull; Satellite Sources</p>
          <p className={`text-3xl lg:text-5xl font-black mt-1.5 lg:mt-3 tracking-tight ${accent}`}>{formatCount(totalPlumes)}</p>
        </div>
      </div>
    </div>
  );
};

export default EmissionSummaryCard;
