import React, { useCallback, useMemo, useState } from 'react';
import { Calculator, Check, Copy, Flame, Gauge, Info, RotateCcw } from 'lucide-react';

interface MethaneConverterProps {
  darkMode?: boolean;
  embedded?: boolean;
}

interface UnitDef {
  key: keyof ConversionResult;
  label: string;
  unitFn: (hours: number) => string;
  ctx: string;
  group: 'mass' | 'climate' | 'volume';
}

interface ConversionResult {
  kgperiod: number;
  tperiod: number;
  kgday: number;
  tday: number;
  Gg: number;
  Tg: number;
  Mt: number;
  co2eHr: number;
  co2ePeriod: number;
  co2eYr: number;
  scf: number;
  scm: number;
}

const CH4_DENSITY_KG_PER_M3 = 0.717;
const M3_TO_SCF = 35.3147;
const HOURS_PER_YEAR = 8760;

const PERIOD_OPTIONS = [
  { value: '1', label: '1 hour' },
  { value: '24', label: '1 day' },
  { value: '168', label: '1 week' },
  { value: '720', label: '1 month (30 days)' },
  { value: '8760', label: '1 year' },
  { value: 'custom', label: 'Custom hours' },
];

const GWP_OPTIONS = [
  { value: 29.8, label: '100-year impact', detail: 'GWP100 = 29.8x' },
  { value: 82.5, label: '20-year impact', detail: 'GWP20 = 82.5x' },
];

const UNIT_DEFS: UnitDef[] = [
  { key: 'kgperiod', label: 'Total methane', unitFn: (h) => `kg CH4 over ${periodLabel(h)}`, ctx: 'Nigerian facility total', group: 'mass' },
  { key: 'tperiod', label: 'Total methane', unitFn: (h) => `tonnes CH4 over ${periodLabel(h)}`, ctx: 'Nigerian facility total', group: 'mass' },
  { key: 'kgday', label: 'Daily methane rate', unitFn: () => 'kg CH4/day', ctx: 'Daily Nigerian site monitoring', group: 'mass' },
  { key: 'tday', label: 'Daily methane rate', unitFn: () => 't CH4/day', ctx: 'Oil, gas, and landfill sites in Nigeria', group: 'mass' },
  { key: 'Gg', label: 'Annual methane', unitFn: () => 'Gg CH4/yr', ctx: 'Nigeria inventory reporting', group: 'mass' },
  { key: 'Tg', label: 'Annual methane', unitFn: () => 'Tg CH4/yr', ctx: 'Nigerian state or sector totals', group: 'mass' },
  { key: 'Mt', label: 'Annual methane', unitFn: () => 'Mt CH4/yr', ctx: 'Nigeria-wide methane totals', group: 'mass' },
  { key: 'co2eHr', label: 'Climate impact', unitFn: () => 'kg CO2e/hr', ctx: 'Nigeria policy and reporting metric', group: 'climate' },
  { key: 'co2ePeriod', label: 'Climate impact', unitFn: (h) => `kg CO2e over ${periodLabel(h)}`, ctx: 'Nigeria carbon accounting', group: 'climate' },
  { key: 'co2eYr', label: 'Annual climate impact', unitFn: () => 't CO2e/yr', ctx: 'Nigeria emissions reporting', group: 'climate' },
  { key: 'scf', label: 'Gas volume', unitFn: () => 'scf/hr', ctx: 'Nigeria oil and gas operations', group: 'volume' },
  { key: 'scm', label: 'Gas volume', unitFn: () => 'scm/hr', ctx: 'Nigeria gas-volume reporting', group: 'volume' },
];

const RESULT_GROUPS = [
  { key: 'mass', title: 'Methane mass', description: 'Direct CH4 quantities for Nigerian facility, state, sector, and inventory reporting.' },
  { key: 'climate', title: 'Climate impact', description: 'Methane expressed as CO2-equivalent for Nigeria-focused reporting.' },
  { key: 'volume', title: 'Gas volume', description: 'Approximate standard gas volume for Nigerian oil and gas operations.' },
] as const;

