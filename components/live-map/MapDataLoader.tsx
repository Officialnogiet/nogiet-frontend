import React from 'react';

interface MapDataLoaderProps {
  darkMode: boolean;
  mapLoaded: boolean;
  isLoadingData: boolean;
}

const MapDataLoader: React.FC<MapDataLoaderProps> = ({ darkMode, mapLoaded, isLoadingData }) => {
  const message = !mapLoaded ? 'Initializing map...' : 'Loading emission data...';
  const subMessage = !mapLoaded
    ? 'Setting up satellite view of Nigeria'
    : 'Fetching facilities & satellite sources';

  return (
    <div className={`absolute inset-0 flex items-center justify-center z-50 transition-opacity duration-500 ${darkMode ? 'bg-[#0b0e14]/85' : 'bg-gray-100/85'} backdrop-blur-sm`}>
      <div className="text-center space-y-6">
        <div className="relative mx-auto w-16 h-16">
          <div className={`absolute inset-0 rounded-full border-2 border-transparent animate-spin ${darkMode ? 'border-t-teal-400' : 'border-t-teal-600'}`} />
          <div className={`absolute inset-2 rounded-full border-2 border-transparent animate-spin ${darkMode ? 'border-b-teal-600' : 'border-b-teal-400'}`} style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          <div className={`absolute inset-[30%] rounded-full ${darkMode ? 'bg-teal-500' : 'bg-teal-600'} animate-pulse`} />
        </div>

        <div>
          <p className={`text-sm font-bold tracking-wide ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>{message}</p>
          <p className={`text-xs mt-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{subMessage}</p>
        </div>

        {isLoadingData && mapLoaded && (
          <div className="flex justify-center gap-1.5 pt-2">
            {[0, 150, 300].map((delay) => (
              <div key={delay} className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-teal-500' : 'bg-teal-600'} animate-bounce`} style={{ animationDelay: `${delay}ms` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapDataLoader;
