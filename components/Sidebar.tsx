
import React from 'react';
import { DashboardView } from '../types';

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
  const menuItems = [
    {
      id: 'LIVE_MAP' as DashboardView, label: 'Live Map', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
      )
    },
    {
      id: 'DATA_COMPARISON' as DashboardView, label: 'Data Comparison', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      )
    },
  ];

  const bgColor = darkMode ? 'bg-[#0b0e14]' : 'bg-white';
  const borderColor = darkMode ? 'border-[#1e2430]' : 'border-gray-100';
  const textColor = darkMode ? 'text-gray-400' : 'text-gray-500';
  const activeBg = darkMode ? 'bg-[#009688]/10' : 'bg-gray-100';
  const labelColor = darkMode ? 'text-gray-500' : 'text-gray-400';

  return (
    <aside className={`${bgColor} ${borderColor} border-r flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Brand Section */}
      <div className="p-6 flex items-center justify-between">
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

      <div className="mt-4 px-4 flex-1 space-y-8">
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
          </div>
        </div>
      </div>

      <div className={`p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-50'} space-y-4`}>
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-[#009688] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">JO</div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className={`font-bold text-sm ${darkMode ? 'text-[#009688]' : 'text-[#009688]'} truncate`}>Jerry Okechukwu</p>
              <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'} font-medium`}>Super admin</p>
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
