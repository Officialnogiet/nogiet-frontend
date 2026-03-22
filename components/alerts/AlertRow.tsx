import React from 'react';
import { AlertTriangle, AlertCircle, Info, ChevronDown } from 'lucide-react';

interface AlertRowProps {
  alert: {
    id: string;
    title: string;
    description?: string;
    emissionRate?: number;
    severity: string;
    sourceName?: string;
    createdAt: string;
    isRead?: number;
  };
  darkMode: boolean;
}

const SEVERITY_STYLES: Record<string, { icon: React.ReactNode; badge: string; border: string }> = {
  critical: {
    icon: <AlertTriangle size={18} className="text-red-500" />,
    badge: 'bg-red-500/15 text-red-500',
    border: 'border-l-red-500',
  },
  high: {
    icon: <AlertCircle size={18} className="text-orange-500" />,
    badge: 'bg-orange-500/15 text-orange-500',
    border: 'border-l-orange-500',
  },
  medium: {
    icon: <Info size={18} className="text-yellow-500" />,
    badge: 'bg-yellow-500/15 text-yellow-500',
    border: 'border-l-yellow-500',
  },
  low: {
    icon: <Info size={18} className="text-blue-500" />,
    badge: 'bg-blue-500/15 text-blue-500',
    border: 'border-l-blue-500',
  },
};

const AlertRow: React.FC<AlertRowProps> = ({ alert, darkMode }) => {
  const style = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.medium;
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className={`border-l-4 ${style.border} transition-colors`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full px-8 py-5 flex items-center gap-4 text-left transition-colors ${
          darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'
        } ${alert.isRead ? 'opacity-60' : ''}`}
      >
        {style.icon}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{alert.title}</p>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {new Date(alert.createdAt).toLocaleString()}
            {alert.sourceName && ` · ${alert.sourceName}`}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${style.badge}`}>
          {alert.severity}
        </span>
        {alert.emissionRate != null && (
          <span className={`text-sm font-bold tabular-nums ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {alert.emissionRate.toFixed(1)} kg/hr
          </span>
        )}
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && alert.description && (
        <div className={`px-8 pb-5 pl-16 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <p className="text-sm">{alert.description}</p>
        </div>
      )}
    </div>
  );
};

export default AlertRow;
