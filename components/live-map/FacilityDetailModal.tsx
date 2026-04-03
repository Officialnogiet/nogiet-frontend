import React from 'react';
import { X, ExternalLink, Share2, Download, Satellite, Activity, Calendar, Gauge } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { FacilityData } from './FacilityPopup';

interface FacilityDetailModalProps {
  darkMode: boolean;
  facility: FacilityData;
  chartData: { date: string; rate: number }[];
  isLoadingChart: boolean;
  onClose: () => void;
  onShareReport: () => void;
  onExportCSV: () => void;
}

const FacilityDetailModal: React.FC<FacilityDetailModalProps> = ({
  darkMode, facility, chartData, isLoadingChart, onClose, onShareReport, onExportCSV,
}) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-[100]" onClick={onClose}>
    <div
      className={`rounded-3xl w-full max-w-6xl h-[90vh] max-h-[850px] shadow-2xl overflow-hidden flex flex-col transition-colors ${darkMode ? 'bg-[#12161f]' : 'bg-white'}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`px-10 py-6 border-b flex justify-between items-center gap-4 ${darkMode ? 'bg-[#0b0e14]/50 border-[#1e2430]' : 'bg-gray-50/50 border-gray-100'}`}>
        <div className="min-w-0 flex-1">
          <h2 className={`text-xl font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`} title={facility.name}>{facility.name}</h2>
          <p className="text-teal-600 text-sm mt-1 flex items-center gap-2">
            <ExternalLink size={14} />
            {facility.latitude.toFixed(4)}&deg; N, {facility.longitude.toFixed(4)}&deg; E
          </p>
        </div>
        <button onClick={onClose} className={`flex-shrink-0 p-3 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500'}`}>
          <X size={24} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <MetadataPanel darkMode={darkMode} facility={facility} />
        {facility.isSatellite ? (
          <SatelliteDataPanel darkMode={darkMode} facility={facility} />
        ) : (
          <GroundChartPanel darkMode={darkMode} chartData={chartData} isLoading={isLoadingChart} />
        )}
      </div>

      <div className={`px-10 py-6 border-t flex justify-end gap-4 transition-colors ${darkMode ? 'bg-[#0b0e14]/50 border-[#1e2430]' : 'bg-gray-50 border-gray-100'}`}>
        <button onClick={onShareReport} className={`flex items-center gap-2 px-7 py-3 border-2 rounded-2xl font-medium transition-all ${darkMode ? 'border-[#1e2430] text-gray-400 hover:bg-white/5' : 'border-gray-200 text-gray-500 hover:bg-white hover:border-teal-200'}`}>
          <Share2 size={18} className="text-gray-500" /> Share Report
        </button>
        <button onClick={onExportCSV} className="flex items-center gap-2 bg-teal-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-teal-700 shadow-lg transition-all">
          <Download size={18} /> Export Data
        </button>
      </div>
    </div>
  </div>
);

