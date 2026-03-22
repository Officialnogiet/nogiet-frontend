import React from 'react';

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

const EmissionSummaryCard: React.FC<EmissionSummaryCardProps> = ({ darkMode, totalSources, totalPlumes, facilityCount = 0, satelliteCount = 0 }) => (
  <div className={`absolute bottom-8 left-6 backdrop-blur-lg shadow-2xl rounded-3xl p-8 w-80 border z-40 transition-colors ${darkMode ? 'bg-[#12161f]/90 border-[#1e2430]' : 'bg-white/95 border-gray-100/80'}`}>
    <div className="mb-8">
      <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Emission Sources</h3>
      <p className="text-xs text-gray-500 mt-1">CH&#x2084; &bull; Loaded Region</p>
      <p className={`text-5xl font-black mt-3 tracking-tight ${darkMode ? 'text-[#009688]' : 'text-gray-900'}`}>{formatCount(totalSources)}</p>
      <p className="text-[10px] text-gray-500 mt-1">{facilityCount} facilities &bull; {formatCount(satelliteCount)} satellite</p>
    </div>
    <div>
      <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Plumes Detected</h3>
      <p className="text-xs text-gray-500 mt-1">CH&#x2084; &bull; Satellite Sources</p>
      <p className={`text-5xl font-black mt-3 tracking-tight ${darkMode ? 'text-[#009688]' : 'text-gray-900'}`}>{formatCount(totalPlumes)}</p>
    </div>
  </div>
);

export default EmissionSummaryCard;
