import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface MapZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const MapZoomControls: React.FC<MapZoomControlsProps> = ({ onZoomIn, onZoomOut }) => (
  <div className="absolute bottom-8 right-8 z-40 flex flex-col gap-3">
    <button
      onClick={onZoomIn}
      className="w-12 h-12 bg-teal-600 hover:bg-teal-700 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all active:scale-95"
    >
      <Plus size={24} />
    </button>
    <button
      onClick={onZoomOut}
      className="w-12 h-12 bg-teal-600 hover:bg-teal-700 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all active:scale-95"
    >
      <Minus size={24} />
    </button>
  </div>
);

export default MapZoomControls;
