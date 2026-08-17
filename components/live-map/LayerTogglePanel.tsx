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
  { key: 'emissionGrid', label: 'Emissions Grid', icon: <Square size={16} />, color: { dark: '#fbbf24', light: '#b45309' } },
  { key: 'states', label: 'State Boundaries', icon: <Map size={16} />, color: { dark: '#2dd4bf', light: '#0f766e' } },
  { key: 'lgas', label: 'LGA Boundaries', icon: <Grid3x3 size={16} />, color: { dark: '#60a5fa', light: '#2563eb' } },
  { key: 'oilBlocks', label: 'Oil Blocks', icon: <Hexagon size={16} />, color: { dark: '#cbd5e1', light: '#94a3b8' } },
  { key: 'pipelines', label: 'Pipelines', icon: <Activity size={16} />, color: { dark: '#fb7185', light: '#be123c' } },
  { key: 'satelliteView', label: 'Satellite Imagery', icon: <Layers size={16} />, color: { dark: '#34d399', light: '#047857' } },
  { key: 'emissionHotspots', label: 'Emission Hotspots', icon: <Thermometer size={16} />, color: { dark: '#f472b6', light: '#be185d' } },
];

const LayerTogglePanel: React.FC<LayerTogglePanelProps> = ({ darkMode, layers, onToggle, visible, onClose }) => {
  if (!visible) return null;

  const bg = darkMode ? 'bg-[#111827]/98' : 'bg-white/98';
  const border = darkMode ? 'border-[#1e2430]' : 'border-slate-200/90';
  const text = darkMode ? 'text-white' : 'text-gray-900';
  const subText = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`absolute top-24 md:top-32 right-4 md:right-20 z-30 ${bg} backdrop-blur-xl rounded-2xl border ${border} ${darkMode ? 'shadow-[0_18px_50px_rgba(0,0,0,0.28)]' : 'shadow-[0_16px_40px_rgba(15,23,42,0.14)]'} p-3.5 w-[calc(100%-2rem)] max-w-[17rem]`}>
      <div className={`flex items-center justify-between pb-3 mb-2 px-1 border-b ${darkMode ? 'border-white/[0.06]' : 'border-slate-100'}`}>
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-teal-500" />
          <span
            className="text-sm font-bold"
            style={{ color: darkMode ? '#f8fafc' : '#0f172a' }}
          >
            Layers
          </span>
        </div>
        <button aria-label="Close map layers" onClick={onClose} className={`p-1.5 rounded-lg ${subText} hover:bg-teal-500/10 hover:text-teal-500`}>
          <X size={14} />
        </button>
      </div>
      <div className="space-y-1 rounded-xl p-1">
        {LAYER_ITEMS.map(item => {
          const swatch = darkMode ? item.color.dark : item.color.light;
          return (
            <button
              key={item.key}
              onClick={() => onToggle(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                layers[item.key]
                  ? darkMode ? 'bg-teal-500/[0.07] border-teal-500/20' : 'bg-white border-slate-200 shadow-sm'
                  : 'border-transparent'
              } ${darkMode ? 'hover:bg-white/5 hover:border-white/[0.06]' : 'hover:bg-slate-50 hover:border-slate-200/70'}`}
            >
              <div
                className="w-3.5 h-3.5 rounded-[5px] flex-shrink-0 border-2 shadow-sm"
                style={{
                  backgroundColor: layers[item.key] ? swatch : 'transparent',
                  borderColor: swatch,
                }}
              />
              <span className={`${item.icon ? subText : ''} flex items-center`}>{item.icon}</span>
              <span className={`text-[13px] font-medium leading-none ${layers[item.key] ? text : subText}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};


export default LayerTogglePanel;