function periodLabel(hours: number): string {
  const map: Record<number, string> = {
    1: '1 hr',
    24: '1 day',
    168: '1 week',
    720: '1 month',
    8760: '1 year',
  };
  return map[hours] ?? `${hours} hrs`;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value) || value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(4)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(4)}M`;
  if (abs >= 1000) return value.toLocaleString('en', { maximumFractionDigits: 2 });
  if (abs >= 1) return value.toFixed(3);
  if (abs >= 0.001) return value.toFixed(6);
  return value.toExponential(4);
}

function compute(kghr: number, hours: number, gwp: number): ConversionResult {
  const periodKg = kghr * hours;
  const annualKg = kghr * HOURS_PER_YEAR;

  return {
    kgperiod: periodKg,
    tperiod: periodKg / 1e3,
    kgday: kghr * 24,
    tday: (kghr * 24) / 1e3,
    Gg: annualKg / 1e6,
    Tg: annualKg / 1e9,
    Mt: annualKg / 1e9,
    co2eHr: kghr * gwp,
    co2ePeriod: periodKg * gwp,
    co2eYr: (annualKg * gwp) / 1e3,
    scm: kghr / CH4_DENSITY_KG_PER_M3,
    scf: (kghr / CH4_DENSITY_KG_PER_M3) * M3_TO_SCF,
  };
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

const MethaneConverter: React.FC<MethaneConverterProps> = ({ darkMode = true, embedded = false }) => {
  const dm = !!darkMode;
  const [kghr, setKghr] = useState(100);
  const [period, setPeriod] = useState('8760');
  const [customHours, setCustomHours] = useState(500);
  const [gwp, setGwp] = useState(29.8);
  const [activeUnits, setActiveUnits] = useState<Set<keyof ConversionResult>>(
    () => new Set(UNIT_DEFS.map((def) => def.key)),
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const hours = useMemo(() => {
    if (period !== 'custom') return Number(period);
    return Math.max(Number(customHours) || 1, 1);
  }, [customHours, period]);

  const results = useMemo(() => compute(Math.max(Number(kghr) || 0, 0), hours, gwp), [gwp, hours, kghr]);
  const activeResultDefs = useMemo(() => UNIT_DEFS.filter((def) => activeUnits.has(def.key)), [activeUnits]);
  const groupedResults = useMemo(
    () => RESULT_GROUPS.map((group) => ({
      ...group,
      items: activeResultDefs.filter((def) => def.group === group.key),
    })).filter((group) => group.items.length > 0),
    [activeResultDefs],
  );

  const surface = dm ? 'bg-[#0b0e14]' : 'bg-gray-50';
  const panel = dm ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-200';
  const softPanel = dm ? 'bg-[#0b0e14] border-[#1e2430]' : 'bg-gray-50 border-gray-200';
  const highlightPanel = dm ? 'bg-teal-500/10 border-teal-500/20' : 'bg-teal-50 border-teal-100';
  const heading = dm ? 'text-white' : 'text-gray-900';
  const text = dm ? 'text-gray-300' : 'text-gray-700';
  const muted = dm ? 'text-gray-500' : 'text-gray-500';
  const subtle = dm ? 'text-gray-400' : 'text-gray-600';
  const input = dm
    ? 'bg-[#0b0e14] border-[#2d364a] text-white focus:border-teal-500'
    : 'bg-white border-gray-300 text-gray-900 focus:border-teal-600';

  const triggerCopy = useCallback(async (key: string, value: string) => {
    await copyText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1400);
  }, []);

  const toggleUnit = (key: keyof ConversionResult) => {
    setActiveUnits((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const reset = () => {
    setKghr(100);
    setPeriod('8760');
    setCustomHours(500);
    setGwp(29.8);
    setActiveUnits(new Set(UNIT_DEFS.map((def) => def.key)));
  };

  const copyAll = () => {
    const lines = [
      'Nigeria Methane Converter Results',
      `Input: ${kghr} kg CH4/hr | Period: ${periodLabel(hours)} | CO2e basis: ${gwp}x`,
      ...activeResultDefs
        .map((def) => `${def.label}: ${formatNumber(results[def.key])} ${def.unitFn(hours)} (${def.ctx})`),
    ];
    triggerCopy('__all__', lines.join('\n'));
  };

  return (
    <section className={`${embedded ? '' : `flex-1 overflow-y-auto ${surface}`} ${text}`}>
      <div className={`${embedded ? '' : 'px-6 md:px-10 py-10'} mx-auto w-full max-w-[1500px]`}>
        <header className={`${embedded ? 'mb-4' : 'mb-6'} flex flex-wrap items-start justify-between gap-4`}>
          <div className="min-w-0">
            <div className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${dm ? 'text-teal-300' : 'text-teal-700'}`}>
              <Calculator size={15} />
              Unit converter
            </div>
            <h1 className={`${embedded ? 'text-xl' : 'text-2xl md:text-3xl'} mt-2 font-bold ${heading}`}>
              Nigeria Methane Emissions Converter
            </h1>
            <p className={`mt-1 text-sm ${muted}`}>
              Start with a Nigeria satellite reading in kg CH4/hr, then convert it into reporting mass, gas volume, and optional CO2e climate-impact units.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${panel} ${dm ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </header>

        <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className={`rounded-2xl border p-4 ${highlightPanel}`}>
            <div className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest ${dm ? 'text-teal-300' : 'text-teal-700'}`}>
              <Gauge size={14} />
                Nigeria satellite input
            </div>
            <p className={`mt-2 text-2xl font-bold ${heading}`}>{formatNumber(Number(kghr) || 0)}</p>
            <p className={`text-xs font-semibold ${dm ? 'text-teal-200' : 'text-teal-800'}`}>kg CH4/hr</p>
          </div>
          <div className={`rounded-2xl border p-4 ${panel}`}>
            <div className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest ${muted}`}>
              <Flame size={14} />
              Methane over period
            </div>
            <p className={`mt-2 text-2xl font-bold ${heading}`}>{formatNumber(results.tperiod)}</p>
            <p className={`text-xs font-semibold ${subtle}`}>tonnes CH4 over {periodLabel(hours)}</p>
          </div>
          <div className={`rounded-2xl border p-4 ${panel}`}>
            <div className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest ${muted}`}>
              <Info size={14} />
              CO2e basis
            </div>
            <p className={`mt-2 text-2xl font-bold ${heading}`}>{gwp}x</p>
            <p className={`text-xs font-semibold ${subtle}`}>{gwp === 29.8 ? '100-year methane climate impact' : '20-year methane climate impact'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5">
          <div className={`rounded-2xl border p-5 ${panel}`}>
            <div>
              <h2 className={`text-sm font-bold ${heading}`}>Conversion setup</h2>
              <p className={`mt-1 text-xs leading-relaxed ${muted}`}>
                Nigeria satellite methane feeds arrive as an emission rate. Choose the time window and reporting basis below.
              </p>
            </div>
            <div className="mt-4 grid gap-4">
              <label className="grid gap-1.5">
                <span className={`text-xs font-medium ${muted}`}>Satellite methane rate</span>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={kghr}
                    onChange={(event) => setKghr(Number(event.target.value))}
                    className={`h-11 w-full rounded-xl border px-3 pr-16 text-sm outline-none transition ${input}`}
                  />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold ${muted}`}>kg CH4/hr</span>
                </div>
              </label>

              <label className="grid gap-1.5">
                <span className={`text-xs font-medium ${muted}`}>Reporting period</span>
                <select
                  value={period}
                  onChange={(event) => setPeriod(event.target.value)}
                  className={`h-11 w-full rounded-xl border px-3 text-sm outline-none transition ${input}`}
                >
                  {PERIOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              {period === 'custom' && (
                <label className="grid gap-1.5">
                  <span className={`text-xs font-medium ${muted}`}>Custom hours</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={customHours}
                    onChange={(event) => setCustomHours(Number(event.target.value))}
                    className={`h-11 w-full rounded-xl border px-3 text-sm outline-none transition ${input}`}
                  />
                </label>
              )}

              <div className={`rounded-xl border p-3 ${softPanel}`}>
                <div className="flex items-start gap-2">
                  <Info size={15} className={dm ? 'text-teal-300' : 'text-teal-700'} />
                  <div>
                    <p className={`text-xs font-bold ${heading}`}>CO2e reporting basis</p>
                    <p className={`mt-0.5 text-[11px] leading-relaxed ${muted}`}>
                      Methane values stay as CH4. This only affects the CO2e climate-impact outputs.
                    </p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {GWP_OPTIONS.map((option) => {
                    const active = gwp === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setGwp(option.value)}
                        className={`rounded-xl border px-3 py-2.5 text-left transition ${
                          active
                            ? 'border-teal-500 bg-teal-500/10 text-teal-500'
                            : dm ? 'border-[#2d364a] text-gray-400 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="block text-xs font-bold">{option.label}</span>
                        <span className="block text-[11px] font-medium opacity-80">{option.detail}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className={`text-xs font-medium ${muted}`}>Visible result units</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {UNIT_DEFS.map((def) => {
                    const active = activeUnits.has(def.key);
                    return (
                      <button
                        key={def.key}
                        type="button"
                        onClick={() => toggleUnit(def.key)}
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                          active
                            ? 'border-teal-500 bg-teal-500/10 text-teal-500'
                            : dm ? 'border-[#2d364a] text-gray-500 hover:text-gray-300' : 'border-gray-200 text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        {def.unitFn(hours).replace(' over ', ' / ')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border p-5 ${panel}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className={`text-sm font-bold ${heading}`}>Converted results</h2>
                <p className={`mt-1 text-xs ${muted}`}>
                  Showing {activeResultDefs.length} unit{activeResultDefs.length === 1 ? '' : 's'} for {periodLabel(hours)}.
                </p>
              </div>
              <button
                type="button"
                onClick={copyAll}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                  copiedKey === '__all__'
                    ? 'border-teal-500 bg-teal-500/10 text-teal-500'
                    : `${dm ? 'border-[#2d364a] text-gray-400 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`
                }`}
              >
                {copiedKey === '__all__' ? <Check size={14} /> : <Copy size={14} />}
                {copiedKey === '__all__' ? 'Copied' : 'Copy all'}
              </button>
            </div>

            {activeUnits.size === 0 ? (
              <div className={`mt-4 rounded-xl border p-5 text-sm ${softPanel} ${muted}`}>
                Select at least one output unit.
              </div>
            ) : (
              <div className="mt-4 space-y-5">
                {groupedResults.map((group) => (
                  <div key={group.key}>
                    <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <h3 className={`text-xs font-bold uppercase tracking-widest ${heading}`}>{group.title}</h3>
                        <p className={`mt-0.5 text-[11px] ${muted}`}>{group.description}</p>
                      </div>
                      <span className={`text-[11px] font-semibold ${muted}`}>
                        {group.items.length} result{group.items.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {group.items.map((def) => {
                        const value = formatNumber(results[def.key]);
                        const unit = def.unitFn(hours);
                        const copyValue = `${def.label}: ${value} ${unit} (${def.ctx})`;
                        const copied = copiedKey === def.key;

                        return (
                          <article key={def.key} className={`relative rounded-xl border p-4 ${softPanel}`}>
                            <p className={`pr-8 text-[11px] font-bold uppercase tracking-wide ${muted}`}>{def.label}</p>
                            <p className={`mt-2 text-xl font-bold ${heading}`}>{value}</p>
                            <p className={`mt-1 text-xs font-semibold ${dm ? 'text-teal-300' : 'text-teal-700'}`}>{unit}</p>
                            <p className={`mt-2 text-[11px] leading-relaxed ${muted}`}>{def.ctx}</p>
                            <button
                              type="button"
                              onClick={() => triggerCopy(def.key, copyValue)}
                              className={`absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
                                copied
                                  ? 'bg-teal-500/10 text-teal-500'
                                  : dm ? 'text-gray-500 hover:bg-white/5 hover:text-gray-200' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                              }`}
                              aria-label={`Copy ${def.label}`}
                              title="Copy result"
                            >
                              {copied ? <Check size={15} /> : <Copy size={15} />}
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className={`mt-4 text-[11px] leading-relaxed ${muted}`}>
              Formula basis: methane mass = kg CH4/hr x duration; annual totals use 8,760 hr/yr; CO2e outputs multiply methane by the selected climate-impact factor; CH4 density at STP = 0.717 kg/m3; 1 m3 = 35.3147 scf.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MethaneConverter;
