import React, { useState } from 'react';

interface ComparisonMeta {
  mode: string;
  radiusKm: number;
  matchCount: number;
}

interface ComparisonModeToggleProps {
  darkMode: boolean;
  mode: 'nearest' | 'area';
  onChange: (mode: 'nearest' | 'area') => void;
  meta?: ComparisonMeta;
}

const ComparisonModeToggle: React.FC<ComparisonModeToggleProps> = ({ darkMode, mode, onChange, meta }) => {
  const [showHint, setShowHint] = useState(false);

  const hintText = mode === 'nearest'
    ? 'Closest Match compares against the single closest CarbonMapper source to your facility coordinates.'
    : 'Area Sources compares against all CarbonMapper detections within the search radius.';

  const metaLabel = meta
    ? mode === 'nearest'
      ? meta.matchCount > 0 ? `${meta.radiusKm}km` : 'No match'
      : `${meta.matchCount} src${meta.matchCount !== 1 ? 's' : ''}`
    : null;

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <div className={`inline-flex rounded-lg p-0.5 ${darkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
        <button onClick={() => onChange('nearest')}
          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${mode === 'nearest' ? 'bg-[#009688] text-white shadow-sm' : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
          Closest
        </button>
        <button onClick={() => onChange('area')}
          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${mode === 'area' ? 'bg-[#009688] text-white shadow-sm' : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
          Area
        </button>
      </div>

      <div className="relative">
        <button onMouseEnter={() => setShowHint(true)} onMouseLeave={() => setShowHint(false)}
          className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${darkMode ? 'bg-white/10 text-gray-500 hover:text-white' : 'bg-gray-200 text-gray-400 hover:text-gray-700'}`}>
          ?
        </button>
        {showHint && (
          <div className={`absolute left-1/2 -translate-x-1/2 top-6 z-50 w-56 px-3 py-2 rounded-xl text-[10px] leading-relaxed shadow-xl border ${darkMode ? 'bg-[#161b22] text-gray-300 border-white/10' : 'bg-white text-gray-600 border-gray-200'}`}>
            <p>{hintText}</p>
            <div className={`w-2 h-2 rotate-45 absolute -top-1 left-1/2 -translate-x-1/2 ${darkMode ? 'bg-[#161b22]' : 'bg-white'}`} />
          </div>
        )}
      </div>

      {metaLabel && (
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-50 text-teal-700'}`}>
          {metaLabel}
        </span>
      )}
    </div>
  );
};

export default ComparisonModeToggle;
