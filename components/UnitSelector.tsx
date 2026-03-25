import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSettingsStore } from '../src/stores/settings.store';
import { EMISSION_UNITS, type EmissionUnit } from '../src/utils/unit-conversion';

interface UnitSelectorProps {
  darkMode: boolean;
}

const UnitSelector: React.FC<UnitSelectorProps> = ({ darkMode }) => {
  const { emissionUnit, setEmissionUnit } = useSettingsStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const bg = darkMode ? 'bg-[#1a1f2b]' : 'bg-white';
  const border = darkMode ? 'border-[#1e2430]' : 'border-gray-200';
  const text = darkMode ? 'text-white' : 'text-gray-900';
  const hoverBg = darkMode ? 'hover:bg-[#252b3a]' : 'hover:bg-gray-50';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${border} ${bg} ${text} text-xs font-semibold transition-all ${hoverBg}`}
      >
        <span className="text-teal-500 text-[10px] font-bold">UNIT</span>
        <span>{emissionUnit}</span>
        <ChevronDown size={12} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>
      {open && (
        <div className={`absolute top-full mt-1 right-0 ${bg} border ${border} rounded-lg shadow-xl z-50 py-1 min-w-[120px]`}>
          {EMISSION_UNITS.map(unit => (
            <button
              key={unit}
              onClick={() => { setEmissionUnit(unit); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-medium ${
                unit === emissionUnit ? 'text-teal-500 bg-teal-500/10' : `${text} ${hoverBg}`
              }`}
            >
              {unit}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default UnitSelector;
