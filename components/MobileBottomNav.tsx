import React, { useState } from 'react';
import type { DashboardView } from '../types';

interface MobileBottomNavProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  onLogout: () => void;
  darkMode: boolean;
}

const NAV_ITEMS: { id: DashboardView; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    id: 'DASHBOARD_HOME',
    label: 'Home',
    icon: (a) => (
      <svg className="w-5 h-5" fill={a ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
      </svg>
    ),
  },
  {
    id: 'LIVE_MAP',
    label: 'Map',
    icon: (a) => (
      <svg className="w-5 h-5" fill={a ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    id: 'DATA_TABS',
    label: 'Data',
    icon: (a) => (
      <svg className="w-5 h-5" fill={a ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    id: 'ALERTS',
    label: 'Alerts',
    icon: (a) => (
      <svg className="w-5 h-5" fill={a ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a ? 0 : 1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
];

const MORE_ITEMS: { id: DashboardView; label: string }[] = [
  { id: 'METHANE_TRENDS', label: 'Methane Trends' },
  { id: 'METHANE_CONVERTER', label: 'Methane Converter' },
  { id: 'MANAGE_DATA', label: 'Manage Data' },
  { id: 'DATA_COMPARISON', label: 'Data Comparison' },
  { id: 'FIELD_DATA', label: 'Field Data' },
  { id: 'USER_MANAGEMENT', label: 'User Management' },
  { id: 'DOCS', label: 'Documentation' },
  { id: 'SETTINGS', label: 'Settings' },
];

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeView, onViewChange, onLogout, darkMode }) => {
  const [showMore, setShowMore] = useState(false);
  const dm = darkMode;
  const isMoreActive = MORE_ITEMS.some(i => i.id === activeView);

  return (
    <>
      {showMore && (
        <div className="fixed inset-0 z-[90] flex flex-col justify-end" onClick={() => setShowMore(false)}>
          <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm`} />
          <div
            className={`relative z-10 rounded-t-2xl border-t shadow-2xl pb-20 ${dm ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className={`w-10 h-1 rounded-full ${dm ? 'bg-gray-700' : 'bg-gray-300'}`} />
            </div>
            <div className="px-4 py-2 space-y-1">
              {MORE_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => { onViewChange(item.id); setShowMore(false); }}
                  className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                    activeView === item.id
                      ? 'bg-[#009688]/10 text-[#009688]'
                      : dm ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => { onLogout(); setShowMore(false); }}
                className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className={`fixed bottom-0 left-0 right-0 z-[80] border-t safe-area-bottom ${dm ? 'bg-[#0b0e14]/95 border-[#1e2430]' : 'bg-white/95 border-gray-200'} backdrop-blur-md`}>
        <div className="flex items-stretch">
          {NAV_ITEMS.map(item => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                  active ? 'text-[#009688]' : dm ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                {item.icon(active)}
                <span className={`text-[10px] font-semibold ${active ? 'text-[#009688]' : ''}`}>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowMore(v => !v)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
              isMoreActive || showMore ? 'text-[#009688]' : dm ? 'text-gray-500' : 'text-gray-400'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            <span className={`text-[10px] font-semibold ${isMoreActive || showMore ? 'text-[#009688]' : ''}`}>More</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
