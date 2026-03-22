import React from 'react';
import { Search, ChevronDown, SlidersHorizontal } from 'lucide-react';

interface MapSearchBarProps {
  darkMode: boolean;
  onOpenFilters?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const MapSearchBar: React.FC<MapSearchBarProps> = ({ darkMode, onOpenFilters, searchQuery = '', onSearchChange }) => (
  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-40">
    <div className={`h-16 rounded-3xl flex items-center justify-between px-6 shadow-2xl border transition-all ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-[#002f2a] border-teal-900/30'}`}>
      <div className="flex items-center gap-4 flex-1">
        <Search className={darkMode ? 'text-gray-400' : 'text-teal-400/80'} size={20} />
        <input
          className={`bg-transparent border-none focus:outline-none w-full text-sm font-medium ${darkMode ? 'text-white placeholder-gray-600' : 'text-white placeholder-teal-100/50'}`}
          placeholder="Search facility, source name or sector..."
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>
      <div className="h-8 w-px bg-white/10 mx-6" />
      <button
        onClick={onOpenFilters}
        className={`flex items-center gap-2 text-sm font-semibold transition-colors ${darkMode ? 'text-gray-400 hover:text-[#009688]' : 'text-white hover:text-teal-300'}`}
      >
        <SlidersHorizontal size={16} />
        Filters
      </button>
    </div>
  </div>
);

export default MapSearchBar;
