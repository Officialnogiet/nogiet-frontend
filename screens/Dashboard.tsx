
import React, { useState } from 'react';
import { AuthScreen, DashboardView } from '../types';
import Sidebar from '../components/Sidebar';
import LiveMap from '../components/LiveMap';
import DataComparison from '../components/DataComparison';
import FilterPanel from '../components/FilterPanel';
import UserManagement from '../components/UserManagement';

interface DashboardProps {
  onNavigate: (screen: AuthScreen) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, darkMode, onToggleDarkMode }) => {
  const [activeView, setActiveView] = useState<DashboardView>('LIVE_MAP');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const renderContent = () => {
    switch (activeView) {
      case 'LIVE_MAP':
        return <LiveMap onOpenFilters={() => setIsFilterOpen(true)} darkMode={darkMode} />;
      case 'DATA_COMPARISON':
        return <DataComparison darkMode={darkMode} />;
      case 'SETTINGS':
        return <UserManagement darkMode={darkMode} />;
      default:
        return <LiveMap onOpenFilters={() => setIsFilterOpen(true)} darkMode={darkMode} />;
    }
  };

  return (
    <div className={`flex h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0b0e14]' : 'bg-gray-50'} overflow-hidden`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={() => onNavigate(AuthScreen.LOGIN)}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
      />

      <main className="flex-1 relative overflow-hidden flex flex-col">
        {renderContent()}

        {/* Filter Panel Drawer Overlay */}
        {isFilterOpen && (
          <FilterPanel onClose={() => setIsFilterOpen(false)} darkMode={darkMode} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
