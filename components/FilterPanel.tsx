import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronDown, Calendar } from 'lucide-react';
import { useDashboardStore } from '../src/stores/dashboard.store';

export interface MapFilters {
  showFacilities: boolean;
  showSatellite: boolean;
  sectors: string[];
  gasType: 'CH4' | 'CO2';
  instruments: string[];
  minEmissionRate: number;
  maxEmissionRate: number;
  minPlumes: number;
  maxPlumes: number;
  minPersistence: number;
  maxPersistence: number;
}

export const DEFAULT_FILTERS: MapFilters = {
  showFacilities: true,
  showSatellite: true,
  sectors: [],
  gasType: 'CH4',
  instruments: [],
  minEmissionRate: 0,
  maxEmissionRate: 20800,
  minPlumes: 0,
  maxPlumes: 480,
  minPersistence: 0,
  maxPersistence: 100,
};

interface FilterPanelProps {
  onClose: () => void;
  darkMode?: boolean;
  filters?: MapFilters;
  onApply?: (filters: MapFilters) => void;
}

const SECTORS = [
  'Oil and Gas',
  // 'Coal Mining',
  // 'Waste Management',
  // 'Agriculture',
  // 'Other',
];
const INSTRUMENTS = ['NASA EMIT', 'EMU', 'NASA AVIRIS-NG', 'NASA AVIRIS-3', 'ASU GAO'];

