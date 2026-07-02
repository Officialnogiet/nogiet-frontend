
import React, { useMemo } from 'react';
import { DashboardView } from '../types';
import { useAuthStore } from '../src/stores/auth.store';
import { useSettingsStore } from '../src/stores/settings.store';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed, onToggle, activeView, onViewChange, onLogout, darkMode, onToggleDarkMode
}) => {
  const user = useAuthStore((s) => s.user);
  const isFacilityOwner = user?.role === 'facility_owner';
  const { mapStyle, setMapStyle } = useSettingsStore();

  const allMenuItems = [
    {
      id: 'DASHBOARD_HOME' as DashboardView, label: 'Dashboard', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" /></svg>
      )
    },
    {
      id: 'LIVE_MAP' as DashboardView, label: 'Live Map', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
      )
    },
    {
      id: 'METHANE_TRENDS' as DashboardView, label: 'Methane Trends', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 17l6-6 4 4 8-8M14 7h7v7" /></svg>
      )
    },
    {
      id: 'METHANE_CONVERTER' as DashboardView, label: 'Methane Converter', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 7h6m-7 4h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" /></svg>
      )
    },
    {
      id: 'DATA_COMPARISON' as DashboardView, label: 'Data Comparison', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      )
    },
    {
      id: 'DATA_TABS' as DashboardView, label: 'Data Explorer', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
      )
    },
    {
      id: 'MANAGE_DATA' as DashboardView, label: 'Manage Data', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      )
    },
    {
      id: 'ALERTS' as DashboardView, label: 'Alerts', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
      )
    },
    {
      id: 'FIELD_DATA' as DashboardView, label: 'Field Data', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
      )
    },
    {
      id: 'USER_MANAGEMENT' as DashboardView, label: 'User Management', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
      )
    },
    {
      id: 'DOCS' as DashboardView, label: 'Documentation', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
      )
    },
  ];

  const menuItems = useMemo(() => {
    if (isFacilityOwner) {
      return allMenuItems.filter(item => item.id === 'FIELD_DATA' || item.id === 'METHANE_CONVERTER' || item.id === 'DOCS');
    }
    return allMenuItems;
  }, [isFacilityOwner]);

  const bgColor = darkMode ? 'bg-[#0b0e14]' : 'bg-white';
  const borderColor = darkMode ? 'border-[#1e2430]' : 'border-gray-100';
  const textColor = darkMode ? 'text-gray-400' : 'text-gray-500';
  const activeBg = darkMode ? 'bg-[#009688]/10' : 'bg-gray-100';
  const labelColor = darkMode ? 'text-gray-500' : 'text-gray-400';

  return (
    // h-full pins the sidebar to the parent flex row's height (Dashboard wraps
    // it in `flex h-screen`), so the middle scrollable region always knows
    // what "full height" means. Without this, on small/zoomed viewports the
    // aside would expand to fit its intrinsic content height and the footer
    // (user pill + Logout) would slide off-screen with no scroll mechanism.
    <aside className={`${bgColor} ${borderColor} border-r h-full flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Brand Section — flex-shrink-0 prevents the brand from collapsing
          when the middle nav is taller than available space. */}
      <div className="p-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 text-[#009688] flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
              <path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" />
              <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" fill="currentColor" />
            </svg>
          </div>
          {!collapsed && <span className={`font-bold text-lg whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-800'}`}>NOGIET v1.0</span>}
        </div>
        <button onClick={onToggle} className={`p-1.5 hover:bg-opacity-10 rounded-lg text-gray-500 border ${darkMode ? 'border-gray-700 hover:bg-white' : 'border-gray-100 hover:bg-gray-50'}`}>
          <svg className={`w-3.5 h-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
        </button>
      </div>

      {/* Middle nav — `min-h-0` lets this flex child shrink below its content
          size so `overflow-y-auto` can actually scroll. On a ~600px-tall
          viewport (small laptop at 125% scaling) the menu + system sections
          exceed the available space; without scroll, the user pill and Logout
          button get pushed off-screen and become unreachable. */}
      <div className="mt-4 px-4 flex-1 min-h-0 overflow-y-auto space-y-8 sidebar-scroll">
        {/* Menu Section */}
        <div>
          {!collapsed && <p className={`text-[10px] font-bold ${labelColor} uppercase tracking-widest px-2 mb-3`}>Menu</p>}
          <div className="space-y-1">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${activeView === item.id ? `${activeBg} text-[#009688]` : `${textColor} hover:bg-white/5`}`}
              >
                <span className={activeView === item.id ? 'text-[#009688]' : `${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>{item.icon}</span>
                {!collapsed && <span className={`text-sm ${activeView === item.id ? 'font-bold' : 'font-medium'}`}>{item.label}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* System Section */}
        <div>
          {!collapsed && <p className={`text-[10px] font-bold ${labelColor} uppercase tracking-widest px-2 mb-3`}>System</p>}
          <div className="space-y-1">
            <button
              onClick={() => onViewChange('SETTINGS')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl group transition-all ${activeView === 'SETTINGS' ? `${activeBg} text-[#009688]` : `${textColor} hover:bg-white/5`}`}
            >
              <div className="flex items-center gap-3">
                <svg className={`w-5 h-5 ${activeView === 'SETTINGS' ? 'text-[#009688]' : 'text-gray-500 group-hover:text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {!collapsed && <span className={`text-sm ${activeView === 'SETTINGS' ? 'font-bold' : 'font-medium'}`}>Settings</span>}
              </div>
              {!collapsed && <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>}
            </button>
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-3">
                <svg className={`w-5 h-5 ${darkMode ? 'text-[#009688]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                {!collapsed && <span className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-500'}`}>Darkmode</span>}
              </div>
              {!collapsed && (
                <button
                  onClick={onToggleDarkMode}
                  className={`w-10 h-5 rounded-full relative transition-colors ${darkMode ? 'bg-[#009688]' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${darkMode ? 'left-6' : 'left-1'}`}></div>
                </button>
              )}
            </div>
            <div className="px-3 py-2.5">
              {!collapsed ? (
                <div>
                  <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Map Theme</p>
                  <div className={`flex rounded-xl p-1 ${darkMode ? 'bg-[#1e2430]' : 'bg-gray-100'}`}>
                    {([
                      ['dark', 'Dark', <svg key="d" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>],
                      ['light', 'Light', <svg key="l" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>],
                      ['satellite', 'Satellite', <svg key="s" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>],
                    ] as const).map(([style, label, icon]) => (
                      <button
                        key={style}
                        onClick={() => setMapStyle(style as 'dark' | 'light' | 'satellite')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                          mapStyle === style
                            ? 'bg-[#009688] text-white shadow-sm'
                            : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                        }`}
                        title={label}
                      >
                        {icon}
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    const next = mapStyle === 'dark' ? 'light' : mapStyle === 'light' ? 'satellite' : 'dark';
                    setMapStyle(next);
                  }}
                  className={`w-full flex justify-center p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-white/5 text-gray-500' : 'hover:bg-gray-50 text-gray-400'}`}
                  title={`Map: ${mapStyle}`}
                >
                  {mapStyle === 'dark' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                  ) : mapStyle === 'light' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer — flex-shrink-0 so the user pill + Logout always stay visible
          even when the middle nav scrolls. */}
      <div className={`p-4 border-t flex-shrink-0 ${darkMode ? 'border-gray-800' : 'border-gray-50'} space-y-4`}>
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-[#009688] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {(user?.fullName ?? 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className={`font-bold text-sm text-[#009688] truncate`}>{user?.fullName ?? 'User'}</p>
              <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'} font-medium capitalize`}>
                {user?.role?.replace('_', ' ') ?? 'member'}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          {!collapsed && <span className={`font-bold text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Log out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
