import React from 'react';
import { Layers, Map, Grid3x3, Hexagon, Activity, Thermometer } from 'lucide-react';
import { type MapLayerState } from '../../src/stores/dashboard.store';

export type { MapLayerState };

interface LayerTogglePanelProps {
  darkMode: boolean;
  layers: MapLayerState;
  onToggle: (layer: keyof MapLayerState) => void;
  visible: boolean;
  onClose: () => void;
}

const LAYER_ITEMS: { key: keyof MapLayerState; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'states', label: 'State Boundaries', icon: <Map size={16} />, color: '#60a5fa' },
  { key: 'lgas', label: 'LGA Boundaries', icon: <Grid3x3 size={16} />, color: '#a78bfa' },
  { key: 'oilBlocks', label: 'Oil Blocks', icon: <Hexagon size={16} />, color: '#f59e0b' },
  { key: 'pipelines', label: 'Pipelines', icon: <Activity size={16} />, color: '#ef4444' },
  { key: 'satelliteView', label: 'Satellite Imagery', icon: <Layers size={16} />, color: '#10b981' },
  { key: 'emissionHotspots', label: 'Emission Hotspots', icon: <Thermometer size={16} />, color: '#f97316' },
];

const LayerTogglePanel: React.FC<LayerTogglePanelProps> = ({ darkMode, layers, onToggle, visible, onClose }) => {
  if (!visible) return null;

  const bg = darkMode ? 'bg-[#12161f]/95' : 'bg-white/95';
  const border = darkMode ? 'border-[#1e2430]' : 'border-gray-200';
  const text = darkMode ? 'text-white' : 'text-gray-900';
  const subText = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`absolute top-44 right-4 z-30 ${bg} backdrop-blur-sm rounded-xl border ${border} shadow-xl p-4 w-56`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-teal-500" />
          <span className={`text-sm font-bold ${text}`}>Layers</span>
        </div>
        <button onClick={onClose} className={`text-xs ${subText} hover:text-teal-500`}>Close</button>
      </div>
      <div className="space-y-1">
        {LAYER_ITEMS.map(item => (
          <button
            key={item.key}
            onClick={() => onToggle(item.key)}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-all ${
              layers[item.key]
                ? darkMode ? 'bg-white/5' : 'bg-gray-50'
                : ''
            } ${darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
          >
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0 border"
              style={{
                backgroundColor: layers[item.key] ? item.color : 'transparent',
                borderColor: item.color,
              }}
            />
            <span className={`${item.icon ? subText : ''}`}>{item.icon}</span>
            <span className={`text-xs font-medium ${layers[item.key] ? text : subText}`}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};


export default LayerTogglePanel;
