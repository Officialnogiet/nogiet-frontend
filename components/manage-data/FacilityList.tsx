import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { Facility } from '../../src/api/emissions.api';

interface FacilityListProps {
  darkMode: boolean;
  facilities: Facility[];
  isLoading?: boolean;
  selectedId?: string;
  onSelect: (id: string) => void;
}

const FacilityList: React.FC<FacilityListProps> = ({ darkMode, facilities, isLoading, selectedId, onSelect }) => (
  <div className={`rounded-[32px] shadow-sm p-10 border transition-colors ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-50'}`}>
    <div className="flex justify-between items-center mb-6">
      <div>
        <h3 className={`font-extrabold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Facilities</h3>
        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{facilities.length} registered</p>
      </div>
    </div>
    <div className="space-y-3 max-h-[560px] overflow-y-auto pr-2">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Loading facilities...</p>
        </div>
      ) : facilities.length === 0 ? (
        <p className={`text-sm text-center py-12 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>No facilities yet. Add one using the form.</p>
      ) : (
        facilities.map((f) => (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            className={`w-full text-left p-5 rounded-2xl border transition-all ${
              selectedId === f.id
                ? darkMode ? 'bg-teal-500/10 border-teal-500/40' : 'bg-teal-50 border-teal-300'
                : darkMode ? 'bg-[#0b0e14]/50 border-[#1e2430] hover:border-teal-500/30' : 'bg-gray-50 border-gray-100 hover:border-teal-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className={`font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{f.name}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${darkMode ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-50 text-teal-700'}`}>{f.sector}</span>
                  {f.region && <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{f.region}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className={`text-[11px] font-mono ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                  {f.latitude.toFixed(3)}, {f.longitude.toFixed(3)}
                </span>
                <ChevronRight size={16} className={`${darkMode ? 'text-gray-600' : 'text-gray-400'} transition-transform ${selectedId === f.id ? 'rotate-90' : ''}`} />
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  </div>
);

export default FacilityList;
