import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { PPB_BREAKS, NOTIFICATION_STROKE } from './emissionGrid';
import {
  ALL_GRID_PROVIDERS,
  type GridProvider,
  type GridStatistic,
  type InstrumentAllowlist,
} from '../../src/stores/dashboard.store';

export interface GridControlsViewState {
  enabled: boolean;
  /** Multi-select. Empty array means no providers visible. */
  providers: GridProvider[];
  /** Per-provider instrument allowlist — `null` per provider = all instruments allowed. */
  instrumentsByProvider: InstrumentAllowlist;
  statistic: GridStatistic;
  showAlerts: boolean;
}

/** Discovered instrument under a given provider, with point count in current viewport. */
export interface ProviderInstrumentSummary {
  instrument: string;
  /** Friendly short label (e.g. "EnMAP" for "EnMAP - DLR"). */
  shortLabel: string;
  /** Hex color used elsewhere (Trends chart) for this instrument. */
  color: string;
  /** Point count in the current visible region. */
  count: number;
}

/** Per-provider summary block — drives the nested checkbox tree. */
export interface ProviderSourcesSummary {
  provider: GridProvider;
  /** Total points for this provider in the current viewport (sum of all instruments). */
  totalCount: number;
  /** Instruments seen for this provider, sorted by count desc. */
  instruments: ProviderInstrumentSummary[];
}

interface EmissionGridLegendProps {
  darkMode: boolean;
  state: GridControlsViewState;
  onChange: (s: GridControlsViewState) => void;
  /**
   * Per-provider source summary derived from currently-loaded points.
   * Order is preserved as supplied (caller decides display order).
   */
  providerSources?: ProviderSourcesSummary[];
  /** "Currently Showing" footer values from the map. */
  currentlyShowing?: {
    source: string;
    statistic: string;
    timeLabel: string;
    /** Inline breakdown across all selected sources, e.g. "EnMAP 12 · S-2 5 · GHGSat 3". */
    instrumentBreakdown?: string;
    onPrev?: () => void;
    onNext?: () => void;
    canPrev?: boolean;
    canNext?: boolean;
  };
  visible: boolean;
  onClose: () => void;
}

const PROVIDER_DISPLAY: Record<GridProvider, { label: string; accent: string }> = {
  carbon_mapper: { label: 'Carbon Mapper', accent: '#0d9488' },
  imeo: { label: 'IMEO (UNEP)', accent: '#22d3ee' },
  tropomi: { label: 'TROPOMI', accent: '#a78bfa' },
};

const STAT_OPTIONS: { value: GridStatistic; label: string }[] = [
  { value: 'max', label: 'Maximum reading' },
  { value: 'average', label: 'Average reading' },
  { value: 'sum', label: 'Total emissions' },
];