const MetadataPanel: React.FC<{ darkMode: boolean; facility: FacilityData }> = ({ darkMode, facility }) => {
  const rows = [
    { label: 'Sector', value: facility.sector },
    { label: 'Region', value: facility.region ?? 'N/A' },
    { label: 'Gas Type', value: 'CH\u2084' },
    { label: 'Data Source', value: facility.isSatellite ? 'CarbonMapper Satellite' : 'NOGIET Ground' },
    { label: 'Coordinates', value: `${facility.latitude.toFixed(4)}, ${facility.longitude.toFixed(4)}` },
  ];

  return (
    <div className={`w-80 p-10 border-r flex flex-col transition-colors ${darkMode ? 'bg-[#0b0e14] border-[#1e2430]' : 'bg-gray-50 border-gray-100'}`}>
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">
          {facility.isSatellite ? 'Satellite Source' : 'Facility Info'}
        </p>
        <p className={`text-sm font-bold break-all ${darkMode ? 'text-[#009688]' : 'text-teal-700'}`}>{facility.name}</p>
      </div>
      <div className="space-y-7 flex-1">
        {rows.map((item) => (
          <div key={item.label}>
            <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-600' : 'text-gray-500'}`}>{item.label}</p>
            <p className={`text-base font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{item.value}</p>
          </div>
        ))}
      </div>
      <div className={`pt-6 mt-auto border-t text-xs italic ${darkMode ? 'border-gray-800 text-gray-600' : 'border-gray-200 text-gray-500'}`}>
        {facility.isSatellite ? 'Data from CarbonMapper satellite observations' : 'Data from NOGIET database'}
      </div>
    </div>
  );
};

const SatelliteDataPanel: React.FC<{ darkMode: boolean; facility: FacilityData }> = ({ darkMode, facility }) => {
  const rateValue = (facility.emissionRate ?? 0) > 0
    ? `${(facility.emissionRate ?? 0).toFixed(1)} kg/hr`
    : 'N/A';
  const uncertaintyStr = (facility.emissionUncertainty ?? 0) > 0
    ? `± ${(facility.emissionUncertainty ?? 0).toFixed(1)} kg/hr`
    : '';

  const cards = [
    { icon: <Gauge size={20} />, label: 'Emission Rate', value: rateValue, sub: uncertaintyStr, accent: 'text-orange-400' },
    { icon: <Activity size={20} />, label: 'Plume Count', value: String(facility.plumeCount ?? 0), sub: '', accent: 'text-teal-400' },
    { icon: <Satellite size={20} />, label: 'Persistence', value: `${((facility.persistence ?? 0) * 100).toFixed(0)}%`, sub: '', accent: 'text-blue-400' },
    { icon: <Satellite size={20} />, label: 'Instrument', value: facility.instrument || 'N/A', sub: '', accent: 'text-purple-400' },
    { icon: <Calendar size={20} />, label: 'First Detected', value: facility.firstDetected || 'N/A', sub: '', accent: 'text-gray-400' },
    { icon: <Calendar size={20} />, label: 'Last Detected', value: facility.lastDetected || 'N/A', sub: '', accent: 'text-gray-400' },
  ];

  return (
    <div className="flex-1 p-10 flex flex-col overflow-y-auto">
      <h3 className={`text-2xl font-bold mb-8 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Satellite Observations</h3>
      <div className="grid grid-cols-2 gap-5 flex-1">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-2xl p-6 border transition-colors ${darkMode ? 'bg-[#0b0e14] border-[#1e2430]' : 'bg-gray-50 border-gray-100'}`}>
            <div className={`mb-3 ${card.accent}`}>{card.icon}</div>
            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{card.label}</p>
            <p className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{card.value}</p>
            {card.sub && <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{card.sub}</p>}
          </div>
        ))}
      </div>
      <p className={`mt-6 text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
        Source data provided by CarbonMapper.org satellite emissions monitoring platform.
      </p>
    </div>
  );
};

const GroundChartPanel: React.FC<{ darkMode: boolean; chartData: { date: string; rate: number }[]; isLoading: boolean }> = ({ darkMode, chartData, isLoading }) => (
  <div className="flex-1 p-10 flex flex-col">
    <h3 className={`text-2xl font-bold mb-8 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Ground Measurement History</h3>
    <div className="flex-1">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No ground measurement data yet.</p>
            <p className={`text-xs mt-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              Submit readings via the Manage Data page to see trends here.
            </p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" />
                <stop offset="95%" stopColor="#0f766e" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={darkMode ? '#1e2430' : '#f0f0f0'} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} dy={12} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }} unit=" kg/hr" />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px', color: 'white', padding: '12px 16px' }} />
            <Bar dataKey="rate" fill="url(#colorRate)" radius={[8, 8, 0, 0]} barSize={48} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>
);

export default FacilityDetailModal;
