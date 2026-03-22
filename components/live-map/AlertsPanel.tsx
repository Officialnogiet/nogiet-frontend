import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export interface AlertItem {
  id: string;
  title: string;
  description?: string | null;
  emissionRate?: number | null;
  severity?: string | null;
  createdAt: string;
}

interface AlertsPanelProps {
  darkMode: boolean;
  alerts: AlertItem[];
  onClose: () => void;
  onViewAll?: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ darkMode, alerts, onClose, onViewAll }) => (
  <div className={`absolute top-36 left-28 backdrop-blur-xl rounded-3xl shadow-2xl w-96 border p-6 z-50 transition-colors ${darkMode ? 'bg-[#12161f]/95 border-[#1e2430]' : 'bg-white/95 border-gray-100'}`}>
    <div className="flex justify-between items-center mb-5">
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle size={20} />
        <span className="font-bold text-lg">Recent Alerts</span>
      </div>
      <button onClick={onClose} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}>
        <X size={18} />
      </button>
    </div>

    <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
      {alerts.length === 0 && (
        <p className={`text-sm text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No recent alerts</p>
      )}
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-5 rounded-2xl border transition-all cursor-pointer group ${darkMode ? 'bg-[#0b0e14]/50 border-[#1e2430] hover:border-red-500/50 hover:bg-red-500/5' : 'bg-gray-50 border-gray-100 hover:border-red-200 hover:bg-red-50/50'}`}
        >
          <div className="flex items-start gap-4">
            <div className="mt-1 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] group-hover:scale-125 transition-transform" />
            <div>
              <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{alert.title}</p>
              <div className="flex items-center gap-2 text-xs mt-1.5">
                {alert.emissionRate != null && (
                  <><span className="text-teal-500 font-medium">{alert.emissionRate}kg/hr</span><span className="text-gray-600">&bull;</span></>
                )}
                <span className="text-gray-500">{timeAgo(alert.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>

    <button
      onClick={onViewAll}
      className={`w-full mt-6 py-4 rounded-2xl font-bold transition-colors ${darkMode ? 'bg-gray-800 text-teal-400 hover:bg-gray-750' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}
    >
      View All Alerts
    </button>
  </div>
);

export default AlertsPanel;
