import React from 'react';
import { Layers, Map, Grid3x3, Hexagon, Activity, Thermometer, Square, X } from 'lucide-react';
import { type MapLayerState } from '../../src/stores/dashboard.store';

export type { MapLayerState };

interface LayerTogglePanelProps {
  darkMode: boolean;
  layers: MapLayerState;
  onToggle: (layer: keyof MapLayerState) => void;
  visible: boolean;
  onClose: () => void;
}

interface LayerItem {
  key: keyof MapLayerState;
  label: string;
  icon: React.ReactNode;
  /** Swatch colour — paired with `boundaryLayers.ts` so the legend matches the map. */
  color: { dark: string; light: string };
}

const LAYER_ITEMS: LayerItem[] = [
  { key: 'emissionGrid', label: 'Emissions Grid', icon: <Square size={16} />, color: { dark: '#d97a4d', light: '#d97a4d' } },
  { key: 'states', label: 'State Boundaries', icon: <Map size={16} />, color: { dark: '#2dd4bf', light: '#115e59' } },
  { key: 'lgas', label: 'LGA Boundaries', icon: <Grid3x3 size={16} />, color: { dark: '#64748b', light: '#cbd5e1' } },
  { key: 'oilBlocks', label: 'Oil Blocks', icon: <Hexagon size={16} />, color: { dark: '#94a3b8', light: '#475569' } },
  { key: 'pipelines', label: 'Pipelines', icon: <Activity size={16} />, color: { dark: '#ef4444', light: '#dc2626' } },
  { key: 'satelliteView', label: 'Satellite Imagery', icon: <Layers size={16} />, color: { dark: '#10b981', light: '#10b981' } },
  { key: 'emissionHotspots', label: 'Emission Hotspots', icon: <Thermometer size={16} />, color: { dark: '#f97316', light: '#f97316' } },
];

const LayerTogglePanel: React.FC<LayerTogglePanelProps> = ({ darkMode, layers, onToggle, visible, onClose }) => {
  if (!visible) return null;

  const bg = darkMode ? 'bg-[#12161f]/95' : 'bg-white/95';
  const border = darkMode ? 'border-[#1e2430]' : 'border-gray-200';
  const text = darkMode ? 'text-white' : 'text-gray-900';
  const subText = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`absolute top-32 md:top-44 right-16 md:right-20 z-30 ${bg} backdrop-blur-sm rounded-xl border ${border} shadow-xl p-3 md:p-4 w-48 md:w-56`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-teal-500" />
          <span className={`text-sm font-bold ${text}`}>Layers</span>
        </div>
        <button onClick={onClose} className={`text-xs ${subText} hover:text-teal-500`}>
          <X size={14} />
        </button>
      </div>
      <div className="space-y-1">
        {LAYER_ITEMS.map(item => {
          const swatch = darkMode ? item.color.dark : item.color.light;
          return (
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
                  backgroundColor: layers[item.key] ? swatch : 'transparent',
                  borderColor: swatch,
                }}
              />
              <span className={`${item.icon ? subText : ''}`}>{item.icon}</span>
              <span className={`text-xs font-medium ${layers[item.key] ? text : subText}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};


export default LayerTogglePanel;
