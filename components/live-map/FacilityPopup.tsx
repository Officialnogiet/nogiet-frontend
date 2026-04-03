import React from 'react';
import { ChevronRight, ExternalLink, X } from 'lucide-react';

export interface FacilityData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sector: string;
  region?: string | null;
  isSatellite?: boolean;
  emissionRate?: number;
  emissionUncertainty?: number;
  plumeCount?: number;
  persistence?: number;
  instrument?: string;
  firstDetected?: string;
  lastDetected?: string;
}

interface FacilityPopupProps {
  darkMode: boolean;
  facility: FacilityData;
  onExpand: () => void;
  onClose: () => void;
}

const FacilityPopup: React.FC<FacilityPopupProps> = ({ darkMode, facility, onExpand, onClose }) => (
  <div className={`fixed bottom-16 left-0 right-0 mx-auto w-[92%] md:absolute md:bottom-auto md:left-[55%] md:right-auto md:top-1/2 md:-translate-y-1/2 md:ml-4 md:w-72 md:mx-0 rounded-3xl shadow-2xl p-6 border z-50 transition-colors animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-right-4 duration-300 ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'}`}>
    <button onClick={onClose} className={`absolute top-3 right-3 p-1.5 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
      <X size={16} />
    </button>

    <h3 className={`font-bold text-base break-all pr-6 leading-snug ${darkMode ? 'text-white' : 'text-gray-900'}`}>{facility.name}</h3>

    <div className="flex items-center gap-2 mt-2">
      {facility.isSatellite ? (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400">Satellite Source</span>
      ) : (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-400">Facility</span>
      )}
      {(facility.plumeCount ?? 0) > 0 && (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${facility.isSatellite ? 'bg-orange-500/10 text-orange-300' : 'bg-teal-500/10 text-teal-300'}`}>
          {facility.plumeCount} {facility.isSatellite ? 'plume' : 'measurement'}{(facility.plumeCount ?? 0) > 1 ? 's' : ''}
        </span>
      )}
    </div>

    <a
      href={`https://www.google.com/maps?q=${facility.latitude},${facility.longitude}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-teal-500 text-xs font-bold mt-2 flex items-center gap-1 hover:underline"
    >
      Open in Google Maps <ExternalLink size={12} />
    </a>

    <div className="mt-4 space-y-2.5 text-sm">
      <PopupRow darkMode={darkMode} label="Sector" value={facility.sector} />
      {facility.region && <PopupRow darkMode={darkMode} label="Region" value={facility.region} />}
      <PopupRow darkMode={darkMode} label="Gas Type" value="CH₄" />
      {facility.isSatellite && (
        <PopupRow
          darkMode={darkMode}
          label="Emission Rate"
          value={facility.emissionRate && facility.emissionRate > 0
            ? `${facility.emissionRate.toFixed(1)} kg/hr`
            : 'N/A'}
        />
      )}
      {facility.isSatellite && facility.emissionUncertainty != null && facility.emissionUncertainty > 0 && (
        <PopupRow darkMode={darkMode} label="Uncertainty" value={`± ${facility.emissionUncertainty.toFixed(1)} kg/hr`} />
      )}
      {facility.isSatellite && (facility.persistence ?? 0) > 0 && (
        <PopupRow darkMode={darkMode} label="Persistence" value={`${((facility.persistence ?? 0) * 100).toFixed(0)}%`} />
      )}
      {(facility.plumeCount ?? 0) > 0 && (
        <PopupRow darkMode={darkMode} label={facility.isSatellite ? 'Plume Count' : 'Measurements'} value={String(facility.plumeCount)} border={false} />
      )}
    </div>

    <button
      onClick={onExpand}
      className="w-full mt-5 bg-teal-600 text-white py-3 rounded-2xl font-bold hover:bg-teal-700 transition-all flex items-center justify-center gap-2"
    >
      View Full Details <ChevronRight size={16} />
    </button>
  </div>
);

const PopupRow: React.FC<{ darkMode: boolean; label: string; value: string; border?: boolean }> = ({ darkMode, label, value, border = true }) => (
  <div className={`flex justify-between py-2 ${border ? `border-b ${darkMode ? 'border-[#1e2430]' : 'border-gray-50'}` : ''}`}>
    <span className="text-gray-500">{label}</span>
    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{value}</span>
  </div>
);

export default FacilityPopup;
