import React from 'react';

interface PreloaderProps {
  darkMode: boolean;
  mapLoaded: boolean;
  isLoadingData: boolean;
}

const Preloader: React.FC<PreloaderProps> = ({ darkMode }) => {

    return (
        <div className={`absolute inset-0 flex items-center justify-center z-50 transition-opacity duration-500 ${darkMode ? 'bg-[#0b0e14]/85' : 'bg-gray-100/85'} backdrop-blur-sm`}>
            <div className="text-center space-y-6">
                <div className="relative mx-auto w-16 h-16">
                    <div className={`absolute inset-0 rounded-full border-2 border-transparent animate-spin ${darkMode ? 'border-t-teal-400' : 'border-t-teal-600'}`} />
                    <div className={`absolute inset-2 rounded-full border-2 border-transparent animate-spin ${darkMode ? 'border-b-teal-600' : 'border-b-teal-400'}`} style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                    <div className={`absolute inset-[30%] rounded-full ${darkMode ? 'bg-teal-500' : 'bg-teal-600'} animate-pulse`} />
                </div>
            </div>
        </div>
    )
}

export default Preloader;