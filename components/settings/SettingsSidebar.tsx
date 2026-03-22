import React from 'react';

type SettingsTab = 'USER_MANAGEMENT' | 'ROLE_MANAGEMENT';

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
  darkMode: boolean;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, setActiveTab, darkMode }) => (
  <div className="w-64 space-y-6">
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Categories</p>
    <div className="space-y-2">
      <button
        onClick={() => setActiveTab('USER_MANAGEMENT')}
        className={`w-full text-left px-4 py-3 font-bold rounded-xl text-sm transition-all border-l-4 ${activeTab === 'USER_MANAGEMENT' ? 'bg-[#009688]/10 text-[#009688] border-[#009688]' : darkMode ? 'text-gray-500 hover:bg-gray-800/50 border-transparent' : 'text-gray-400 hover:bg-gray-50 border-transparent'}`}
      >
        User Management
      </button>
      <button
        onClick={() => setActiveTab('ROLE_MANAGEMENT')}
        className={`w-full text-left px-4 py-3 font-bold rounded-xl text-sm transition-all border-l-4 ${activeTab === 'ROLE_MANAGEMENT' ? 'bg-[#009688]/10 text-[#009688] border-[#009688]' : darkMode ? 'text-gray-500 hover:bg-gray-800/50 border-transparent' : 'text-gray-400 hover:bg-gray-50 border-transparent'}`}
      >
        Role Management
      </button>
    </div>
  </div>
);

export default SettingsSidebar;
