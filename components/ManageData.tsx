import React, { useState } from 'react';
import AddFacilityForm from './manage-data/AddFacilityForm';
import FacilityList from './manage-data/FacilityList';
import FacilityDetail from './manage-data/FacilityDetail';
import { useFacilities } from '../src/hooks/useEmissions';
import type { Facility } from '../src/api/emissions.api';

interface ManageDataProps {
  darkMode?: boolean;
  onNavigateAlerts?: () => void;
}

const ManageData: React.FC<ManageDataProps> = ({ darkMode }) => {
  const { data: facilities = [], isLoading: facilitiesLoading } = useFacilities();
  const [selectedId, setSelectedId] = useState<string>('');

  const selectedFacility = (facilities as Facility[]).find((f) => f.id === selectedId);

  return (
    <div className={`flex-1 overflow-y-auto p-8 pt-12 transition-colors duration-300 ${darkMode ? 'bg-[#0b0e14]' : 'bg-white'}`}>
      <div className="max-w-480 mx-auto">
        <h1 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Manage Data</h1>
        <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Add facilities and manage emission data entries.
        </p>

        <div className="mt-8 flex flex-col lg:flex-row gap-10">
          <div className="w-full lg:w-[420px]">
            <AddFacilityForm darkMode={!!darkMode} />
          </div>
          <div className="flex-1">
            {selectedFacility ? (
              <FacilityDetail darkMode={!!darkMode} facility={selectedFacility} onBack={() => setSelectedId('')} />
            ) : (
              <FacilityList darkMode={!!darkMode} facilities={facilities as Facility[]} isLoading={facilitiesLoading} selectedId={selectedId} onSelect={setSelectedId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageData;
