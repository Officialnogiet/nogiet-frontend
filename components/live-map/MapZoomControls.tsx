import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface MapZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const MapZoomControls: React.FC<MapZoomControlsProps> = ({ onZoomIn, onZoomOut }) => (
  // Mobile: lifted to clear the bottom-nav (h-16) + tucked closer to the
  // right edge so it doesn't crowd the EmissionSummaryCard pill. Buttons
  // also shrink to 10×10 so two of them stack within thumb-reach height.
  // Desktop (lg:): restores the original 48×48 buttons at bottom-8 right-8.
  <div className="absolute bottom-24 right-4 lg:bottom-8 lg:right-8 z-40 flex flex-col gap-2 lg:gap-3">
    <button
      onClick={onZoomIn}
      className="w-10 h-10 lg:w-12 lg:h-12 bg-teal-600 hover:bg-teal-700 rounded-xl lg:rounded-2xl flex items-center justify-center text-white shadow-xl transition-all active:scale-95"
      aria-label="Zoom in"
    >
      <Plus size={20} className="lg:hidden" />
      <Plus size={24} className="hidden lg:block" />
    </button>
    <button
      onClick={onZoomOut}
      className="w-10 h-10 lg:w-12 lg:h-12 bg-teal-600 hover:bg-teal-700 rounded-xl lg:rounded-2xl flex items-center justify-center text-white shadow-xl transition-all active:scale-95"
      aria-label="Zoom out"
    >
      <Minus size={20} className="lg:hidden" />
      <Minus size={24} className="hidden lg:block" />
    </button>
  </div>
);

export default MapZoomControls;
