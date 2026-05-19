import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import type { ProviderSourcesSummary } from './EmissionGridLegend';
import type { GridProvider } from '../../src/stores/dashboard.store';

interface SourceLegendHintProps {
  darkMode: boolean;
  /**
   * Per-provider source summary derived from the currently visible satellite points.
   * Empty groups are hidden so the popover only lists sources that are actually shown.
   */
  providerSources: ProviderSourcesSummary[];
}

const PROVIDER_DISPLAY: Record<GridProvider, { label: string; accent: string; description: string }> = {
  carbon_mapper: {
    label: 'Carbon Mapper',
    accent: '#0d9488',
    description: 'Aviation + EnMAP/EMIT plumes. carbonmapper.org',
  },
  imeo: {
    label: 'IMEO (UNEP)',
    accent: '#22d3ee',
    description: 'Eye on Methane aggregator. methanedata.unep.org',
  },
  tropomi: {
    label: 'TROPOMI',
    accent: '#a78bfa',
    description: 'Sentinel-5P column data. ESA Copernicus',
  },
};

const SourceLegendHint: React.FC<SourceLegendHintProps> = ({ darkMode, providerSources }) => {
  const [open, setOpen] = useState(false);

  const dm = darkMode;
  const bg = dm ? 'bg-[#12161f]/95' : 'bg-white/95';
  const border = dm ? 'border-[#1e2430]' : 'border-gray-200';
  const heading = dm ? 'text-white' : 'text-gray-900';
  const sub = dm ? 'text-gray-400' : 'text-gray-500';
  const labelBold = dm ? 'text-gray-200' : 'text-gray-700';
  const dividerColor = dm ? '#1e2430' : '#e5e7eb';

  const groupsWithData = providerSources.filter((g) => g.totalCount > 0);

  return (
    <div className="absolute bottom-6 right-6 z-30 flex flex-col items-end gap-2.5">
      {open && (
        <aside
          className={`${bg} backdrop-blur-md rounded-2xl border ${border} shadow-2xl p-5 w-72 md:w-80 max-h-[60vh] overflow-y-auto`}
          role="dialog"
          aria-label="Map source legend"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className={`text-sm font-bold ${heading}`}>Source legend</p>
              <p className={`text-[11px] mt-0.5 ${sub}`}>
                Each plume on the map is colored by the satellite that detected it.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className={`p-1 rounded-lg transition ${dm ? 'hover:bg-white/5 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
              aria-label="Close source legend"
            >
              <X size={14} />
            </button>
          </div>

          {groupsWithData.length === 0 ? (
            <p className={`text-xs ${sub}`}>No satellite sources visible right now. Adjust the grid legend or zoom out to load more.</p>
          ) : (
            <ul className="space-y-4">
              {groupsWithData.map((g) => {
                const meta = PROVIDER_DISPLAY[g.provider];
                return (
                  <li key={g.provider}>
                    <div className="flex items-baseline justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span aria-hidden className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: meta.accent }} />
                        <span className={`text-xs font-bold ${labelBold}`}>{meta.label}</span>
                      </div>
                      <span className={`text-[10px] tabular-nums ${sub}`}>{g.totalCount} pts</span>
                    </div>
                    <p className={`text-[10px] mb-2 ${sub}`}>{meta.description}</p>
                    <ul
                      className="space-y-1 ml-4 pl-3 border-l"
                      style={{ borderColor: dividerColor }}
                    >
                      {g.instruments.map((inst) => (
                        <li key={inst.instrument} className="flex items-center gap-2 text-[11px]">
                          <span aria-hidden className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: inst.color }} />
                          <span className={`flex-1 truncate ${labelBold}`} title={inst.instrument}>
                            {inst.shortLabel}
                            {inst.shortLabel !== inst.instrument && (
                              <span className={`ml-1 text-[10px] ${sub}`}>· {inst.instrument}</span>
                            )}
                          </span>
                          <span className={`text-[10px] tabular-nums ${sub}`}>{inst.count}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}

          <p className={`text-[10px] mt-4 italic ${sub}`} style={{ borderTop: `1px solid ${dividerColor}`, paddingTop: 12 }}>
            Tip: the halo around each marker grows with the source's plume count and brightens with its emission rate.
            Toggle individual sources from the grid legend (top-right Info icon) to remove them from the map.
          </p>
        </aside>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Show source legend"
        aria-pressed={open}
        title="Show source legend"
        className={`w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl transition-all ${
          open
            ? 'bg-teal-600 text-white'
            : dm
              ? 'bg-[#12161f] text-gray-400 hover:bg-[#1e2430]'
              : 'bg-[#003d33] text-teal-300 hover:bg-[#004d40]'
        }`}
      >
        <HelpCircle size={20} />
      </button>
    </div>
  );
};

export default SourceLegendHint;