const EmissionGridLegend: React.FC<EmissionGridLegendProps> = ({
  darkMode, state, onChange, providerSources, currentlyShowing, visible, onClose,
}) => {
  if (!visible) return null;

  const bg = darkMode ? 'bg-[#12161f]/95' : 'bg-white/95';
  const border = darkMode ? 'border-[#1e2430]' : 'border-gray-200';
  const heading = darkMode ? 'text-white' : 'text-gray-900';
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const labelBold = darkMode ? 'text-gray-200' : 'text-gray-700';
  const dividerColor = darkMode ? '#1e2430' : '#e5e7eb';

  // Defensive: an older persisted snapshot may not include the new field.
  // Normalise once so the rest of this component never sees `undefined`.
  const safeInstrumentsByProvider: InstrumentAllowlist = state.instrumentsByProvider ?? {};

  const providerSet = new Set(state.providers ?? []);
  const allProvidersSelected = providerSet.size === ALL_GRID_PROVIDERS.length;

  const allowedInstruments = (provider: GridProvider): string[] | null => {
    const v = safeInstrumentsByProvider[provider];
    return v === undefined ? null : v;
  };

  const isInstrumentAllowed = (provider: GridProvider, name: string): boolean => {
    const list = allowedInstruments(provider);
    if (list === null) return true; // null = all allowed
    return list.includes(name);
  };

  const setInstrumentList = (provider: GridProvider, list: string[] | null) => {
    onChange({
      ...state,
      instrumentsByProvider: { ...safeInstrumentsByProvider, [provider]: list },
    });
  };

  const setProviders = (next: GridProvider[]) => {
    onChange({ ...state, providers: next });
  };

  const toggleProvider = (p: GridProvider) => {
    const next = new Set(providerSet);
    if (next.has(p)) next.delete(p); else next.add(p);
    setProviders(Array.from(next) as GridProvider[]);
  };

  const toggleAllProviders = () => {
    setProviders(allProvidersSelected ? [] : [...ALL_GRID_PROVIDERS]);
  };

  const toggleInstrument = (provider: GridProvider, instrument: string, knownInstruments: string[]) => {
    const list = allowedInstruments(provider);
    const current = list ?? [...knownInstruments];
    const next = current.includes(instrument)
      ? current.filter((n) => n !== instrument)
      : [...current, instrument];
    // Collapse back to null when every known instrument is allowed (cleaner persisted state)
    const collapse = knownInstruments.length > 0 && knownInstruments.every((i) => next.includes(i));
    setInstrumentList(provider, collapse ? null : next);
  };

  const toggleAllInstruments = (provider: GridProvider, knownInstruments: string[]) => {
    const list = allowedInstruments(provider);
    const everyOn = list === null || (knownInstruments.length > 0 && knownInstruments.every((i) => list.includes(i)));
    setInstrumentList(provider, everyOn ? [] : null);
  };

  const summaries: ProviderSourcesSummary[] = providerSources ?? ALL_GRID_PROVIDERS.map((p) => ({
    provider: p, totalCount: 0, instruments: [],
  }));

  return (
    <>
      <aside
        // Mobile: top-28 leaves room for the top-center "Load this area" pill
        // and the search bar; right-4 tucks the panel close to the edge so its
        // ~288px width doesn't push past the left side of the viewport.
        // Desktop (lg:): restores the original top-28 / right-20 spot beside
        // the legend toggle chip.
        className={`absolute top-28 right-4 lg:top-28 lg:right-20 z-30 ${bg} backdrop-blur-md rounded-2xl border ${border} shadow-2xl p-5 w-72 md:w-80 max-h-[70vh] lg:max-h-[80vh] overflow-y-auto`}
        aria-label="Emission grid legend"
      >
        <div className="flex items-start justify-between gap-2 mb-4">
          <p className={`text-[11px] leading-snug ${sub}`}>
            The maximum methane reading detected in each grid cell over the last 7 days.
          </p>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition ${darkMode ? 'hover:bg-white/5 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
            aria-label="Close grid legend"
          >
            <X size={14} />
          </button>
        </div>

        {/* PPB legend */}
        <ul className="space-y-2 mb-4">
          {PPB_BREAKS.map((b) => (
            <li key={b.label} className="flex items-center gap-3">
              <span
                aria-hidden
                className="w-7 h-5 rounded-sm border"
                style={{ backgroundColor: b.color, borderColor: dividerColor }}
              />
              <span className={`text-xs font-medium ${labelBold}`}>{b.label}</span>
            </li>
          ))}
          <li className="flex items-center gap-3 pt-1">
            <span
              aria-hidden
              className="w-7 h-5 rounded-sm border-2"
              style={{ backgroundColor: 'transparent', borderColor: NOTIFICATION_STROKE }}
            />
            <label className={`flex items-center gap-2 text-xs font-medium ${labelBold}`}>
              <input
                type="checkbox"
                className="accent-teal-600 w-3.5 h-3.5"
                checked={state.showAlerts}
                onChange={(e) => onChange({ ...state, showAlerts: e.target.checked })}
              />
              Cells with notifications
            </label>
          </li>
        </ul>

        {/* Sources tree (provider → instruments) */}
        <div className="border-t pt-4 mt-1" style={{ borderColor: dividerColor }}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${sub}`}>Sources</p>
            <button
              type="button"
              onClick={toggleAllProviders}
              className={`text-[10px] font-bold uppercase tracking-widest transition ${
                darkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'
              }`}
            >
              {allProvidersSelected ? 'Clear all' : 'Select all'}
            </button>
          </div>

          <ul className="space-y-3" role="group" aria-label="Toggle satellite providers and instruments">
            {ALL_GRID_PROVIDERS.map((p) => {
              const meta = PROVIDER_DISPLAY[p];
              const summary = summaries.find((s) => s.provider === p);
              const knownInstruments = summary?.instruments ?? [];
              const known = knownInstruments.map((i) => i.instrument);
              const providerChecked = providerSet.has(p);
              const list = allowedInstruments(p);

              const allInstChecked =
                known.length === 0 ||
                list === null ||
                known.every((i) => list.includes(i));
              const someInstChecked = !allInstChecked && (
                list != null && known.some((i) => list.includes(i))
              );
              const indeterminate = providerChecked && known.length > 0 && someInstChecked;

              return (
                <li key={p}>
                  <ProviderRow
                    darkMode={darkMode}
                    accent={meta.accent}
                    label={meta.label}
                    count={summary?.totalCount ?? 0}
                    checked={providerChecked}
                    indeterminate={indeterminate}
                    onToggle={() => toggleProvider(p)}
                    secondaryAction={knownInstruments.length > 1 && providerChecked ? {
                      label: allInstChecked ? 'Clear all' : 'Select all',
                      onClick: () => toggleAllInstruments(p, known),
                    } : undefined}
                  />

                  {providerChecked && knownInstruments.length > 0 && (
                    <ul
                      className={`mt-2 ml-7 pl-3 border-l space-y-1`}
                      style={{ borderColor: dividerColor }}
                      role="group"
                      aria-label={`${meta.label} instruments`}
                    >
                      {knownInstruments.map((inst) => {
                        const checked = isInstrumentAllowed(p, inst.instrument);
                        return (
                          <li key={inst.instrument}>
                            <label
                              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition ${
                                darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="accent-teal-600 w-3.5 h-3.5"
                                checked={checked}
                                onChange={() => toggleInstrument(p, inst.instrument, known)}
                              />
                              <span
                                aria-hidden
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: inst.color }}
                              />
                              <span
                                className={`flex-1 text-xs font-medium ${labelBold} truncate`}
                                title={inst.instrument}
                              >
                                {inst.shortLabel}
                                {inst.shortLabel !== inst.instrument && (
                                  <span className={`ml-1 text-[10px] ${sub}`}>· {inst.instrument}</span>
                                )}
                              </span>
                              <span className={`text-[10px] tabular-nums ${sub}`}>{inst.count}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {providerChecked && knownInstruments.length === 0 && (
                    <p className={`ml-7 mt-1 text-[10px] ${sub}`}>
                      No instruments returned by the API for this provider yet.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          {providerSet.size === 0 && (
            <p className={`text-[10px] mt-3 ${sub}`}>No source selected — grid will be empty.</p>
          )}
        </div>

        {/* Statistic + global enable */}
        <div className="space-y-3 border-t pt-4 mt-4" style={{ borderColor: dividerColor }}>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${sub}`}>Statistic</p>
            <select
              value={state.statistic}
              onChange={(e) => onChange({ ...state, statistic: e.target.value as GridStatistic })}
              className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${
                darkMode
                  ? 'bg-[#0b0e14] border-[#1e2430] text-gray-200 focus:border-teal-500'
                  : 'bg-white border-gray-200 text-gray-800 focus:border-teal-500'
              }`}
            >
              {STAT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <label className={`flex items-center gap-2 text-xs font-medium ${labelBold}`}>
            <input
              type="checkbox"
              className="accent-teal-600 w-3.5 h-3.5"
              checked={state.enabled}
              onChange={(e) => onChange({ ...state, enabled: e.target.checked })}
            />
            Show emissions grid
          </label>
        </div>
      </aside>

      {/* Currently Showing card */}
      {currentlyShowing && (
        <div
          className={`absolute bottom-6 left-6 z-30 ${bg} backdrop-blur-md rounded-2xl border ${border} shadow-2xl px-5 py-4 w-72`}
          role="status"
        >
          <p className={`text-sm font-bold ${heading} mb-2`}>Currently Showing</p>
          <dl className="space-y-1 text-xs">
            <div className="flex items-baseline gap-2">
              <dt className={`w-16 ${sub}`}>Source:</dt>
              <dd className={`font-semibold ${labelBold}`}>{currentlyShowing.source}</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className={`w-16 ${sub}`}>Statistic:</dt>
              <dd className={`font-semibold ${labelBold}`}>{currentlyShowing.statistic}</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className={`w-16 ${sub}`}>Time:</dt>
              <dd className={`font-semibold ${labelBold}`}>{currentlyShowing.timeLabel}</dd>
            </div>
            {currentlyShowing.instrumentBreakdown && (
              <div className="flex items-baseline gap-2">
                <dt className={`w-16 ${sub} flex-shrink-0`}>Sources:</dt>
                <dd className={`font-semibold ${labelBold} text-[10.5px] leading-snug`}>
                  {currentlyShowing.instrumentBreakdown}
                </dd>
              </div>
            )}
          </dl>
          {(currentlyShowing.onPrev || currentlyShowing.onNext) && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={currentlyShowing.onPrev}
                disabled={currentlyShowing.canPrev === false}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  darkMode ? 'bg-[#1e2430] text-gray-300 hover:bg-[#262f3d] disabled:opacity-40' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40'
                }`}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={currentlyShowing.onNext}
                disabled={currentlyShowing.canNext === false}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  darkMode ? 'bg-[#1e2430] text-gray-300 hover:bg-[#262f3d] disabled:opacity-40' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40'
                }`}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

/** Top-level provider checkbox row — supports the indeterminate visual state. */
const ProviderRow: React.FC<{
  darkMode: boolean;
  accent: string;
  label: string;
  count: number;
  checked: boolean;
  indeterminate?: boolean;
  onToggle: () => void;
  secondaryAction?: { label: string; onClick: () => void };
}> = ({ darkMode, accent, label, count, checked, indeterminate, onToggle, secondaryAction }) => {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);

  const labelBold = darkMode ? 'text-gray-200' : 'text-gray-800';
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const teal = darkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700';

  return (
    <div className="flex items-center gap-2">
      <label
        className={`flex-1 flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition ${
          darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'
        }`}
      >
        <input
          ref={ref}
          type="checkbox"
          className="accent-teal-600 w-4 h-4"
          checked={checked}
          onChange={onToggle}
        />
        <span aria-hidden className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
        <span className={`flex-1 text-xs font-bold ${labelBold}`}>{label}</span>
        {count > 0 && <span className={`text-[10px] tabular-nums font-medium ${sub}`}>{count}</span>}
      </label>
      {secondaryAction && (
        <button
          type="button"
          onClick={secondaryAction.onClick}
          className={`text-[10px] font-bold uppercase tracking-wider transition px-2 ${teal}`}
        >
          {secondaryAction.label}
        </button>
      )}
    </div>
  );
};

export default EmissionGridLegend;
