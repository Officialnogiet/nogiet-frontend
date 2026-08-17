import React, { useState, useMemo, useEffect } from 'react';
import { Bell, CheckCircle, Filter, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAlerts, useMarkAllAlertsRead } from '../src/hooks/useEmissions';
import AlertRow from './alerts/AlertRow';
import CreateAlertModal from './alerts/CreateAlertModal';

interface AlertsDashboardProps {
  darkMode?: boolean;
}

const SEVERITY_OPTIONS = ['all', 'critical', 'high', 'medium', 'low'] as const;
const PAGE_SIZE = 10;

const AlertsDashboard: React.FC<AlertsDashboardProps> = ({ darkMode = true }) => {
  const { data: alerts = [], isLoading } = useAlerts();
  const markAllRead = useMarkAllAlertsRead();

  useEffect(() => { markAllRead.mutate(); }, []);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return severityFilter === 'all'
      ? (alerts as any[])
      : (alerts as any[]).filter((a: any) => a.severity === severityFilter);
  }, [alerts, severityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (f: string) => {
    setSeverityFilter(f);
    setPage(1);
  };

  const counts = {
    critical: (alerts as any[]).filter((a: any) => a.severity === 'critical').length,
    high: (alerts as any[]).filter((a: any) => a.severity === 'high').length,
    medium: (alerts as any[]).filter((a: any) => a.severity === 'medium').length,
    low: (alerts as any[]).filter((a: any) => a.severity === 'low').length,
  };

  return (
    <div className={`flex-1 overflow-y-auto p-5 sm:p-7 lg:p-10 transition-colors duration-300 ${darkMode ? 'bg-[#0b0e14]' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-red-500/10' : 'bg-red-50'}`}>
              <Bell className="text-red-500" size={28} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-500">Monitoring</p>
              <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Alerts</h1>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {(alerts as any[]).length} total alerts from emission monitoring
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20"
          >
            <Plus size={18} />
            Create Alert
          </button>
        </div>

        {showCreateModal && (
          <CreateAlertModal darkMode={darkMode} onClose={() => setShowCreateModal(false)} onCreated={() => setShowCreateModal(false)} />
        )}

        <SeverityCards darkMode={darkMode} counts={counts} />

        <div className={`mt-8 rounded-3xl border overflow-hidden ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'}`}>
          <div className={`px-4 sm:px-8 py-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${darkMode ? 'border-[#1e2430]' : 'border-gray-100'}`}>
            <div className="flex items-center gap-2">
              <Filter size={16} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
              <span className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Filter by severity</span>
            </div>
            <div className="flex gap-2 overflow-x-auto max-w-full pb-1">
              {SEVERITY_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleFilterChange(opt)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                    severityFilter === opt
                      ? 'bg-teal-600 text-white'
                      : darkMode ? 'bg-[#0b0e14] text-gray-400 hover:bg-[#1e2430]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
            </div>
          ) : paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <CheckCircle className={`mb-4 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} size={48} />
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {severityFilter === 'all' ? 'No alerts yet' : `No ${severityFilter} alerts`}
              </p>
            </div>
          ) : (
            <div className={`divide-y ${darkMode ? 'divide-[#1e2430]/50' : 'divide-gray-100'}`}>
              {paged.map((alert: any) => (
                <AlertRow key={alert.id} alert={alert} darkMode={darkMode} />
              ))}
            </div>
          )}

          {filtered.length > PAGE_SIZE && (
            <div className={`px-8 py-4 border-t flex items-center justify-between ${darkMode ? 'border-[#1e2430]' : 'border-gray-100'}`}>
              <span className={`text-xs font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className={`p-2 rounded-xl transition-all disabled:opacity-30 ${darkMode ? 'hover:bg-[#1e2430] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                  Math.max(0, page - 3), Math.min(totalPages, page + 2)
                ).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${p === page ? 'bg-teal-600 text-white' : darkMode ? 'text-gray-400 hover:bg-[#1e2430]' : 'text-gray-500 hover:bg-gray-100'}`}>
                    {p}
                  </button>
                ))}
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className={`p-2 rounded-xl transition-all disabled:opacity-30 ${darkMode ? 'hover:bg-[#1e2430] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SeverityCards: React.FC<{ darkMode: boolean; counts: Record<string, number> }> = ({ darkMode, counts }) => {
  const cards = [
    { label: 'Critical', count: counts.critical, color: 'text-red-500', bg: darkMode ? 'bg-red-500/8' : 'bg-red-50' },
    { label: 'High', count: counts.high, color: 'text-orange-500', bg: darkMode ? 'bg-orange-500/8' : 'bg-orange-50' },
    { label: 'Medium', count: counts.medium, color: 'text-yellow-500', bg: darkMode ? 'bg-yellow-500/8' : 'bg-yellow-50' },
    { label: 'Low', count: counts.low, color: 'text-blue-500', bg: darkMode ? 'bg-blue-500/8' : 'bg-blue-50' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((c) => (
        <div key={c.label} className={`rounded-2xl p-4 sm:p-6 border transition-all hover:-translate-y-0.5 ${darkMode ? 'border-white/[0.07]' : 'border-slate-200/80'} ${c.bg}`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{c.label}</p>
          <p className={`text-3xl font-black ${c.color}`}>{c.count}</p>
        </div>
      ))}
    </div>
  );
};

export default AlertsDashboard;