const FilterPanel: React.FC<FilterPanelProps> = ({ onClose, darkMode = true, filters, onApply }) => {
  const [local, setLocal] = useState<MapFilters>(filters ?? DEFAULT_FILTERS);
  const { setFilterOpen } = useDashboardStore();

  useEffect(() => {
    if (filters) setLocal(filters);
  }, [filters]);

  const toggleSector = (s: string) => {
    setLocal(prev => ({
      ...prev,
      sectors: prev.sectors.includes(s) ? prev.sectors.filter(x => x !== s) : [...prev.sectors, s],
    }));
  };

  const toggleInstrument = (i: string) => {
    setLocal(prev => ({
      ...prev,
      instruments: prev.instruments.includes(i) ? prev.instruments.filter(x => x !== i) : [...prev.instruments, i],
    }));
  };

  const handleDone = () => {
    onApply?.(local);
    setFilterOpen(false);
  };

  const handleReset = () => {
    const reset = { ...DEFAULT_FILTERS };
    setLocal(reset);
    onApply?.(reset);
  };

  const Checkbox: React.FC<{ checked: boolean; onChange: () => void; label: string }> = ({ checked, onChange, label }) => (
    <label className="flex items-center gap-3 group cursor-pointer" onClick={onChange}>
      <div className={`w-5 h-5 border-2 rounded-md transition-all flex items-center justify-center ${checked ? 'bg-[#009688]/20 border-[#009688]' : darkMode ? 'bg-[#1a1f2b] border-[#2d364a]' : 'bg-white border-gray-200'}`}>
        {checked && <div className="w-2.5 h-2.5 rounded-sm bg-[#009688]" />}
      </div>
      <span className={`text-[13px] font-bold transition-colors ${darkMode ? 'text-gray-400 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>{label}</span>
    </label>
  );

  return (
    <div className="absolute inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-gray-900/20" onClick={onClose} />
      <div className={`relative w-[450px] h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300 transition-colors ${darkMode ? 'bg-[#12161f]' : 'bg-white'}`}>
        <div className={`p-8 border-b flex justify-between items-center ${darkMode ? 'border-[#1e2430]' : 'border-gray-100'}`}>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Filter</h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 flex-1">
          {/* Data Sources */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Data Sources</h3>
            </div>
            <div className="space-y-3">
              <Checkbox checked={local.showFacilities} onChange={() => setLocal(p => ({ ...p, showFacilities: !p.showFacilities }))} label="In-app Facility Sources" />
              <Checkbox checked={local.showSatellite} onChange={() => setLocal(p => ({ ...p, showSatellite: !p.showSatellite }))} label="CarbonMapper Satellite" />
            </div>
          </section>

          {/* Date Range */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Date Range</h3>
              <ChevronDown size={20} className="text-gray-400" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input type="text" placeholder="Start Date"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-teal-500 transition-all ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white placeholder-gray-700' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`} />
                <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="flex-1 relative">
                <input type="text" placeholder="End Date"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-teal-500 transition-all ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-white placeholder-gray-700' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`} />
                <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </section>

          {/* Sector */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sector</h3>
              <ChevronDown size={20} className="text-gray-400" />
            </div>
            <div className="space-y-3">
              {SECTORS.map(s => (
                <Checkbox key={s} checked={local.sectors.length === 0 || local.sectors.includes(s)} onChange={() => toggleSector(s)} label={s} />
              ))}
            </div>
          </section>

          {/* Instrument */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Instrument</h3>
              <ChevronDown size={20} className="text-gray-400" />
            </div>
            <div className="space-y-3">
              {INSTRUMENTS.map(inst => (
                <Checkbox key={inst} checked={local.instruments.length === 0 || local.instruments.includes(inst)} onChange={() => toggleInstrument(inst)} label={inst} />
              ))}
            </div>
          </section>

          {/* Gas Type */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Gas Type</h3>
              <ChevronDown size={20} className="text-gray-400" />
            </div>
            <Checkbox checked={local.gasType === 'CH4'} onChange={() => setLocal(p => ({ ...p, gasType: 'CH4' }))} label="CH₄" />
          </section>

          {/* Emission Unit */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Emission Unit</h3>
              <ChevronDown size={20} className="text-gray-400" />
            </div>
            <div className={`w-full border rounded-xl px-4 py-3 text-sm font-medium flex justify-between items-center transition-all ${darkMode ? 'bg-[#0b0e14] border-[#1e2430] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
              Kg/hr
              <ChevronDown size={16} />
            </div>
          </section>

          {/* Range Sliders */}
          <RangeSliderSection
            darkMode={darkMode}
            label="Source Emission Rate"
            min={0} max={20800}
            valueMin={local.minEmissionRate} valueMax={local.maxEmissionRate}
            onChange={(lo, hi) => setLocal(p => ({ ...p, minEmissionRate: lo, maxEmissionRate: hi }))}
          />
          <RangeSliderSection
            darkMode={darkMode}
            label="Number of Plumes"
            min={0} max={480}
            valueMin={local.minPlumes} valueMax={local.maxPlumes}
            onChange={(lo, hi) => setLocal(p => ({ ...p, minPlumes: lo, maxPlumes: hi }))}
          />
          <RangeSliderSection
            darkMode={darkMode}
            label="Source Persistence"
            min={0} max={100} suffix="%"
            valueMin={local.minPersistence} valueMax={local.maxPersistence}
            onChange={(lo, hi) => setLocal(p => ({ ...p, minPersistence: lo, maxPersistence: hi }))}
          />
        </div>

        <div className={`p-8 border-t flex gap-4 transition-colors ${darkMode ? 'border-[#1e2430]' : 'border-gray-100'}`}>
          <button onClick={handleReset} className={`flex-1 border rounded-2xl py-4 font-bold transition-all ${darkMode ? 'border-[#1e2430] text-gray-400 hover:bg-gray-800' : 'border-gray-200 text-gray-900 hover:bg-gray-50'}`}>Reset</button>
          <button onClick={handleDone} className="flex-1 bg-teal-600 text-white rounded-2xl py-4 font-bold hover:bg-teal-700 shadow-xl shadow-teal-600/20">Done</button>
        </div>
      </div>
    </div>
  );
};

interface RangeSliderSectionProps {
  darkMode: boolean;
  label: string;
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  suffix?: string;
  onChange: (lo: number, hi: number) => void;
}

const RangeSliderSection: React.FC<RangeSliderSectionProps> = ({ darkMode, label, min, max, valueMin, valueMax, suffix = '', onChange }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<'min' | 'max' | null>(null);

  const pctMin = ((valueMin - min) / (max - min)) * 100;
  const pctMax = ((valueMax - min) / (max - min)) * 100;

  const resolveValue = useCallback((clientX: number) => {
    if (!trackRef.current) return null;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(min + pct * (max - min));
  }, [min, max]);

  const onPointerDown = useCallback((thumb: 'min' | 'max') => (e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = thumb;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const val = resolveValue(e.clientX);
    if (val === null) return;
    if (dragging.current === 'min') {
      onChange(Math.min(val, valueMax), valueMax);
    } else {
      onChange(valueMin, Math.max(val, valueMin));
    }
  }, [resolveValue, onChange, valueMin, valueMax]);

  const onPointerUp = useCallback(() => { dragging.current = null; }, []);

  const displayLabel = `${valueMin}${suffix}-${valueMax}${suffix}`;

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</h3>
        <ChevronDown size={20} className="text-gray-400" />
      </div>
      <div className="relative pt-6 px-2" onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap">
          {displayLabel}
        </div>
        <div ref={trackRef} className={`h-1.5 w-full rounded-full relative ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <div className="absolute h-full bg-teal-600 rounded-full" style={{ left: `${pctMin}%`, width: `${pctMax - pctMin}%` }} />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-teal-600 rounded-full shadow-md cursor-grab active:cursor-grabbing touch-none"
            style={{ left: `${pctMin}%` }}
            onPointerDown={onPointerDown('min')}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-teal-600 rounded-full shadow-md cursor-grab active:cursor-grabbing touch-none"
            style={{ left: `${pctMax}%` }}
            onPointerDown={onPointerDown('max')}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-tight">
          <span>{min}{suffix}</span>
          <span>{max}{suffix}</span>
        </div>
      </div>
    </section>
  );
};

export default FilterPanel;
